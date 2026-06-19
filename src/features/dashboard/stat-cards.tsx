"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { usePulseStore, threatLevelFromScore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  tone: string;
  glow: string;
  hint: string;
}

export function StatCards() {
  const incidents = usePulseStore((s) => s.incidents);
  const health = usePulseStore((s) => s.healthScore());
  const threat = usePulseStore((s) => s.threatScore());

  const active = incidents.filter((i) => i.status !== "resolved").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const recoveries = incidents.filter(
    (i) => i.recoveryStage !== "idle",
  ).length;
  const level = threatLevelFromScore(threat);

  const stats: Stat[] = [
    {
      label: "Health Score",
      value: health,
      suffix: "%",
      icon: HeartPulse,
      tone: "text-emerald-400",
      glow: "from-emerald-500/20",
      hint: health >= 85 ? "Optimal" : health >= 60 ? "Degraded" : "Critical",
    },
    {
      label: "Active Incidents",
      value: active,
      icon: Activity,
      tone: "text-rose-400",
      glow: "from-rose-500/20",
      hint: active === 0 ? "All clear" : "Mitigating",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      tone: "text-sky-400",
      glow: "from-sky-500/20",
      hint: "Auto-healed",
    },
    {
      label: "Recovery Actions",
      value: recoveries,
      icon: Wrench,
      tone: "text-violet-400",
      glow: "from-violet-500/20",
      hint: "Executed",
    },
    {
      label: "Security",
      value: threat,
      suffix: "",
      icon: ShieldCheck,
      tone:
        level === "critical"
          ? "text-red-400"
          : level === "suspicious"
          ? "text-amber-400"
          : "text-emerald-400",
      glow:
        level === "critical"
          ? "from-red-500/20"
          : level === "suspicious"
          ? "from-amber-500/20"
          : "from-emerald-500/20",
      hint:
        level === "critical"
          ? "Critical"
          : level === "suspicious"
          ? "Suspicious"
          : "Safe",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <Card className="group relative overflow-hidden p-4">
              <div
                className={cn(
                  "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity group-hover:opacity-100",
                  stat.glow,
                )}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
                <Icon className={cn("h-4 w-4", stat.tone)} />
              </div>
              <div className="mt-3 flex items-end gap-1">
                <AnimatedNumber
                  value={stat.value}
                  suffix={stat.suffix}
                  className={cn("text-3xl font-bold tracking-tight", stat.tone)}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stat.hint}
              </p>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
