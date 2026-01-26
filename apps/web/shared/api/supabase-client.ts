import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (typeof window !== "undefined") {
  const SUPABASE_URL_KEY = "brute-force-supabase-url";
  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);

  if (storedUrl && storedUrl !== supabaseUrl) {
    console.log("🔄 Supabase URL changed from", storedUrl, "to", supabaseUrl);
    console.log("🗑️  Clearing all local storage and session storage...");

    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keysToDelete.push(key);
    }

    keysToDelete.forEach((key) => {
      console.log("   Deleting:", key);
      localStorage.removeItem(key);
    });

    sessionStorage.clear();
    console.log("✅ Session cleared! Please refresh the page.");
  }

  localStorage.setItem(SUPABASE_URL_KEY, supabaseUrl);
}

export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
