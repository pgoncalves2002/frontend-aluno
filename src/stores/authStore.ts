import { create } from "zustand";
import { configureAuth } from "@/api/client";
import type { User } from "@/api/types";

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: User | null;
  isReady: boolean;
  /** True quando há access token (não garante validade — checagem real é via /me/). */
  isLoggedIn: boolean;

  hydrateFromStorage: () => void;
  didLogin: (access: string, refresh: string, user: User) => void;
  setUser: (user: User) => void;
  updateAccess: (access: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "fichagym.aluno.auth";

interface PersistedAuth {
  access: string | null;
  refresh: string | null;
  user: User | null;
}

function readStorage(): PersistedAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { access: null, refresh: null, user: null };
    return JSON.parse(raw) as PersistedAuth;
  } catch {
    return { access: null, refresh: null, user: null };
  }
}

function writeStorage(state: PersistedAuth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / private mode — silently ignore.
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  access: null,
  refresh: null,
  user: null,
  isReady: false,
  isLoggedIn: false,

  hydrateFromStorage: () => {
    const persisted = readStorage();
    set({
      access: persisted.access,
      refresh: persisted.refresh,
      user: persisted.user,
      isLoggedIn: Boolean(persisted.access),
      isReady: true,
    });
  },

  didLogin: (access, refresh, user) => {
    writeStorage({ access, refresh, user });
    set({ access, refresh, user, isLoggedIn: true });
  },

  setUser: (user) => {
    const cur = get();
    writeStorage({ access: cur.access, refresh: cur.refresh, user });
    set({ user });
  },

  updateAccess: (access) => {
    const cur = get();
    writeStorage({ access, refresh: cur.refresh, user: cur.user });
    set({ access });
  },

  logout: () => {
    writeStorage({ access: null, refresh: null, user: null });
    set({ access: null, refresh: null, user: null, isLoggedIn: false });
  },
}));

// Conecta o cliente HTTP ao store (sem dependência circular).
configureAuth({
  getAccess: () => useAuthStore.getState().access,
  getRefresh: () => useAuthStore.getState().refresh,
  onAccessUpdated: (newAccess) => useAuthStore.getState().updateAccess(newAccess),
  onAuthFailed: () => useAuthStore.getState().logout(),
});
