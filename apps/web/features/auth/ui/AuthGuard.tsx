"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../model/use-auth";
import { apiClient } from "@/shared/api/api-client";
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
            try {
              await apiClient.get('/users/profile');
              break;
            } catch (error) {
              retries++;
              if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              } else {
                console.warn("Profile not found after retries.");
              }
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-12 flex flex-col items-center justify-center min-w-[300px] shadow-xl">
          <LoadingSpinner size="lg" message="Initializing..." />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
