"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Brain,
  Briefcase,
  Crosshair,
  Layers,
  Network,
  Search,
  ShieldAlert,
} from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEVERITY_STYLE } from "@/lib/constants";
import { mitreForIncident } from "@/services/mitre";
import { cn, formatClock, formatDateTime } from "@/lib/utils";

/**
 * AI Incident Investigator — focuses on a single incident and surfaces every
 * AI-derived signal: root cause, affected systems, confidence, evidence
 * timeline and ATT&CK mapping.
 */
export function IncidentInvestigator() {
  const incidents = usePulseStore((s) => s.incidents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    incidents.find((i) => i.id === selectedId) ?? incidents[0] ?? null;

  const mitre = useMemo(
    () => (selected ? mitreForIncident(selected.type) : []),
    [selected],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4 text-sky-400" />
          AI Incident Investigator
        </CardTitle>
        {selected && (
          <Badge variant="accent">
            <BadgeCheck className="h-3 w-3" />
            {selected.agentSource === "openai" ? "GPT" : "Agent"} ·{" "}
            {selected.confidence ?? 70}% confidence
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No incidents to investigate. Trigger one from the Simulation Center
            and the AI will populate root cause, affected systems and an
            evidence timeline here.
          </p>
        ) : !selected ? null : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {incidents.slice(0, 6).map((i) => {
                const isActive = (selected.id ?? "") === i.id;
                const sev = SEVERITY_STYLE[i.severity];
                return (
                  <button
                    key={i.id}
                    onClick={() => setSelectedId(i.id)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-xs transition-colors hover:border-sky-400/50",
                      isActive
                        ? "border-sky-400/60 bg-sky-500/10 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground",
                    )}
                  >
                    <span className="mr-1.5">
                      <Badge variant={sev.badge}>{sev.label}</Badge>
                    </span>
                    {i.title}
                  </button>
                );
              })}
            </div>

            <Header incident={selected} />

            <div className="grid gap-3 md:grid-cols-2">
              <Section
                icon={Crosshair}
                tone="text-sky-400"
                label="Diagnosis"
                value={selected.diagnosis ?? "Pending — AI SRE agent will populate."}
              />
              <Section
                icon={Activity}
                tone="text-rose-400"
                label="Root Cause"
                value={selected.rootCause}
              />
              <Section
                icon={Briefcase}
                tone="text-amber-400"
                label="Business Impact"
                value={
                  selected.businessImpact ??
                  "Pending — agent will quantify customer / revenue impact."
                }
              />
              <Section
                icon={ShieldAlert}
                tone="text-violet-400"
                label="Executive Summary"
                value={selected.executiveSummary ?? "—"}
              />
            </div>

            <AffectedSystems
              service={selected.service}
              type={selected.type}
              metricImpact={selected.metricImpact}
            />

            {mitre.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Layers className="h-3 w-3" /> MITRE ATT&amp;CK
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {mitre.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px]"
                    >
                      <span className="font-mono text-sky-300">{t.id}</span>{" "}
                      <span>{t.name}</span>
                      <span className="ml-1 text-muted-foreground">· {t.tactic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <EvidenceTimeline incident={selected} />

            {selected.confidence != null && (
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>AI Confidence</span>
                  <span>{selected.confidence}%</span>
                </div>
                <Progress
                  value={selected.confidence}
                  className="mt-1 h-1.5"
                  indicatorClassName={
                    selected.confidence >= 80
                      ? "bg-emerald-400"
                      : selected.confidence >= 60
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  }
                />
                {selected.confidence < 70 && (
                  <p className="mt-1 text-[11px] text-amber-300">
                    Low confidence — human SRE review recommended before
                    automated remediation.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Header({ incident }: { incident: ReturnType<typeof usePulseStore.getState>["incidents"][number] }) {
  const sev = SEVERITY_STYLE[incident.severity];
  return (
    <motion.div
      key={incident.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-secondary/30 p-3"
    >
      <Badge variant={sev.badge}>{sev.label}</Badge>
      <span className="font-medium">{incident.title}</span>
      <span className="text-xs text-muted-foreground">on {incident.service}</span>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
        {formatDateTime(incident.createdAt)}
      </span>
    </motion.div>
  );
}

function Section({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Crosshair;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/25 p-3">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("h-3 w-3", tone)} />
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function AffectedSystems({
  service,
  type,
  metricImpact,
}: {
  service: string;
  type: string;
  metricImpact: number;
}) {
  const systems = systemsFor(type, service);
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
      <p className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Network className="h-3 w-3" /> Affected systems
      </p>
      <div className="flex flex-wrap gap-1.5">
        {systems.map((s) => (
          <span
            key={s}
            className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Metric impact</span>
          <span>{metricImpact}/100</span>
        </div>
        <Progress
          value={metricImpact}
          className="mt-0.5 h-1"
          indicatorClassName={
            metricImpact >= 70
              ? "bg-rose-400"
              : metricImpact >= 40
              ? "bg-amber-400"
              : "bg-emerald-400"
          }
        />
      </div>
    </div>
  );
}

function systemsFor(type: string, service: string): string[] {
  const base = [service];
  switch (type) {
    case "api_failure":
      return [...base, "api-gateway", "auth-svc", "user-sessions"];
    case "database_failure":
      return [...base, "replica-set", "order-processor", "analytics-pipeline"];
    case "high_latency":
      return [...base, "cdn-edge", "redis-cache", "downstream-svc"];
    case "security_attack":
      return [...base, "edge-firewall", "siem", "incident-channel"];
    default:
      return base;
  }
}

function EvidenceTimeline({
  incident,
}: {
  incident: ReturnType<typeof usePulseStore.getState>["incidents"][number];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
      <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Brain className="h-3 w-3" /> Evidence Timeline
      </p>
      <ol className="space-y-1.5">
        {incident.timeline.map((ev) => (
          <li
            key={ev.id}
            className="flex items-center justify-between rounded-md bg-background/40 px-2 py-1.5 text-xs"
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  ev.status === "done"
                    ? "bg-emerald-400"
                    : ev.status === "active"
                    ? "bg-sky-400"
                    : "bg-muted-foreground",
                )}
              />
              {ev.label}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatClock(ev.timestamp)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
