import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · PulseGuard AI",
  description: "Sign in to the PulseGuard Cyber AI operations console.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to the PulseGuard operations console."
    >
      {/* LoginForm reads `?redirect=` via useSearchParams() — must be in Suspense. */}
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-secondary/40" />
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
