import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { calculateSimilarity } from "../_shared/utils/similarity.ts";
import { hashPassword } from "../_shared/utils/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  inputValue: string;
  blockId: number;
}

interface ErrorResponse {
  error: string;
  code?: string;
}

interface SuccessResponse {
  correct: boolean;
  similarity?: number;
  attemptId?: string;
  pointsAwarded?: number;
}

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(userId) || [];
  
  const recentAttempts = attempts.filter(timestamp => now - timestamp < 1000);
  
  if (recentAttempts.length >= 2) {
    return false;
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(userId, recentAttempts);
  
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" } as ErrorResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" } as ErrorResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMITED" } as ErrorResponse),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { inputValue, blockId }: RequestBody = await req.json();

    if (!inputValue || typeof blockId !== "number") {
      return new Response(
        JSON.stringify({ error: "Invalid request body" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Consume CP
    const { data: cpResult, error: cpError } = await supabaseAdmin.rpc("consume_cp", {
      p_user_id: user.id,
    });

    if (cpError || !cpResult) {
      return new Response(
        JSON.stringify({ error: "Insufficient CP", code: "NO_CP" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get block info
    const { data: block, error: blockError } = await supabaseAdmin
      .from("blocks")
      .select("id, answer_hash, answer_plaintext, status, accumulated_points")
      .eq("id", blockId)
      .single();

    if (blockError || !block) {
      return new Response(
        JSON.stringify({ error: "Block not found" } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (block.status !== "active") {
      // Refund CP if block is no longer active
      await supabaseAdmin.rpc("get_current_cp", { p_user_id: user.id });
      await supabaseAdmin
        .from("profiles")
        .update({ cp_count: supabaseAdmin.rpc("get_current_cp", { p_user_id: user.id }) })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({ error: "Block is no longer active", code: "BLOCK_INACTIVE" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Increment block points (Prize Pool +1)
    const { data: newPoints, error: pointsError } = await supabaseAdmin.rpc("increment_block_points", {
      p_block_id: blockId,
    });

    if (pointsError) {
      console.error("Failed to increment block points:", pointsError);
    }

    // 4. Check if answer is correct
    const inputHash = await hashPassword(inputValue);
    const isCorrect = inputHash === block.answer_hash;

    if (isCorrect) {
      // =============================================
      // CORRECT ANSWER FLOW
      // =============================================
      
      // 4a. Insert attempt with similarity 100 (atomic function for first-submission tracking)
      const { data: attemptResult, error: attemptError } = await supabaseAdmin
        .rpc("insert_attempt_atomic", {
          p_block_id: blockId,
          p_user_id: user.id,
          p_input_value: inputValue,
          p_similarity: 100,
        })
        .single();

      if (attemptError) {
        console.error("Failed to insert winning attempt:", attemptError);
      }

      const attempt = attemptResult ? { id: attemptResult.attempt_id } : null;

      // 4b. Award points to winner
      const { data: awardedPoints, error: awardError } = await supabaseAdmin.rpc("award_points_to_winner", {
        p_block_id: blockId,
        p_winner_id: user.id,
      });

      if (awardError) {
        console.error("Failed to award points:", awardError);
      }

      // 4c. Update block status to pending
      const { error: updateError } = await supabaseAdmin
        .from("blocks")
        .update({
          status: "pending",
          winner_id: user.id,
          solved_at: new Date().toISOString(),
        })
        .eq("id", blockId)
        .eq("status", "active");

      if (updateError) {
        // Race condition: another user already solved it
        // Note: Points were already awarded but block update failed
        // This is acceptable as the first solver got the points
        await supabaseAdmin
          .from("profiles")
          .update({ cp_count: supabaseAdmin.rpc("get_current_cp", { p_user_id: user.id }) })
          .eq("id", user.id);

        return new Response(
          JSON.stringify({ error: "Block already solved by another user", code: "BLOCK_ALREADY_SOLVED" } as ErrorResponse),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          correct: true,
          attemptId: attempt?.id,
          pointsAwarded: awardedPoints ?? newPoints,
        } as SuccessResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =============================================
    // WRONG ANSWER FLOW
    // =============================================
    
    const similarity = calculateSimilarity(inputValue, block.answer_plaintext);

    const { data: attemptResult, error: attemptError } = await supabaseAdmin
      .rpc("insert_attempt_atomic", {
        p_block_id: blockId,
        p_user_id: user.id,
        p_input_value: inputValue,
        p_similarity: similarity,
      })
      .single();

    if (attemptError) {
      console.error("Failed to insert attempt:", attemptError);
    }

    return new Response(
      JSON.stringify({
        correct: false,
        similarity: similarity,
        attemptId: attemptResult?.attempt_id,
      } as SuccessResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-answer function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" } as ErrorResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
