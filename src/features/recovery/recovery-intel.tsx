"use client";

import { useMemo } from "react";
import {
  Activity,
  AlarmClock,
  CheckCircle2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { computeExecutiveRisk } from "@/services/business-risk";
import { cn, formatClock, formatDuration } from "@/lib/utils";

export function RecoveryIntelligence() {
  const incidents = usePulseStore((s) => s.incidents);
  const components = usePulseStore((s) => s.components);
  const cyberReports = usePulseStore((s) => s.cyberReports);
  const metrics = usePulseStore((s) => s.metrics);

  const exec = useMemo(
    () => computeExecutiveRisk({ incidents, components, cyberReports, metrics }),
    [incidents, components, cyberReports, metrics],
  );

  // Build per-incident MTTR series so the bar chart is grounded in real data.
  const series = useMemo(
    () =>
      incidents
        .filter((i) => i.resolutionMs)
        .slice(0, 12)
        .reverse()
        .map((i) => ({
          name: formatClock(i.createdAt),
          mttr: Math.max(1, Math.round((i.resolutionMs ?? 0) / 1000)),
          severity: i.severity,
        })),
    [incidents],
  );

  // Group recovery actions by type
  const byAction = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of incidents) {
      map.set(i.recoveryAction, (map.get(i.recoveryAction) ?? 0) + 1);
    }
    return Array.from(map, ([action, count]) => ({ action, count }));
  }, [incidents]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Recovery Intelligence
        </CardTitle>
        <Badge variant="muted">{incidents.length} incidents tracked</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile
            label="Success Rate"
            value={`${exec.recoverySuccessRate}%`}
            sub="Auto-healed"
            icon={CheckCircle2}
            tone="text-emerald-400"
            pct={exec.recoverySuccessRate}
            barTone="bg-emerald-400"
          />
          <Tile
            label="MTTR"
            value={formatDuration(exec.mttrMs) || "—"}
            sub="Mean time to recovery"
            icon={Wrench}
            tone="text-violet-400"
            pct={Math.max(8, 100 - Math.min(100, exec.mttrMs / 600))}
            barTone="bg-violet-400"
          />
          <Tile
            label="MTTD"
            value={formatDuration(exec.mttdMs) || "—"}
            sub="Mean time to detection"
            icon={AlarmClock}
            tone="text-sky-400"
            pct={Math.max(8, 100 - Math.min(100, exec.mttdMs / 1200))}
            barTone="bg-sky-400"
          />
        </div>

        {series.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent recovery durations (seconds)
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,15,18,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v}s`, "MTTR"]}
                  />
                  <Bar dataKey="mttr" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {byAction.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recovery action mix
            </p>
            <ul className="space-y-1.5">
              {byAction.map((row) => {
                const total = byAction.reduce((a, b) => a + b.count, 0);
                const pct = Math.round((row.count / total) * 100);
                return (
                  <li key={row.action} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span>{row.action}</span>
                      <span className="text-muted-foreground">{row.count} · {pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-0.5 h-1" indicatorClassName="bg-sky-400" />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  pct,
  barTone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tone: string;
  pct: number;
  barTone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("h-3.5 w-3.5", tone)} />
      </div>
      <p className={cn("mt-1 text-2xl font-semibold", tone)}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      <Progress value={pct} className="mt-2 h-1.5" indicatorClassName={barTone} />
    </div>
  );
}
