"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Block, type Attempt, type AttemptWithNickname } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCurrentBlock() {
  return useQuery({
    queryKey: ["currentBlock"],
    queryFn: async (): Promise<(Block & { winner_nickname?: string; creator_nickname?: string }) | null> => {
      const { data, error } = await supabase
        .from("blocks_public")
        .select("*")
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const block = data[0];

      // Fetch winner nickname if exists
      let winner_nickname: string | undefined;
      if (block.winner_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", block.winner_id)
          .single();
        winner_nickname = profile?.nickname || "Anonymous";
      }

      // Fetch creator nickname if exists
      let creator_nickname: string | undefined;
      if (block.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", block.created_by)
          .single();
        creator_nickname = profile?.nickname || "Anonymous";
      }

      return {
        ...block,
        winner_nickname,
        creator_nickname,
      };
    },
    refetchInterval: 5000,
  });
}

export function useAttempts(blockId: number | undefined) {
  const [attempts, setAttempts] = useState<AttemptWithNickname[]>([]);
  const [newAttemptId, setNewAttemptId] = useState<string | undefined>();

  useEffect(() => {
    if (!blockId) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from("attempts_with_nickname")
        .select("*")
        .eq("block_id", blockId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setAttempts(data);
    };

    fetchInitial();

    const channel = supabase
      .channel(`attempts:${blockId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attempts",
          filter: `block_id=eq.${blockId}`,
        },
        async (payload) => {
          const newAttempt = payload.new as Attempt;
          
          // nickname 조회
          const { data: profile } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", newAttempt.user_id)
            .single();
          
          const attemptWithNickname: AttemptWithNickname = {
            ...newAttempt,
            nickname: profile?.nickname || "Anonymous"
          };
          
          setAttempts((prev) => [attemptWithNickname, ...prev.slice(0, 49)]);
          setNewAttemptId(newAttempt.id);
          setTimeout(() => setNewAttemptId(undefined), 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [blockId]);

  return { attempts, newAttemptId };
}

export function useBlockSubscription(onBlockChange: (block: Block) => void) {
  useEffect(() => {
    const channel = supabase
      .channel("blocks:status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "blocks",
        },
        (payload) => {
          onBlockChange(payload.new as Block);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onBlockChange]);
}

export function useCurrentCP(userId: string | undefined) {
  return useQuery({
    queryKey: ["currentCP", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { data, error } = await supabase.rpc("get_current_cp", {
        p_user_id: userId,
      });

      if (error) throw error;
      return data ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 60000,
  });
}

export function useCheckAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inputValue,
      blockId,
    }: {
      inputValue: string;
      blockId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('check-answer', {
        body: {
          inputValue,
          blockId,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentCP"] });

      if (data.correct) {
        queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
      }
    },
  });
}

export function useGenerateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seedHint,
      previousBlockId,
    }: {
      seedHint: string;
      previousBlockId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-block', {
        body: {
          seedHint,
          previousBlockId,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentBlock"] });
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string; is_anonymous?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAndSetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          const expectedRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
          
          if (payload.iss === "supabase-demo" || 
              (payload.ref && expectedRef && payload.ref !== expectedRef)) {
            console.warn('⚠️ Invalid session detected (wrong Supabase instance). Clearing...');
            await supabase.auth.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to validate JWT:', e);
        }
      }
      
      setUser(session?.user ? {
        id: session.user.id,
        email: session.user.email,
        is_anonymous: session.user.is_anonymous,
      } : null);
      setLoading(false);
    };

    validateAndSetSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? {
        id: session.user.id,
        email: session.user.email,
        is_anonymous: session.user.is_anonymous,
      } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, nickname: string) => {
    const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authUser) throw new Error("Failed to create user");

    return { user: authUser };
  }, []);

  const convertAnonymousToEmail = useCallback(async (email: string) => {
    const { data, error } = await supabase.auth.updateUser({
      email,
    });
    if (error) throw error;
    return data;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const updateNickname = useCallback(async (userId: string, nickname: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ nickname })
      .eq("id", userId);
    
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { 
    user, 
    loading, 
    isAnonymous: user?.is_anonymous ?? false,
    signInWithPassword,
    signUpWithEmail,
    convertAnonymousToEmail,
    updatePassword,
    updateNickname,
    signOut 
  };
}
