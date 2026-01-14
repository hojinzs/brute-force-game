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

    const { data: cpResult, error: cpError } = await supabaseAdmin.rpc("consume_cp", {
      p_user_id: user.id,
    });

    if (cpError || !cpResult) {
      return new Response(
        JSON.stringify({ error: "Insufficient CP", code: "NO_CP" } as ErrorResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: block, error: blockError } = await supabaseAdmin
      .from("blocks")
      .select("id, answer_hash, answer_plaintext, status")
      .eq("id", blockId)
      .single();

    if (blockError || !block) {
      return new Response(
        JSON.stringify({ error: "Block not found" } as ErrorResponse),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (block.status !== "active") {
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

    const inputHash = await hashPassword(inputValue);
    const isCorrect = inputHash === block.answer_hash;

    if (isCorrect) {
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
        JSON.stringify({ correct: true } as SuccessResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const similarity = calculateSimilarity(inputValue, block.answer_plaintext);

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("attempts")
      .insert({
        block_id: blockId,
        user_id: user.id,
        input_value: inputValue,
        similarity: similarity,
      })
      .select("id")
      .single();

    if (attemptError) {
      console.error("Failed to insert attempt:", attemptError);
    }

    return new Response(
      JSON.stringify({
        correct: false,
        similarity: similarity,
        attemptId: attempt?.id,
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
