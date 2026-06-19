"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh, demoMode, setDemoSession } = useAuth();
  const { toast } = useToast();
  const redirect = params.get("redirect") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        demoMode?: boolean;
        profile?: Profile;
      };

      if (!res.ok) {
        setError(json.error ?? "Login failed.");
        toast.error("Sign-in failed", json.error ?? "Check your credentials and try again.");
        setLoading(false);
        return;
      }

      if (json.demoMode && json.profile) {
        // Persist the demo session locally so the UI stays "signed in".
        setDemoSession(json.profile);
      } else {
        await refresh();
      }
      toast.success(
        "Signed in",
        json.profile ? `Welcome back, ${json.profile.full_name || json.profile.email}` : undefined,
      );
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error", "Could not reach /api/auth/login. Retry?");
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "engineer" | "viewer") {
    setEmail(`${role}@pulseguard.ai`);
    setPassword("Demo!2026");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {demoMode && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
          <span className="font-medium">Demo mode active.</span> Any
          credentials work — Supabase will enable real auth once configured.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            {show ? (
              <span className="inline-flex items-center gap-1">
                <EyeOff className="h-3 w-3" /> Hide
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" /> Show
              </span>
            )}
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-sky-400 hover:text-sky-300"
        >
          Create one
        </Link>
      </p>

      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Demo accounts
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["admin", "engineer", "viewer"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => fillDemo(r)}
              className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] capitalize hover:bg-secondary/60"
            >
              {r}@pulseguard.ai
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Password:{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono">
            Demo!2026
          </code>
        </p>
      </div>
    </form>
  );
}
