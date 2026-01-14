"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useGame";
import { supabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (user && !loading) {
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

          if (!existingProfile) {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                nickname: user.email?.split("@")[0] || "User",
                cp_count: 50,
                last_cp_refill_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error("Failed to create profile:", insertError);
            }
          }
        } catch (error) {
          console.error("Profile check failed:", error);
        }
      }

      setInitializing(false);
    };

    initialize();
  }, [user, loading]);

  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
