"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { usePulseStore, threatLevelFromScore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RingProgress } from "@/components/ui/ring-progress";
import { Badge } from "@/components/ui/badge";

const META = {
  safe: {
    label: "Safe",
    color: "stroke-emerald-400",
    badge: "success" as const,
    icon: ShieldCheck,
    text: "No active threats detected. Edge defenses nominal.",
  },
  suspicious: {
    label: "Suspicious",
    color: "stroke-amber-400",
    badge: "warning" as const,
    icon: ShieldAlert,
    text: "Anomalous patterns observed. Monitoring elevated traffic.",
  },
  critical: {
    label: "Critical",
    color: "stroke-red-400",
    badge: "critical" as const,
    icon: ShieldX,
    text: "Active attack signature matched. Mitigation engaged.",
  },
};

export function SecurityCenter() {
  const threat = usePulseStore((s) => s.threatScore());
  const level = threatLevelFromScore(threat);
  const meta = META[level];
  const Icon = meta.icon;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          Security Center
        </CardTitle>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <motion.div
          key={level}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <RingProgress
            value={threat}
            label={`${threat}`}
            sublabel="Threat Score"
            colorClass={meta.color}
          />
        </motion.div>
        <p className="text-center text-xs text-muted-foreground">{meta.text}</p>
      </CardContent>
    </Card>
  );
}
