"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../model/use-auth";
import { supabase } from "@/shared/api";
import { LoadingSpinner } from "@/shared/ui";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      if (user && !loading) {
        try {
          let retries = 0;
          const maxRetries = 5;

          while (retries < maxRetries) {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", user.id)
              .single();

            if (existingProfile) {
              break;
            }

            retries++;
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              console.warn("Profile not found after retries. Trigger may have failed.");
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
        <LoadingSpinner size="lg" message="Initializing..." />
      </div>
    );
  }

  return <>{children}</>;
}
