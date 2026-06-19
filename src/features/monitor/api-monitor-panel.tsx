"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock,
  Gauge,
  ServerCog,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePulseStore } from "@/lib/store";
import type { MonitorStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<MonitorStatus, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  failed: "bg-rose-500",
  unknown: "bg-slate-500",
};

const STATUS_LABEL: Record<MonitorStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failed: "Failed",
  unknown: "Pending",
};

export function ApiMonitorPanel() {
  const services = usePulseStore((s) => s.monitoredServices);
  const checks = usePulseStore((s) => s.healthChecks);
  const summary = usePulseStore((s) => s.monitorSummary());
  const runAll = usePulseStore((s) => s.runAllHealthChecks);

  const chartData = [...checks]
    .slice(0, 40)
    .reverse()
    .map((c, i) => ({
      idx: i,
      ms: c.responseTimeMs,
      status: c.status,
      service: c.serviceName,
    }));

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute right-6 top-6">
        <Badge variant="default" className="text-[10px]">
          Live · 30s
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
          <ServerCog className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            API Monitoring Engine
          </div>
          <h2 className="text-lg font-semibold">Real-time API health</h2>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={CheckCircle2}
          tone="text-emerald-400"
          label="Healthy"
          value={summary.healthy}
          sub={`${summary.total} total`}
        />
        <Stat
          icon={AlertTriangle}
          tone="text-amber-400"
          label="Degraded"
          value={summary.degraded}
          sub="latency > 3s"
        />
        <Stat
          icon={Activity}
          tone="text-rose-400"
          label="Failed"
          value={summary.failed}
          sub="opening incidents"
        />
        <Stat
          icon={Clock}
          tone="text-sky-400"
          label="Avg Response"
          value={summary.avgResponseMs}
          suffix="ms"
          sub={`${summary.uptimePercent}% uptime`}
        />
      </div>

      <div className="mt-5 h-32 w-full rounded-xl border border-border/40 bg-background/40 p-2">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Running first health check…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="idx" hide />
              <YAxis hide domain={[0, "dataMax + 100"]} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
                labelFormatter={() => "Response time"}
                formatter={(v, _n, p) => [
                  `${v} ms`,
                  p.payload?.service ?? "service",
                ]}
              />
              <Area
                type="monotone"
                dataKey="ms"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#latencyFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {services.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
            No services yet. Visit{" "}
            <Link href="/services" className="text-sky-300 underline">
              /services
            </Link>{" "}
            to add one.
          </div>
        ) : (
          services.map((s) => (
            <motion.div
              key={s.id}
              layout
              className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    STATUS_COLOR[s.status],
                    s.status === "failed" && "animate-pulse",
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {s.region} · {s.criticality} ·{" "}
                    {s.lastCheckedAt
                      ? new Date(s.lastCheckedAt).toLocaleTimeString()
                      : "pending"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {s.responseTimeMs}ms
                </span>
                <Badge
                  variant={
                    s.status === "healthy"
                      ? "success"
                      : s.status === "degraded"
                        ? "warning"
                        : s.status === "failed"
                          ? "danger"
                          : "muted"
                  }
                  className="text-[10px]"
                >
                  {STATUS_LABEL[s.status]}
                </Badge>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          <span>
            Uptime{" "}
            <strong className="text-emerald-400">
              {summary.uptimePercent}%
            </strong>{" "}
            · Avg{" "}
            <strong className="text-sky-300">{summary.avgResponseMs}ms</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/services">
              <TrendingUp className="mr-1 h-3.5 w-3.5" /> Manage
            </Link>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => runAll()}
          >
            Run checks now
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  suffix,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: number;
  suffix?: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", tone)} />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums">
        {value}
        {suffix && (
          <span className="ml-0.5 text-sm font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
