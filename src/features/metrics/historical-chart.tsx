"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { History } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { formatClock } from "@/lib/utils";

export function HistoricalChart() {
  const incidents = usePulseStore((s) => s.incidents);

  const data = [...incidents]
    .reverse()
    .map((i) => ({
      label: formatClock(i.createdAt),
      seconds: i.resolutionMs ? Math.round(i.resolutionMs / 1000) : 0,
      type: i.type,
      title: i.title,
      color: barColor(i.type),
    }));

  const avg =
    data.length > 0
      ? Math.round(
          data.reduce((a, b) => a + b.seconds, 0) /
            data.filter((d) => d.seconds > 0).length || 0,
        )
      : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-sky-400" />
          Temporal Memory · Resolution Time
        </CardTitle>
        {avg > 0 && <Badge variant="muted">avg {avg}s</Badge>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            History will populate as incidents are auto-resolved.
          </p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(217 33% 20%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }}
                  tickLine={false}
                  axisLine={false}
                  unit="s"
                />
                <Tooltip
                  cursor={{ fill: "hsl(217 33% 20% / 0.3)" }}
                  contentStyle={{
                    background: "hsl(222 44% 9%)",
                    border: "1px solid hsl(217 33% 20%)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}s`, "Resolution"]}
                />
                <Bar dataKey="seconds" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function barColor(type: keyof typeof INCIDENT_TYPE_META): string {
  const map: Record<string, string> = {
    api_failure: "#fb7185",
    database_failure: "#fbbf24",
    high_latency: "#38bdf8",
    security_attack: "#c084fc",
  };
  return map[type] ?? "#38bdf8";
}
