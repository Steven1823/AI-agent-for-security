"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Network, Skull } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildThreatFeed } from "@/services/threat-feed";

interface MapPoint {
  x: number; // 0-100 (pct)
  y: number; // 0-100 (pct)
  label: string;
  region: string;
  severity: "low" | "medium" | "high" | "critical";
  actor?: string;
  indicator: string;
}

// Deterministic pseudo-coordinate based on a string hash.
function placeFor(seed: string): { x: number; y: number; region: string } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const rx = (h % 1000) / 1000;
  const ry = ((h >>> 10) % 1000) / 1000;
  // Bias points into recognizable continental clusters.
  const REGIONS = [
    { name: "North America", x: [10, 28], y: [25, 42] },
    { name: "Europe", x: [45, 56], y: [22, 36] },
    { name: "South America", x: [22, 32], y: [55, 75] },
    { name: "Africa", x: [48, 58], y: [45, 65] },
    { name: "Asia", x: [62, 80], y: [25, 50] },
    { name: "Oceania", x: [75, 88], y: [62, 78] },
  ];
  const region = REGIONS[h % REGIONS.length];
  const x = region.x[0] + rx * (region.x[1] - region.x[0]);
  const y = region.y[0] + ry * (region.y[1] - region.y[0]);
  return { x, y, region: region.name };
}

const COLOR: Record<string, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#f87171",
};

// HQ point — the target everything attacks.
const HQ = { x: 18, y: 38 };

export function SecurityMap() {
  const incidents = usePulseStore((s) => s.incidents);
  const reports = usePulseStore((s) => s.cyberReports);

  const feed = useMemo(
    () => buildThreatFeed(incidents, reports),
    [incidents, reports],
  );

  const points: MapPoint[] = useMemo(
    () =>
      feed.slice(0, 12).map((f) => {
        const p = placeFor(f.actor ? `${f.actor}-${f.indicator}` : f.indicator);
        return {
          x: p.x,
          y: p.y,
          region: p.region,
          label: f.actor || f.source,
          indicator: f.indicator,
          severity: f.severity,
          actor: f.actor,
        };
      }),
    [feed],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-sky-400" />
          Security Intelligence Map
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Badge variant="muted">{points.length} sources</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No threat sources observed. Run the Analyzer or trigger an attack
            scenario to populate the map.
          </p>
        ) : (
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-border/60 bg-gradient-to-b from-slate-900/60 to-slate-950">
            <svg
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {/* Soft graticule */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line
                  key={`v-${i}`}
                  x1={(i + 1) * 16.6}
                  y1={0}
                  x2={(i + 1) * 16.6}
                  y2={50}
                  stroke="rgba(255,255,255,0.04)"
                />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={(i + 1) * 12.5}
                  x2={100}
                  y2={(i + 1) * 12.5}
                  stroke="rgba(255,255,255,0.04)"
                />
              ))}

              {/* HQ */}
              <circle cx={HQ.x} cy={HQ.y} r={1.4} fill="#38bdf8" />
              <circle cx={HQ.x} cy={HQ.y} r={2.4} fill="#38bdf8" opacity={0.35}>
                <animate attributeName="r" values="1.6;4;1.6" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.45;0;0.45" dur="2.4s" repeatCount="indefinite" />
              </circle>

              {/* Attack arcs */}
              {points.map((p, i) => {
                const color = COLOR[p.severity];
                const mx = (HQ.x + p.x) / 2;
                const my = Math.max(2, Math.min(48, ((HQ.y + p.y) / 2) - 10));
                return (
                  <g key={`arc-${i}`}>
                    <path
                      d={`M ${p.x} ${p.y} Q ${mx} ${my} ${HQ.x} ${HQ.y}`}
                      stroke={color}
                      strokeOpacity={0.65}
                      strokeWidth={0.35}
                      fill="none"
                      strokeDasharray="1 1"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-20"
                        dur={`${2 + (i % 3)}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                );
              })}

              {/* Attack sources */}
              {points.map((p, i) => {
                const color = COLOR[p.severity];
                return (
                  <g key={`src-${i}`}>
                    <circle cx={p.x} cy={p.y} r={1} fill={color} />
                    <circle cx={p.x} cy={p.y} r={2} fill={color} opacity={0.3}>
                      <animate
                        attributeName="r"
                        values="1;3;1"
                        dur={`${1.6 + (i % 4) * 0.2}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0;0.4"
                        dur={`${1.6 + (i % 4) * 0.2}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* HQ label */}
            <div
              className="pointer-events-none absolute rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] text-sky-200"
              style={{
                left: `${HQ.x}%`,
                top: `${HQ.y}%`,
                transform: "translate(8px, -50%)",
              }}
            >
              HQ
            </div>

            {/* Source labels */}
            {points.slice(0, 6).map((p, i) => (
              <motion.div
                key={`label-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="pointer-events-none absolute flex items-center gap-1 text-[10px]"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: "translate(8px, -50%)",
                  color: COLOR[p.severity],
                }}
              >
                <span className="rounded bg-background/60 px-1 py-0.5">
                  {p.label}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Legend />
          <Correlation points={points} />
        </div>
      </CardContent>
    </Card>
  );
}

function Legend() {
  const items: { tone: keyof typeof COLOR; label: string }[] = [
    { tone: "critical", label: "Critical" },
    { tone: "high", label: "High" },
    { tone: "medium", label: "Medium" },
    { tone: "low", label: "Low" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[11px]">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Network className="h-3.5 w-3.5" />
        Threat severity
      </span>
      {items.map((i) => (
        <span key={i.tone} className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: COLOR[i.tone] }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function Correlation({ points }: { points: MapPoint[] }) {
  const byActor = new Map<string, number>();
  for (const p of points) if (p.actor) byActor.set(p.actor, (byActor.get(p.actor) ?? 0) + 1);
  if (byActor.size === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[11px] text-muted-foreground">
        No actor attribution yet.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 text-[11px]">
      <p className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Skull className="h-3.5 w-3.5" />
        Actor correlation
      </p>
      <ul className="space-y-0.5">
        {Array.from(byActor, ([actor, count]) => (
          <li key={actor} className="flex items-center justify-between">
            <span className="text-violet-200">{actor}</span>
            <span className="text-muted-foreground">{count} signal{count > 1 ? "s" : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
