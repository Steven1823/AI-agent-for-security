"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Activity,
  Briefcase,
  Gauge,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { computeExecutiveRisk, formatUsd } from "@/services/business-risk";
import { cn, formatDuration } from "@/lib/utils";

export function ExecutiveRiskDashboard() {
  const incidents = usePulseStore((s) => s.incidents);
  const components = usePulseStore((s) => s.components);
  const cyberReports = usePulseStore((s) => s.cyberReports);
  const metrics = usePulseStore((s) => s.metrics);

  const exec = useMemo(
    () => computeExecutiveRisk({ incidents, components, cyberReports, metrics }),
    [incidents, components, cyberReports, metrics],
  );

  const stats = [
    {
      label: "Business Risk",
      value: `${exec.businessRisk}/100`,
      tone:
        exec.businessRisk >= 70
          ? "text-rose-400"
          : exec.businessRisk >= 40
          ? "text-amber-400"
          : "text-emerald-400",
      icon: Briefcase,
      hint:
        exec.businessRisk >= 70
          ? "Elevated — leadership notified"
          : exec.businessRisk >= 40
          ? "Moderate — monitor"
          : "Low",
    },
    {
      label: "Downtime Cost",
      value: formatUsd(exec.downtimeCostUsd),
      tone: "text-rose-300",
      icon: TrendingDown,
      hint: "Estimated revenue impact",
    },
    {
      label: "Recovery Effectiveness",
      value: `${exec.recoveryEffectiveness}%`,
      tone:
        exec.recoveryEffectiveness >= 80
          ? "text-emerald-400"
          : "text-amber-400",
      icon: Activity,
      hint: `${exec.recoverySuccessRate}% success · MTTR ${formatDuration(exec.mttrMs) || "0s"}`,
    },
    {
      label: "Security Posture",
      value: `${exec.securityPosture}/100`,
      tone:
        exec.securityPosture >= 80
          ? "text-emerald-400"
          : exec.securityPosture >= 50
          ? "text-amber-400"
          : "text-rose-400",
      icon: ShieldCheck,
      hint: "Live, derived from components + critical reports",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-violet-400" />
          Executive Risk Dashboard
        </CardTitle>
        <Badge variant="muted">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/60 bg-secondary/30 p-3"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>{s.label}</span>
                  <Icon className={cn("h-3.5 w-3.5", s.tone)} />
                </div>
                <p className={cn("mt-2 text-2xl font-bold", s.tone)}>{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              7-day Resilience Trend
            </p>
            <span className="text-[11px] text-muted-foreground">
              Now {exec.resilienceTrend[exec.resilienceTrend.length - 1]?.score}
            </span>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={exec.resilienceTrend}
                margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="resilienceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15,15,18,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#resilienceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Bar
            label="MTTD"
            value={formatDuration(exec.mttdMs) || "—"}
            sub="Mean time to detect"
            pct={Math.max(8, 100 - Math.min(100, exec.mttdMs / 1200))}
            tone="bg-sky-400"
          />
          <Bar
            label="MTTR"
            value={formatDuration(exec.mttrMs) || "—"}
            sub="Mean time to recover"
            pct={Math.max(8, 100 - Math.min(100, exec.mttrMs / 600))}
            tone="bg-emerald-400"
          />
          <Bar
            label="Success Rate"
            value={`${exec.recoverySuccessRate}%`}
            sub="Auto-healed incidents"
            pct={exec.recoverySuccessRate}
            tone="bg-violet-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Bar({
  label,
  value,
  sub,
  pct,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  pct: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span>{sub}</span>
      </div>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <Progress value={pct} className="mt-2 h-1.5" indicatorClassName={tone} />
    </div>
  );
}
