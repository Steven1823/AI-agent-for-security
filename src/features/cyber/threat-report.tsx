"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  Bot,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Crosshair,
  FileWarning,
  Loader2,
  Network,
  ShieldAlert,
} from "lucide-react";
import type { CyberReport, FallbackStage } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEVERITY_STYLE } from "@/lib/constants";
import { formatClock, cn } from "@/lib/utils";
import { inputKindLabel } from "@/services/threat-intel";

const SOURCE_META: Record<
  CyberReport["source"],
  { label: string; tone: "success" | "warning" | "danger" | "muted" }
> = {
  openai: { label: "AI", tone: "success" },
  rules: { label: "Rules Fallback", tone: "warning" },
  cache: { label: "Cached", tone: "warning" },
  partial: { label: "Partial", tone: "danger" },
};

const STAGE_LABEL: Record<FallbackStage, string> = {
  ai: "LLM",
  rules: "Rules",
  cache: "Cache",
  partial: "Partial",
};

export function ThreatReport() {
  const analyzing = usePulseStore((s) => s.analyzing);
  const reports = usePulseStore((s) => s.cyberReports);
  const latest = reports[0];

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          Threat Analysis Report
        </CardTitle>
        {latest && (
          <div className="flex items-center gap-2">
            <Badge variant={SOURCE_META[latest.source].tone}>
              {SOURCE_META[latest.source].label}
            </Badge>
            <Badge variant="muted">{latest.confidence}% confidence</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <AnimatePresence initial={false}>
          {latest ? (
            <Report key={latest.id} report={latest} />
          ) : analyzing ? (
            <Loading key="loading" />
          ) : (
            <Empty key="empty" />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function Report({ report }: { report: CyberReport }) {
  const severity = SEVERITY_STYLE[report.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={severity.badge}>
          <ShieldAlert className="h-3 w-3" />
          {severity.label}
        </Badge>
        <Badge variant="muted">{inputKindLabel(report.input.kind)}</Badge>
        <span className="text-sm font-semibold">{report.input.target}</span>
        <span className="text-xs text-muted-foreground">
          · {formatClock(report.createdAt)}
        </span>
      </div>

      {/* Risk + resilience banner */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="Risk score"
          value={report.riskScore}
          tone={report.riskScore >= 70 ? "danger" : report.riskScore >= 35 ? "warning" : "success"}
        />
        <Stat
          label="Threat reputation"
          value={report.threat.reputationScore}
          tone={report.threat.reputationScore >= 70 ? "danger" : "warning"}
        />
      </div>

      {/* Resilience banner — degraded components */}
      {report.degradedComponents.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Degraded but functional · fallback chain {report.fallbackChain.map((s) => STAGE_LABEL[s]).join(" → ")}
            </p>
            <p className="mt-0.5 text-sm text-foreground/90">
              Operating without {report.degradedComponents.join(", ")}. Report
              produced via the resilience layer.
            </p>
          </div>
        </div>
      )}

      <Section icon={Crosshair} tone="text-sky-400" label="Diagnosis">
        {report.diagnosis}
      </Section>
      <Section icon={FileWarning} tone="text-rose-400" label="Root Cause">
        {report.rootCause}
      </Section>
      <Section icon={Briefcase} tone="text-amber-400" label="Business Impact">
        {report.businessImpact}
      </Section>

      {/* Scanner evidence */}
      <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Scanner Evidence{report.scan.source === "fallback" ? " · degraded" : ""}
          </span>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="text-foreground/90">
              Open ports: <span className="font-mono">{report.scan.openPorts.join(", ") || "—"}</span>
            </p>
            <p className="mt-0.5">TLS: {report.scan.tlsGrade}</p>
          </div>
          <div className="sm:col-span-2">
            <ul className="space-y-1">
              {report.scan.findings.length === 0 ? (
                <li>No notable findings.</li>
              ) : (
                report.scan.findings.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-foreground/90">
                    <Badge variant={SEVERITY_STYLE[f.severity].badge}>
                      {f.severity}
                    </Badge>{" "}
                    {f.category}: {f.detail}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Mitigations */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-violet-300" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-200">
            Recommended Mitigations
          </span>
        </div>
        <ol className="space-y-1.5 text-sm text-foreground/90">
          {report.mitigations.map((m, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-violet-300">{i + 1}.</span>
              <span>{m}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Playbook matches */}
      {report.playbooks.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-sky-300" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge Base Matches ·{" "}
              <span className="text-sky-300">
                {report.playbooks[0].via === "vector" ? "vector retrieval" : "keyword fallback"}
              </span>
            </span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {report.playbooks.map((m) => (
              <li
                key={m.playbook.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-secondary/30 px-2.5 py-1.5"
              >
                <span className="truncate text-foreground/90">{m.playbook.title}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {(m.score * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Summary */}
      <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-violet-500/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
          Executive Summary
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">
          {report.executiveSummary}
        </p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Analyst confidence</span>
          <span className="tabular-nums">{report.confidence}%</span>
        </div>
        <Progress
          value={report.confidence}
          indicatorClassName={cn(
            report.source === "openai"
              ? "bg-gradient-to-r from-sky-500 to-violet-500"
              : report.source === "rules"
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-red-500 to-rose-500",
          )}
        />
      </div>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  tone,
  label,
  children,
}: {
  icon: typeof Crosshair;
  tone: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", tone)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  const color =
    tone === "danger"
      ? "text-rose-400"
      : tone === "warning"
      ? "text-amber-400"
      : "text-emerald-400";
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", color)}>
        {value}
        <span className="text-sm text-muted-foreground">/100</span>
      </p>
    </div>
  );
}

function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-2 py-12 text-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
      <p className="text-sm font-medium">Running safe recon and AI analysis…</p>
    </motion.div>
  );
}

function Empty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
        <Bot className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No analysis yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Submit a domain, IP, log, alert JSON, or natural-language incident and
        the system will run a safe scan, query the knowledge base, and generate
        a report — even if components fail.
      </p>
    </motion.div>
  );
}
