"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Cpu, Database, Gauge, Network, Server } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

const SERIES = [
  { key: "cpu", label: "CPU", color: "#38bdf8", icon: Cpu },
  { key: "memory", label: "Memory", color: "#818cf8", icon: Server },
  { key: "network", label: "Network", color: "#c084fc", icon: Network },
  { key: "database", label: "Database", color: "#fb923c", icon: Database },
  { key: "api", label: "API Health", color: "#34d399", icon: Gauge },
] as const;

export function LiveMetricsPanel() {
  const history = usePulseStore((s) => s.metricHistory);
  const metrics = usePulseStore((s) => s.metrics);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Live Metrics</CardTitle>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <StatusDot tone="success" />
          Streaming · 2s
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SERIES.map((s) => {
            const Icon = s.icon;
            const value = Math.round(
              metrics[s.key as keyof typeof metrics] as number,
            );
            const hot = s.key !== "api" && value > 75;
            return (
              <div
                key={s.key}
                className="rounded-xl border border-border/50 bg-secondary/30 p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                  <span className="text-[11px] text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 text-lg font-bold tabular-nums",
                    hot ? "text-rose-400" : "text-foreground",
                  )}
                >
                  {value}
                  {s.key === "api" ? "%" : "%"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
            >
              <defs>
                {SERIES.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`grad-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(217 33% 20%)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(222 44% 9%)",
                  border: "1px solid hsl(217 33% 20%)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(215 20% 65%)" }}
              />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.key})`}
                  isAnimationActive={false}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
