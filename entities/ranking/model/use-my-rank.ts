"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import type { UserRank } from "./types";

export function useMyRank(userId: string | undefined) {
  return useQuery({
    queryKey: ["myRank", userId],
    queryFn: async (): Promise<UserRank | null> => {
      if (!userId) return null;

      // Get user profile with points
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nickname, total_points")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return null;
      }

      // Get rank using RPC function
      const { data: rank, error: rankError } = await supabase.rpc("get_user_rank", {
        p_user_id: userId,
      });

      if (rankError) {
        console.error("Failed to get user rank:", rankError);
        // Fallback: count users with more points
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("total_points", profile.total_points);

        return {
          userId: profile.id,
          nickname: profile.nickname,
          totalPoints: profile.total_points,
          rank: (count ?? 0) + 1,
        };
      }

      return {
        userId: profile.id,
        nickname: profile.nickname,
        totalPoints: profile.total_points,
        rank: rank ?? 1,
      };
    },
    enabled: !!userId,
    staleTime: 10000,
  });
}
