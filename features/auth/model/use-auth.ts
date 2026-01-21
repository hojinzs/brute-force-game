"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/shared/api";

export type AuthUser = {
  id: string;
  email?: string;
  is_anonymous?: boolean;
};

export type SignUpParams = {
  email: string;
  password: string;
  nickname: string;
  country?: string | null;
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
            is_anonymous: session.user.is_anonymous,
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
            is_anonymous: session.user.is_anonymous,
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

      // 정식 로그인 이력 저장
      if (typeof window !== "undefined") {
        localStorage.setItem("has-logged-in", "true");
      }

      return data;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (params: SignUpParams) => {
      const { email, password, nickname, country, emailConsent, redirectTo = "/" } = params;
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const normalizedCountry = country && country.trim().length > 0 ? country : null;

      const {
        data: { user: authUser },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            country: normalizedCountry,
            email_consent: emailConsent,
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authUser) throw new Error("Failed to create user");

      // 회원가입도 정식 로그인 이력으로 간주
      if (typeof window !== "undefined") {
        localStorage.setItem("has-logged-in", "true");
      }

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
    signInAnonymously: useCallback(async (visitorId?: string) => {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            is_anonymous: true, // Tag as anonymous in metadata
            visitor_id: visitorId, // Setup Fingerprint
          },
        },
      });
      if (error) throw error;
      return data;
    }, []),
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

export function hasEverLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("has-logged-in") === "true";
}
