"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Bot,
  Briefcase,
  Crosshair,
  Gauge,
  Loader2,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import type { Incident } from "@/types";
import { usePulseStore } from "@/lib/store";
import { runSREAgent } from "@/services/sre-agent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEVERITY_STYLE } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export function SREAgentReport({ incident }: { incident?: Incident }) {
  const incidents = usePulseStore((s) => s.incidents);
  const metrics = usePulseStore((s) => s.metrics);
  const target = incident ?? incidents[0];

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-sky-400" />
          AI Site Reliability Engineer
        </CardTitle>
        {target?.confidence != null && (
          <Badge variant="accent">
            <BadgeCheck className="h-3 w-3" />
            {target.agentSource === "openai" ? "GPT" : "Agent"} ·{" "}
            {target.confidence}% confidence
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!target ? (
            <Empty key="empty" />
          ) : !target.diagnosis ? (
            <Analyzing key="loading" />
          ) : (
            <Report
              key={target.id + (target.diagnosis ?? "")}
              incident={target}
              fallbackImpact={
                runSREAgent({
                  type: target.type,
                  title: target.title,
                  service: target.service,
                  severity: target.severity,
                  timestamp: target.createdAt,
                  metrics,
                }).businessImpact
              }
            />
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function Report({
  incident,
  fallbackImpact,
}: {
  incident: Incident;
  fallbackImpact: string;
}) {
  const severity = SEVERITY_STYLE[incident.severity];
  const sections = [
    {
      icon: Crosshair,
      label: "Diagnosis",
      tone: "text-sky-400",
      value: incident.diagnosis,
    },
    {
      icon: Activity,
      label: "Root Cause",
      tone: "text-rose-400",
      value: incident.rootCause,
    },
    {
      icon: Briefcase,
      label: "Business Impact",
      tone: "text-amber-400",
      value: incident.businessImpact ?? fallbackImpact,
    },
    {
      icon: Wrench,
      label: "Recovery",
      tone: "text-violet-400",
      value: incident.recoveryAction,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold">{incident.title}</span>
        <Badge variant={severity.badge}>
          <ShieldAlert className="h-3 w-3" />
          {severity.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {incident.service} · {formatDateTime(incident.createdAt)}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border/50 bg-secondary/20 p-3"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${s.tone}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {incident.executiveSummary && (
        <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-violet-500/5 p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              Executive Summary
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {incident.executiveSummary}
          </p>
        </div>
      )}

      {incident.confidence != null && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Agent confidence</span>
            <span className="tabular-nums">{incident.confidence}%</span>
          </div>
          <Progress
            value={incident.confidence}
            indicatorClassName="bg-gradient-to-r from-sky-500 to-violet-500"
          />
        </div>
      )}
    </motion.div>
  );
}

function Analyzing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-2 py-10 text-center"
    >
      <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
      <p className="text-sm font-medium">SRE agent analyzing incident…</p>
      <p className="text-xs text-muted-foreground">
        Correlating live metrics with failure signature.
      </p>
    </motion.div>
  );
}

function Empty() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
        <Bot className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">SRE agent on standby</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        Trigger an incident and the agent will diagnose it, explain the root
        cause, assess business impact, and recommend recovery — in real time.
      </p>
    </motion.div>
  );
}
