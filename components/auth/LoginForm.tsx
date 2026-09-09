"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/state/AuthContext";
import { useToast } from "@/components/common/Toast";
import HawkEyeLogo from "@/components/common/HawkEyeLogo";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { notify } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const ok = login(username.trim(), password);
    if (ok) {
      notify(`Signed in as ${username.trim()}`);
      router.replace("/dashboard");
    } else {
      setError("Invalid username or password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center rounded-md" style={{ width: 36, height: 36, background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
            <HawkEyeLogo size={26} />
          </div>
          <div>
            <div className="text-slate-900 font-bold text-base tracking-tight leading-none font-heading">HAWKEYE</div>
            <div className="text-slate-400 text-[10px] leading-none mt-1 font-medium tracking-wide uppercase">Vulnerability Management</div>
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          <h1 className="text-lg font-bold text-slate-900 mb-1 font-heading">Sign in</h1>
          <p className="text-sm text-slate-500 mb-5">Enter your credentials to access the security operations console.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Username
              </label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <User size={15} className="text-slate-400 shrink-0" />
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1 min-w-0"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <Lock size={15} className="text-slate-400 shrink-0" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400 flex-1 min-w-0"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
            >
              Sign In <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
