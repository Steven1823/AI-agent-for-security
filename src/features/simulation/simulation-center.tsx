"use client";

import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import type { IncidentType } from "@/types";
import { usePulseStore } from "@/lib/store";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const TYPES: IncidentType[] = [
  "api_failure",
  "database_failure",
  "high_latency",
  "security_attack",
];

export function SimulationCenter() {
  const trigger = usePulseStore((s) => s.triggerIncident);
  const runDisaster = usePulseStore((s) => s.runDisasterScenario);
  const demoRunning = usePulseStore((s) => s.demoRunning);
  const [busy, setBusy] = useState<IncidentType | null>(null);

  async function fire(type: IncidentType) {
    setBusy(type);
    await trigger(type);
    setBusy(null);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Failure Simulation Center</CardTitle>
        <span className="text-[11px] text-muted-foreground">
          Inject real-time chaos
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((type) => {
            const meta = INCIDENT_TYPE_META[type];
            const isBusy = busy === type;
            return (
              <motion.button
                key={type}
                whileTap={{ scale: 0.97 }}
                disabled={isBusy}
                onClick={() => fire(type)}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-secondary/30 p-3 text-left transition-all hover:border-white/10 hover:bg-secondary/50 disabled:opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-lg",
                    meta.gradient,
                  )}
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    meta.emoji
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {meta.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    Simulate {meta.label.toLowerCase()}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={() => runDisaster()}
          disabled={demoRunning}
        >
          {demoRunning ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
          {demoRunning ? "Disaster Scenario Running…" : "Run Disaster Scenario"}
        </Button>
      </CardContent>
    </Card>
  );
}
