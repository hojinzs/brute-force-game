"use server";

export async function createGenesisBlock(seedHint: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Genesis Block - Environment check:", {
    hasUrl: !!supabaseUrl,
    urlValue: supabaseUrl,
    hasServiceKey: !!serviceRoleKey,
    hasAnonKey: !!anonKey,
  });

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    throw new Error("Missing Supabase configuration");
  }

  const requestBody = {
    seedHint: seedHint.trim() || "genesis",
    isGenesis: true,
  };

  console.log("Genesis Block - Request:", {
    url: `${supabaseUrl}/functions/v1/generate-block`,
    body: requestBody,
  });

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-block`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("Genesis Block - Response:", {
    status: response.status,
    statusText: response.statusText,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Edge Function error response:", errorText);

    try {
      const errorData = JSON.parse(errorText);
      throw new Error(
        errorData.error || errorData.details || "Failed to create genesis block"
      );
    } catch {
      throw new Error(
        `Failed to create genesis block: ${response.status} - ${errorText}`
      );
    }
  }

  return response.json();
}
