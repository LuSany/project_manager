import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  token: string | null;
}

interface AuthActions {
  setUser: (user: AuthState["user"]) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>(
  persist(
    (set) => ({
      name: "auth",
      state: {
        user: null,
        token: null,
      },
      actions: (set) => ({
        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        logout: () => set({ user: null, token: null }),
      }),
    })
  )
);
