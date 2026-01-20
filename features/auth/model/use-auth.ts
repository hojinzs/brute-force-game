"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/shared/api";

export type AuthUser = {
  id: string;
  email?: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  nickname: string;
  country: string;
  emailConsent: boolean;
  redirectTo?: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
            }
          : null
      );
      setLoading(false);
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
            }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (params: SignUpParams) => {
      const { email, password, nickname, country, emailConsent, redirectTo = "/" } = params;
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      const {
        data: { user: authUser },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            country,
            email_consent: emailConsent,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authUser) throw new Error("Failed to create user");

      return { user: authUser };
    },
    []
  );

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
    signInWithPassword,
    signUpWithEmail,
    updatePassword,
    updateNickname,
    signOut,
  };
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    requiresSignup: !user && !loading,
  };
}
