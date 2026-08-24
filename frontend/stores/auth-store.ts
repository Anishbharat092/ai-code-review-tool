"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/lib/services/auth.service";
import type { LoginPayload, SignupPayload, User } from "@/lib/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAccessToken: (accessToken) => {
        set({
          accessToken,
          isAuthenticated: Boolean(accessToken),
        });
      },

      setUser: (user) => set({ user }),

      fetchUser: async () => {
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      },

      login: async (payload) => {
        set({ isLoading: true });

        try {
          const { accessToken } = await authService.login(payload);

          set({
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (payload) => {
        set({ isLoading: true });

        try {
          const { accessToken } = await authService.signup(payload);

          set({
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshSession: async () => {
        try {
          const { accessToken } = await authService.refresh();

          set({
            accessToken,
            isAuthenticated: true,
          });

          await get().fetchUser();
          return true;
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });

          return false;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const { accessToken } = await authService.refresh();

          set({
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          await get().fetchUser();
          return true;
        } catch {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });

          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
