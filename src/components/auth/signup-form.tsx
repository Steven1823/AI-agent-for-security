"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  PasswordStrength,
  scorePassword,
} from "@/components/auth/password-strength";
import { useAuth } from "@/lib/auth-context";
import { ROLES, ROLE_LABEL, ROLE_DESCRIPTION, type Role } from "@/types/auth";

export function SignupForm() {
  const router = useRouter();
  const { refresh, demoMode } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("engineer");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !organization || !email || !password) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (scorePassword(password).score < 2) {
      setError(
        "Password is too weak. Use at least 8 chars with uppercase, lowercase, and a number.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          full_name: fullName,
          organization,
          email,
          password,
          role,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        requiresEmailConfirmation?: boolean;
      };

      if (!res.ok) {
        setError(json.error ?? "Could not create account.");
        setLoading(false);
        return;
      }

      if (json.requiresEmailConfirmation) {
        setSuccess(
          "Check your inbox to confirm your email, then sign in to continue.",
        );
        setLoading(false);
        return;
      }

      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {demoMode && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
          Demo mode — Supabase isn&apos;t configured. Signup requires Supabase
          env vars.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="full_name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="organization"
              autoComplete="organization"
              placeholder="Acme Security"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            required
          />
        </div>
        <PasswordStrength password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {ROLE_DESCRIPTION[role]}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{success}</span>
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
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        By creating an account you agree to operate PulseGuard&apos;s
        autonomous controls in accordance with your organization&apos;s
        security policies.
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-sky-400 hover:text-sky-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
