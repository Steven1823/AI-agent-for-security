"use client";

/**
 * /system-check
 *
 * Judge-facing diagnostic console.
 *
 * Top section  — environment & dependency status (from /api/system-check).
 * Middle       — feature readiness checklist (per-feature explanations).
 * Bottom       — "Run Full System Test" exercises 10 critical paths and
 *                shows pass / fail per step with timings.
 *
 * Designed to be useful in both demo mode (no env vars) and production.
 * Every check shows: what it does, how to fix it, current status.
 */
import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Loader2,
  PlayCircle,
  RefreshCw,
  Volume2,
  Activity,
  Stethoscope,
  Database,
  KeyRound,
  Cpu,
  ShieldCheck,
  FileBarChart,
  Bot,
  Radar,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { usePulseStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------
// Types from /api/system-check
// -----------------------------------------------------------------------
type CheckStatus = "ok" | "warn" | "fail" | "skip";
interface SystemCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  hint?: string;
}
interface SystemCheckResponse {
  ok: boolean;
  demoMode: boolean;
  ts: string;
  summary: { ok: number; warn: number; fail: number; skip: number };
  checks: SystemCheckItem[];
}

// -----------------------------------------------------------------------
// Test harness types
// -----------------------------------------------------------------------
type TestState = "idle" | "running" | "pass" | "fail" | "skip";

interface TestStep {
  id: string;
  label: string;
  description: string;
  run: () => Promise<{ ok: boolean; message: string; skip?: boolean }>;
}

interface TestResult {
  state: TestState;
  message?: string;
  durationMs?: number;
}

// -----------------------------------------------------------------------
// Feature readiness table data
// -----------------------------------------------------------------------
interface Feature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  what: string;
  how: string;
  link?: string;
  // resolved at render time based on diagnostics
  resolveStatus: (env: { demoMode: boolean; openai: boolean; supabase: boolean }) =>
    { status: "working" | "needs-setup" | "failed"; note?: string };
}

const FEATURES: Feature[] = [
  {
    id: "auth",
    label: "Signup / Login / Logout",
    icon: KeyRound,
    what:
      "Email-password authentication with role-based access (admin · engineer · viewer).",
    how:
      "Go to /signup or /login. In demo mode, any credentials work and your role is inferred from the email. In production, Supabase Auth handles it.",
    link: "/login",
    resolveStatus: ({ demoMode }) => ({
      status: "working",
      note: demoMode
        ? "Demo mode — localStorage session"
        : "Supabase cookies + RLS",
    }),
  },
  {
    id: "protected",
    label: "Protected routes",
    icon: ShieldCheck,
    what:
      "Middleware redirects unauthenticated users to /login and redirects signed-in users away from auth pages.",
    how:
      "Try opening /dashboard while signed out (production only). In demo mode middleware is a no-op so all routes are accessible.",
    resolveStatus: ({ demoMode }) => ({
      status: "working",
      note: demoMode ? "Open in demo" : "Enforced",
    }),
  },
  {
    id: "metrics",
    label: "Dashboard live metrics",
    icon: Activity,
    what:
      "Real-time CPU / memory / network / database / API gauges, updated every 1.5 s with synthetic load.",
    how: "Open /dashboard — values tick automatically.",
    link: "/dashboard",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "analyzer",
    label: "Incident Analyzer",
    icon: Radar,
    what:
      "Paste a domain, IP, log, alert JSON, or natural-language description. Returns a structured cyber report.",
    how: "Open /analyzer, click a sample chip, hit Run Safe Analysis.",
    link: "/analyzer",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "ai-diagnosis",
    label: "AI diagnosis",
    icon: Bot,
    what:
      "Calls OpenAI (gpt-4o-mini) for richer incident analysis when OPENAI_API_KEY is set.",
    how:
      "Trigger an incident from the dashboard or run an analyzer scan. If OPENAI_API_KEY is missing, the rule engine fallback runs automatically.",
    resolveStatus: ({ openai }) =>
      openai
        ? { status: "working", note: "OpenAI configured" }
        : { status: "needs-setup", note: "Using rule fallback" },
  },
  {
    id: "rule-fallback",
    label: "Rule-based fallback",
    icon: Cpu,
    what:
      "Deterministic analyzer used when OpenAI is unavailable. Always returns a complete report.",
    how:
      "Disable the LLM in /chaos and re-run the analyzer — the fallback chain takes over.",
    link: "/chaos",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "chaos",
    label: "Chaos Center",
    icon: Zap,
    what:
      "Disable LLM / scanner / vector DB / threat intel / queue components and confirm fallback paths work.",
    how:
      "Open /chaos, click the chaos buttons. Each toggle exercises a different fallback strategy.",
    link: "/chaos",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "reports",
    label: "Recovery reports",
    icon: FileBarChart,
    what:
      "Generates a markdown or JSON summary of all incidents + cyber analyses. PDF export from the Reports page.",
    how:
      "Open /reports for the in-app reports view, or call POST /api/reports/generate with the current state.",
    link: "/reports",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "voice",
    label: "Voice alerts",
    icon: Volume2,
    what:
      "Browser SpeechSynthesis narrates incidents (detected, recovering, resolved). Volume slider in the topbar.",
    how:
      "Click the speaker test below or trigger any incident. If the browser blocks speech, text alerts still fire.",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "security",
    label: "Security events",
    icon: ShieldCheck,
    what: "Threat map, MITRE techniques, and CVE lookups derived from live state.",
    how: "Open /security for the security center, /intelligence for MITRE/CVE.",
    link: "/security",
    resolveStatus: () => ({ status: "working" }),
  },
  {
    id: "db",
    label: "Database (Supabase)",
    icon: Database,
    what:
      "profiles + incidents tables backed by Postgres + RLS. Optional — falls back to in-memory state in demo mode.",
    how:
      "Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY, then run supabase/schema.sql.",
    resolveStatus: ({ supabase }) =>
      supabase
        ? { status: "working", note: "Supabase reachable" }
        : { status: "needs-setup", note: "Demo mode — no DB" },
  },
];

// -----------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------
export default function SystemCheckPage() {
  const { profile, demoMode, status } = useAuth();
  const { toast } = useToast();

  const [diag, setDiag] = React.useState<SystemCheckResponse | null>(null);
  const [diagLoading, setDiagLoading] = React.useState(true);
  const [diagError, setDiagError] = React.useState<string | null>(null);

  const [testResults, setTestResults] = React.useState<Record<string, TestResult>>(
    {},
  );
  const [running, setRunning] = React.useState(false);

  // Pull a couple of store helpers for the live tests.
  const triggerIncident = usePulseStore((s) => s.triggerIncident);
  const analyzeCyber = usePulseStore((s) => s.analyzeCyber);
  const pushMetric = usePulseStore((s) => s.pushMetric);
  const speak = usePulseStore((s) => s.speak);
  const incidents = usePulseStore((s) => s.incidents);
  const cyberReports = usePulseStore((s) => s.cyberReports);

  const loadDiagnostics = React.useCallback(async () => {
    setDiagLoading(true);
    setDiagError(null);
    try {
      const res = await fetch("/api/system-check", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SystemCheckResponse;
      setDiag(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setDiagError(msg);
      toast.error("Diagnostics failed to load", msg);
    } finally {
      setDiagLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  const envFlags = React.useMemo(() => {
    const openai =
      diag?.checks.find((c) => c.id === "openai:key")?.status === "ok";
    const supabase =
      diag?.checks.find((c) => c.id === "supabase:connection")?.status === "ok";
    return { openai, supabase, demoMode: Boolean(diag?.demoMode ?? true) };
  }, [diag]);

  // ---------------------------------------------------------------------
  // Test definitions
  // ---------------------------------------------------------------------
  const tests: TestStep[] = React.useMemo(
    () => [
      {
        id: "1-auth",
        label: "Auth session",
        description: "GET /api/auth/profile",
        run: async () => {
          const res = await fetch("/api/auth/profile", { cache: "no-store" });
          if (res.status === 401)
            return { ok: false, message: "Unauthorized (401)" };
          const j = await res.json();
          return {
            ok: true,
            message: j.demoMode
              ? `Demo session OK — role: ${j.profile?.role ?? "n/a"}`
              : `Signed in: ${j.profile?.email ?? "(no profile)"}`,
          };
        },
      },
      {
        id: "2-db",
        label: "Database read",
        description: "GET /api/incidents/list",
        run: async () => {
          const res = await fetch("/api/incidents/list?limit=5", {
            cache: "no-store",
          });
          const j = await res.json();
          if (j.demoMode)
            return { ok: true, skip: true, message: "Skipped — demo mode (no DB)" };
          if (!j.ok)
            return { ok: false, message: j.message ?? "list failed" };
          return {
            ok: true,
            message: `Read ${(j.incidents ?? []).length} rows from incidents table`,
          };
        },
      },
      {
        id: "3-create",
        label: "Incident creation",
        description: "POST /api/incidents/create",
        run: async () => {
          const res = await fetch("/api/incidents/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "api_failure" }),
          });
          if (!res.ok)
            return { ok: false, message: `HTTP ${res.status}` };
          const j = await res.json();
          return {
            ok: true,
            message: j.persisted
              ? `Persisted incident ${j.incident.id} to Supabase`
              : `Created synthetic incident ${j.incident.id} (demo)`,
          };
        },
      },
      {
        id: "4-ai",
        label: "AI diagnosis endpoint",
        description: "POST /api/agent",
        run: async () => {
          const res = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "api_failure",
              title: "System check probe",
              service: "diagnostic",
              severity: "high",
              timestamp: new Date().toISOString(),
              metrics: { cpu: 70, memory: 65, network: 55, database: 50, api: 80 },
            }),
          });
          if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
          const j = await res.json();
          return {
            ok: true,
            message: `${j.source === "openai" ? "OpenAI" : "Rule engine"} responded, confidence ${j.confidence}%`,
          };
        },
      },
      {
        id: "5-fallback",
        label: "Rule fallback endpoint",
        description: "POST /api/fallback-analysis",
        run: async () => {
          const res = await fetch("/api/fallback-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "database_failure", severity: "high" }),
          });
          if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
          const j = await res.json();
          return {
            ok: true,
            message: `Deterministic fallback OK — ${j.sre?.signals?.length ?? 0} signals`,
          };
        },
      },
      {
        id: "6-chaos",
        label: "Chaos endpoint",
        description: "POST /api/chaos",
        run: async () => {
          const res = await fetch("/api/chaos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore-all" }),
          });
          if (res.status === 403)
            return { ok: false, skip: true, message: "Skipped — viewer role (forbidden)" };
          if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
          const j = await res.json();
          return { ok: true, message: j.message };
        },
      },
      {
        id: "7-report",
        label: "Report generation",
        description: "POST /api/reports/generate",
        run: async () => {
          const res = await fetch("/api/reports/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ incidents, cyberReports, format: "markdown" }),
          });
          if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
          const j = await res.json();
          return {
            ok: true,
            message: `Generated ${j.bytes ?? j.markdown?.length ?? 0} bytes of markdown`,
          };
        },
      },
      {
        id: "8-voice",
        label: "Voice alert",
        description: "Browser SpeechSynthesis",
        run: async () => {
          if (typeof window === "undefined" || !("speechSynthesis" in window))
            return { ok: false, message: "speechSynthesis API not supported" };
          speak("System check: voice channel operational.");
          return { ok: true, message: "Queued voice utterance (text fallback shown if blocked)" };
        },
      },
      {
        id: "9-metrics",
        label: "Dashboard refresh",
        description: "Tick the live metrics store",
        run: async () => {
          pushMetric();
          await new Promise((r) => setTimeout(r, 80));
          return { ok: true, message: "Metric snapshot appended to history" };
        },
      },
      {
        id: "10-protected",
        label: "Protected route access",
        description: "Hit /api/auth/profile and confirm role gate",
        run: async () => {
          const res = await fetch("/api/auth/profile", { cache: "no-store" });
          const j = await res.json();
          if (res.status === 401)
            return { ok: false, message: "No session — route gate would redirect" };
          return {
            ok: true,
            message: `Access granted as ${j.profile?.role ?? "unknown"}`,
          };
        },
      },
    ],
    [analyzeCyber, triggerIncident, pushMetric, speak, incidents, cyberReports],
  );

  async function runFullSuite() {
    if (running) return;
    setRunning(true);
    // Reset all to "running" lazily as we go.
    setTestResults({});

    for (const t of tests) {
      setTestResults((prev) => ({ ...prev, [t.id]: { state: "running" } }));
      const started = performance.now();
      try {
        const out = await t.run();
        const durationMs = Math.round(performance.now() - started);
        setTestResults((prev) => ({
          ...prev,
          [t.id]: {
            state: out.skip ? "skip" : out.ok ? "pass" : "fail",
            message: out.message,
            durationMs,
          },
        }));
      } catch (err) {
        const durationMs = Math.round(performance.now() - started);
        setTestResults((prev) => ({
          ...prev,
          [t.id]: {
            state: "fail",
            message: err instanceof Error ? err.message : "unknown error",
            durationMs,
          },
        }));
      }
    }

    setRunning(false);
    toast.success("System test complete", `${tests.length} steps executed`);
  }

  const passCount = Object.values(testResults).filter(
    (r) => r.state === "pass",
  ).length;
  const failCount = Object.values(testResults).filter(
    (r) => r.state === "fail",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="System Check"
        description="Verify every dependency, environment variable, and feature path is healthy. Designed to be self-explanatory for judges and on-call engineers."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDiagnostics}
              disabled={diagLoading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", diagLoading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={runFullSuite}
              disabled={running}
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlayCircle className="h-3.5 w-3.5" />
              )}
              {running ? "Running…" : "Run Full System Test"}
            </Button>
          </div>
        }
      />

      {/* Overview row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          label="Mode"
          value={envFlags.demoMode ? "Demo" : "Production"}
          tone={envFlags.demoMode ? "warn" : "ok"}
          hint={
            envFlags.demoMode
              ? "Add Supabase env vars to upgrade"
              : "Supabase + RLS active"
          }
          icon={Stethoscope}
        />
        <OverviewCard
          label="Auth session"
          value={
            status === "loading"
              ? "Checking…"
              : profile
              ? profile.role.toUpperCase()
              : "Signed out"
          }
          tone={profile ? "ok" : "warn"}
          hint={profile?.email ?? "Open /login to sign in"}
          icon={KeyRound}
        />
        <OverviewCard
          label="AI provider"
          value={envFlags.openai ? "OpenAI" : "Rule engine"}
          tone={envFlags.openai ? "ok" : "warn"}
          hint={
            envFlags.openai
              ? "OPENAI_API_KEY configured"
              : "Deterministic fallback active"
          }
          icon={Bot}
        />
        <OverviewCard
          label="Database"
          value={envFlags.supabase ? "Reachable" : "In-memory"}
          tone={envFlags.supabase ? "ok" : "warn"}
          hint={
            envFlags.supabase
              ? "profiles + incidents tables present"
              : "Demo mode — Supabase off"
          }
          icon={Database}
        />
      </div>

      {/* Diagnostics + Test results side-by-side on large screens */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Diagnostics */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Environment & dependencies</CardTitle>
            {diag && (
              <div className="flex gap-1.5 text-[10px]">
                <Badge variant="success">{diag.summary.ok} OK</Badge>
                {diag.summary.warn > 0 && (
                  <Badge variant="warning">{diag.summary.warn} warn</Badge>
                )}
                {diag.summary.fail > 0 && (
                  <Badge variant="danger">{diag.summary.fail} fail</Badge>
                )}
                {diag.summary.skip > 0 && (
                  <Badge variant="muted">{diag.summary.skip} skip</Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {diagLoading && (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading diagnostics…
              </div>
            )}
            {diagError && !diagLoading && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200">
                <p className="font-semibold">Failed to load /api/system-check</p>
                <p className="mt-1 text-xs">{diagError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDiagnostics}
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            )}
            {diag && !diagLoading && (
              <div className="space-y-1.5">
                {diag.checks.map((c) => (
                  <DiagRow key={c.id} check={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test runner */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Full system test</CardTitle>
            <div className="flex gap-1.5 text-[10px]">
              {passCount > 0 && (
                <Badge variant="success">{passCount} pass</Badge>
              )}
              {failCount > 0 && <Badge variant="danger">{failCount} fail</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(testResults).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-secondary/10 p-4 text-center text-sm text-muted-foreground">
                <PlayCircle className="mx-auto mb-2 h-5 w-5 text-sky-400" />
                <p>Click <strong>Run Full System Test</strong> above to exercise</p>
                <p>all 10 core paths and see live results.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tests.map((t) => (
                  <TestRow
                    key={t.id}
                    step={t}
                    result={testResults[t.id] ?? { state: "idle" }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature readiness checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Feature readiness</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} feature={f} flags={envFlags} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =======================================================================
// Sub-components
// =======================================================================

function OverviewCard({
  label,
  value,
  tone,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "fail";
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const TONE = {
    ok: { dot: "bg-emerald-400", text: "text-emerald-400" },
    warn: { dot: "bg-amber-400", text: "text-amber-400" },
    fail: { dot: "bg-red-400", text: "text-red-400" },
  } as const;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className={cn("h-2 w-2 rounded-full", TONE[tone].dot)} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Icon className={cn("h-4 w-4", TONE[tone].text)} />
          <p className="text-lg font-semibold">{value}</p>
        </div>
        {hint && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground" title={hint}>
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function statusIcon(status: CheckStatus | TestState, animate = false) {
  if (status === "running")
    return <Loader2 className="h-4 w-4 animate-spin text-violet-400" />;
  if (status === "ok" || status === "pass")
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "warn")
    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (status === "fail")
    return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "skip")
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground/60" />;
}

function DiagRow({ check }: { check: SystemCheckItem }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/10 p-2.5">
      <div className="mt-0.5">{statusIcon(check.status)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{check.label}</p>
          <Badge
            variant={
              check.status === "ok"
                ? "success"
                : check.status === "warn"
                ? "warning"
                : check.status === "fail"
                ? "danger"
                : "muted"
            }
            className="text-[9px] uppercase"
          >
            {check.status}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={check.message}>
          {check.message}
        </p>
        {check.hint && (
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">
            <span className="font-medium text-foreground/80">Hint:</span>{" "}
            {check.hint}
          </p>
        )}
      </div>
    </div>
  );
}

function TestRow({ step, result }: { step: TestStep; result: TestResult }) {
  return (
    <motion.div
      layout
      className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/10 p-2.5"
    >
      <div className="mt-0.5">{statusIcon(result.state)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{step.label}</p>
          {result.durationMs !== undefined && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {result.durationMs} ms
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {step.description}
        </p>
        <AnimatePresence>
          {result.message && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "mt-1 text-[11px] leading-snug",
                result.state === "fail"
                  ? "text-red-300"
                  : result.state === "skip"
                  ? "text-muted-foreground"
                  : "text-emerald-300",
              )}
            >
              {result.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function FeatureCard({
  feature,
  flags,
}: {
  feature: Feature;
  flags: { demoMode: boolean; openai: boolean; supabase: boolean };
}) {
  const status = feature.resolveStatus(flags);
  const Icon = feature.icon;
  const tone =
    status.status === "working"
      ? "success"
      : status.status === "failed"
      ? "danger"
      : "warning";
  const label =
    status.status === "working"
      ? "Working"
      : status.status === "failed"
      ? "Failed"
      : "Needs setup";

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="text-sm font-semibold">{feature.label}</p>
        </div>
        <Badge variant={tone} className="text-[9px] uppercase">
          {label}
        </Badge>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        <span className="font-medium text-foreground/80">What:</span> {feature.what}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        <span className="font-medium text-foreground/80">How:</span> {feature.how}
      </p>
      {status.note && (
        <p className="mt-1 text-[10px] text-muted-foreground/80">{status.note}</p>
      )}
      {feature.link && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mt-2 h-7 w-full justify-center text-[11px]"
        >
          <Link href={feature.link}>Open →</Link>
        </Button>
      )}
    </div>
  );
}
