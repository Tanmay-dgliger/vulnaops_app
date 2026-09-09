"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Demo-only credential check -- no backend, no hashing, no session persistence.
// Matches the rest of the app's session-scoped state: a refresh resets it.
const DEMO_USERNAME = "hawkadmin";
const DEMO_PASSWORD = "hawkadmin";

interface AuthContextValue {
  isAuthenticated: boolean;
  currentUsername: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      setIsAuthenticated(true);
      setCurrentUsername(username);
      return true;
    }
    return false;
  }, []);

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
