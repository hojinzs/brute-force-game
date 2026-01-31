"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/shared/api/api-client";
import { useAuthStore } from "@/shared/store/auth-store";
import { adaptUser } from "@/shared/api/adapters";

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
  const { user: storeUser, isAuthenticated, setTokens, setUser, clearTokens } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const user: AuthUser | null = storeUser ? {
    id: storeUser.id,
    email: storeUser.email,
    is_anonymous: storeUser.isAnonymous,
  } : null;

  useEffect(() => {
    setLoading(false);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.post('/users/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user: apiUser } = response.data;
      
      setTokens({ accessToken, refreshToken });
      setUser(adaptUser(apiUser));

      if (typeof window !== "undefined") {
        localStorage.setItem("has-logged-in", "true");
      }

      return { user: apiUser };
    },
    [setTokens, setUser]
  );

  const signUpWithEmail = useCallback(
    async (params: SignUpParams) => {
      const { email, password, nickname, country, emailConsent } = params;
      const normalizedCountry = country && country.trim().length > 0 ? country : undefined;

      if (storeUser?.isAnonymous) {
        const response = await apiClient.put('/users/upgrade', {
          email,
          password,
          nickname,
        });

        const { accessToken, refreshToken, user: apiUser } = response.data;
        
        setTokens({ accessToken, refreshToken });
        setUser(adaptUser(apiUser));

        if (typeof window !== "undefined") {
          localStorage.setItem("has-logged-in", "true");
        }

        return { user: apiUser };
      } else {
        const response = await apiClient.post('/users/register', {
          email,
          password,
          nickname,
          country: normalizedCountry,
          emailConsent,
        });

        const { accessToken, refreshToken, user: apiUser } = response.data;
        
        setTokens({ accessToken, refreshToken });
        setUser(adaptUser(apiUser));

        if (typeof window !== "undefined") {
          localStorage.setItem("has-logged-in", "true");
        }

        return { user: apiUser };
      }
    },
    [storeUser, setTokens, setUser]
  );

  const updatePassword = useCallback(async (password: string) => {
    await apiClient.put('/users/profile', { password });
    return { user: storeUser };
  }, [storeUser]);

  const updateNickname = useCallback(async (userId: string, nickname: string) => {
    await apiClient.put('/users/profile', { nickname });
  }, []);

  const signOut = useCallback(async () => {
    await apiClient.post('/users/logout');
    clearTokens();
  }, [clearTokens]);

  const signInAnonymously = useCallback(async (visitorId?: string) => {
    const nickname = visitorId ? `Guest_${visitorId.slice(0, 8)}` : `Guest_${Date.now()}`;
    
    const response = await apiClient.post('/users/anonymous', {
      nickname,
    });

    const { accessToken, refreshToken, user: apiUser } = response.data;
    
    setTokens({ accessToken, refreshToken });
    setUser(adaptUser(apiUser));

    return { user: apiUser };
  }, [setTokens, setUser]);

  return {
    user,
    loading,
    signInWithPassword,
    signUpWithEmail,
    updatePassword,
    updateNickname,
    signOut,
    signInAnonymously,
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
