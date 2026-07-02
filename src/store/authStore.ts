import { create } from "zustand";

export interface User {
  username: string;
  displayName: string;
  email?: string;
  canWrite: boolean;
  groups: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;

  initialize: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  initialized: false,
  loading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem("scout_token");
    if (!token) {
      set({ initialized: true });
      return;
    }

    const payload = parseJwt(token);
    // Check if token is expired (JWT exp is in seconds)
    if (!payload || (payload.exp && Date.now() >= payload.exp * 1000)) {
      localStorage.removeItem("scout_token");
      set({ token: null, user: null, initialized: true });
      return;
    }

    set({
      token,
      user: {
        username: payload.username,
        displayName: payload.displayName,
        email: payload.email,
        canWrite: payload.canWrite,
        groups: payload.groups || []
      },
      initialized: true
    });
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("scout_token", data.token);
      
      set({
        token: data.token,
        user: data.user,
        loading: false,
        error: null
      });
    } catch (err: any) {
      set({ loading: false, error: err.message || "An error occurred during login" });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("scout_token");
    set({ token: null, user: null });
  }
}));
