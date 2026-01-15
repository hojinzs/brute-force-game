import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { hashPassword } from "../_shared/utils/crypto.ts";
import { buildCharset, describeCharset, type CharsetType } from "../_shared/utils/charset.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  seedHint?: string;
  previousBlockId?: number;
  isGenesis?: boolean;
}

interface DifficultyConfig {
  length: number;
  charset: CharsetType[];
}

interface ChatGPTResponse {
  password: string;
  difficulty_desc: string;
}

async function callChatGPT(
  seedHint: string,
  difficultyConfig: DifficultyConfig
): Promise<ChatGPTResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callChatGPTOnce(seedHint, difficultyConfig, attempt);
    } catch (error) {
      lastError = error as Error;
      console.error(`ChatGPT attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
      }
    }
  }

  throw lastError!;
}

async function callChatGPTOnce(
  seedHint: string,
  difficultyConfig: DifficultyConfig,
  attempt: number
): Promise<ChatGPTResponse> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const allowedChars = buildCharset(difficultyConfig.charset);
  const charsetDesc = describeCharset(difficultyConfig.charset);

  const prompt = `You are a password generator for a hacking simulation game.

CRITICAL CONSTRAINT - MUST FOLLOW:
- Password length MUST be EXACTLY ${difficultyConfig.length} characters
- NO EXCEPTIONS - Any password with different length will be rejected

Rules:
1. Generate a password that matches these constraints:
   - Length: EXACTLY ${difficultyConfig.length} characters (STRICT REQUIREMENT)
   - Allowed characters: ${allowedChars}
   - Character types: ${charsetDesc}
   - Theme hint from winner: "${seedHint}"

2. The password should be:
   - Memorable but not trivial
   - Related to the theme hint if possible
   - Use a variety of characters from the allowed set

3. Return ONLY a JSON object with this exact format:
{
  "password": "your_generated_password",
  "difficulty_desc": "brief description of what makes this password challenging"
}

REMINDER: Password length must be EXACTLY ${difficultyConfig.length} characters. Count carefully!
Do not include any other text or explanation.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a password generator that returns only valid JSON. You MUST generate passwords with exactly ${difficultyConfig.length} characters.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ChatGPT API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in ChatGPT response");
  }

  try {
    const parsed = JSON.parse(content.trim());
    
    if (!parsed.password || typeof parsed.password !== "string") {
      throw new Error("Invalid password in response");
    }

    if (parsed.password.length !== difficultyConfig.length) {
      throw new Error(
        `Password length ${parsed.password.length} must be exactly ${difficultyConfig.length} (attempt ${attempt}/3)`
      );
    }

    return {
      password: parsed.password,
      difficulty_desc: parsed.difficulty_desc || "AI-generated password",
    };
  } catch (parseError) {
    throw new Error(`Failed to parse ChatGPT response: ${parseError.message}`);
  }
}

function getDefaultDifficulty(): DifficultyConfig {
  return {
    length: 6,
    charset: ["lowercase", "alphanumeric"],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== GENERATE-BLOCK START ===");
    console.log("Step 0: Checking environment variables");
    console.log({
      hasOpenAIKey: !!Deno.env.get("OPENAI_API_KEY"),
      hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasAnonKey: !!Deno.env.get("SUPABASE_ANON_KEY"),
    });

    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      console.error("Step 0 FAILED: Missing auth header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Step 1: Parsing request body");
    const { seedHint, previousBlockId, isGenesis }: RequestBody = await req.json();
    console.log({ seedHint, previousBlockId, isGenesis });

    if (seedHint && seedHint.length > 200) {
      console.error("Step 1 FAILED: Seed hint too long");
      return new Response(
        JSON.stringify({ error: "Hint must be 200 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Step 2: Creating Supabase admin client");
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let user: { id: string } | null = null;

    if (!isGenesis) {
      console.log("Step 3: Authenticating user (non-genesis)");
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
        data: { user: authenticatedUser },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !authenticatedUser) {
        console.error("Step 3 FAILED: Auth error", userError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      user = authenticatedUser;
      console.log("Step 3 SUCCESS: User authenticated", { userId: user.id });
    } else {
      console.log("Step 3 SKIPPED: Genesis block (no auth required)");
    }

    let difficultyConfig: DifficultyConfig = getDefaultDifficulty();
    const finalSeedHint = seedHint || "System Generated";
    console.log("Step 4: Difficulty config set", { difficultyConfig, finalSeedHint });

    if (previousBlockId) {
      console.log("Step 5: Checking previous block", { previousBlockId });
      const { data: previousBlock } = await supabaseAdmin
        .from("blocks")
        .select("difficulty_config, winner_id, status")
        .eq("id", previousBlockId)
        .single();

      if (!previousBlock) {
        console.error("Step 5 FAILED: Previous block not found");
        return new Response(
          JSON.stringify({ error: "Previous block not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (previousBlock.status !== "pending") {
        console.error("Step 5 FAILED: Block status is not pending", { status: previousBlock.status });
        return new Response(
          JSON.stringify({ error: "Previous block is not in pending status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (previousBlock.winner_id && user && previousBlock.winner_id !== user.id && seedHint !== "System Generated") {
        console.error("Step 5 FAILED: Not the winner");
        return new Response(
          JSON.stringify({ error: "Only the winner can generate the next block" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Step 6: Updating previous block to processing");
      const { data: updatedBlock, error: updateError } = await supabaseAdmin
        .from("blocks")
        .update({ status: "processing" })
        .eq("id", previousBlockId)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError || !updatedBlock) {
        console.error("Step 6 FAILED: Block already processing", updateError);
        return new Response(
          JSON.stringify({ error: "Block is already being processed by another request" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (previousBlock.difficulty_config) {
        difficultyConfig = previousBlock.difficulty_config as DifficultyConfig;
      }
      console.log("Step 6 SUCCESS: Previous block updated to processing");
    } else {
      console.log("Step 5-6 SKIPPED: No previous block");
    }

    console.log("Step 7: Calling ChatGPT API");
    const chatGPTResult = await callChatGPT(finalSeedHint, difficultyConfig);
    console.log("Step 7 SUCCESS: ChatGPT response received", { 
      passwordLength: chatGPTResult.password.length,
      passwordPreview: chatGPTResult.password.substring(0, 3) + "..."
    });

    console.log("Step 8: Hashing password");
    const passwordHash = await hashPassword(chatGPTResult.password);
    console.log("Step 8 SUCCESS: Password hashed");

    console.log("Step 9: Inserting new block into database");
    const { data: newBlock, error: insertError } = await supabaseAdmin
      .from("blocks")
      .insert({
        status: "active",
        seed_hint: finalSeedHint,
        difficulty_config: difficultyConfig,
        answer_hash: passwordHash,
        answer_plaintext: chatGPTResult.password,
        winner_id: null,
        solved_at: null,
        previous_block_id: previousBlockId || null,
      })
      .select("id, status, seed_hint, difficulty_config, created_at")
      .single();

    if (insertError || !newBlock) {
      console.error("Step 9 FAILED: Insert error", insertError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create new block",
          dbError: insertError?.message,
          dbCode: insertError?.code,
          dbDetails: insertError?.details
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Step 9 SUCCESS: New block created", { blockId: newBlock.id });

    if (previousBlockId) {
      console.log("Step 10: Marking previous block as solved");
      await supabaseAdmin
        .from("blocks")
        .update({ status: "solved" })
        .eq("id", previousBlockId);
      console.log("Step 10 SUCCESS: Previous block marked solved");
    } else {
      console.log("Step 10 SKIPPED: No previous block");
    }

    console.log("=== GENERATE-BLOCK SUCCESS ===");
    return new Response(
      JSON.stringify({
        success: true,
        block: newBlock,
        difficulty_desc: chatGPTResult.difficulty_desc,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("=== GENERATE-BLOCK FATAL ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error?.constructor?.name || "Unknown",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
