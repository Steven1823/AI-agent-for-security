"use client";

/**
 * Shared auth-page chrome: glass panel with brand mark + tagline split
 * layout. Used by /login and /signup. Pure presentational — no auth state.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldHalf, Sparkles, Lock, Activity } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora" />
      <div className="fixed inset-0 -z-10 grid-bg" />

      <div className="mx-auto grid min-h-screen max-w-7xl items-stretch gap-0 px-4 py-6 lg:grid-cols-2 lg:gap-10 lg:px-6">
        {/* Left: brand panel */}
        <aside className="hidden flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-fuchsia-500/10 p-10 lg:flex">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 shadow-lg shadow-violet-500/40">
                <ShieldHalf className="h-5 w-5 text-white" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
              </div>
              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-gradient">
                  PulseGuard
                </p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Cyber AI Ops
                </p>
              </div>
            </Link>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-16 text-4xl font-bold leading-tight tracking-tight"
            >
              The security copilot that
              <br />
              <span className="text-gradient">heals itself</span> in real time.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4 max-w-md text-sm text-muted-foreground"
            >
              Autonomous detection, AI root-cause, and recovery playbooks —
              resilient even when components fail.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Feature
              icon={<Sparkles className="h-4 w-4 text-sky-400" />}
              title="AI SRE Agent"
              body="Grounded incident analysis with confidence scoring and executive summaries."
            />
            <Feature
              icon={<Activity className="h-4 w-4 text-emerald-400" />}
              title="Self-healing recovery"
              body="Playbooks auto-execute the moment a failure is detected."
            />
            <Feature
              icon={<Lock className="h-4 w-4 text-violet-400" />}
              title="Role-based access"
              body="Admin · Engineer · Viewer roles enforced end-to-end with RLS."
            />
          </div>
        </aside>

        {/* Right: form panel */}
        <main className="flex items-center justify-center py-8 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <Link
              href="/"
              className="mb-8 flex items-center gap-2.5 lg:hidden"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600">
                <ShieldHalf className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold text-gradient">
                PulseGuard
              </span>
            </Link>

            <div className="glass-strong rounded-2xl p-8 shadow-2xl shadow-black/40">
              <h1 className="text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              <div className="mt-7">{children}</div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5 backdrop-blur">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
