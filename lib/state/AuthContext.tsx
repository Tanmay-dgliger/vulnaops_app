"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useData } from "@/lib/state/DataContext";

// Demo-only credential check -- no backend, no hashing, no per-user passwords,
// no session persistence. Every account in userAccounts (seeded from
// data/users.csv, plus anything added via Administration > User Management)
// shares this same default password. Matches the rest of the app's
// session-scoped state: a refresh resets the logged-in state.
export const DEFAULT_PASSWORD = "hawkadmin";

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUsername: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { userAccounts } = useData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const login = useCallback(
    (username: string, password: string): boolean => {
      const trimmed = username.trim();
      if (password !== DEFAULT_PASSWORD) return false;
      const match = userAccounts.find((u) => u.username.toLowerCase() === trimmed.toLowerCase());
      if (!match) return false;
      setIsAuthenticated(true);
      setCurrentUsername(match.username);
      return true;
    },
    [userAccounts]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUsername(null);
  }, []);

  return <AuthContext.Provider value={{ isAuthenticated, currentUsername, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
