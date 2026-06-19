import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create account · PulseGuard AI",
  description:
    "Create your PulseGuard Cyber AI account and start defending in minutes.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start defending your infrastructure in minutes."
    >
      <SignupForm />
    </AuthShell>
  );
}
