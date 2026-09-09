"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/state/AuthContext";
import Shell from "./Shell";

/**
 * Gates the app behind the demo login and swaps between the bare login page
 * (no sidebar/header) and the normal Shell-wrapped app. Auth state is in-memory
 * only (see AuthContext) -- a refresh requires signing in again, matching how
 * the rest of the app's session-scoped demo state already behaves.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (!isAuthenticated && !isLoginRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isLoginRoute) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoginRoute, router]);

  if (isLoginRoute) {
    if (isAuthenticated) return null;
    return <>{children}</>;
  }

  if (!isAuthenticated) return null;

  return <Shell>{children}</Shell>;
}
