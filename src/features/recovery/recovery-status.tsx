"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CircleDashed, Loader2, Wrench } from "lucide-react";
import type { Incident, RecoveryStage } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS: { stage: RecoveryStage; label: string }[] = [
  { stage: "started", label: "Recovery Started" },
  { stage: "in_progress", label: "Recovery In Progress" },
  { stage: "successful", label: "Recovery Successful" },
];

const ORDER: Record<RecoveryStage, number> = {
  idle: 0,
  started: 1,
  in_progress: 2,
  successful: 3,
};

export function RecoveryStatus({ incident }: { incident?: Incident }) {
  const incidents = usePulseStore((s) => s.incidents);
  const active =
    incident ?? incidents.find((i) => i.recoveryStage !== "idle") ?? incidents[0];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-violet-400" />
          Recovery Engine
        </CardTitle>
        {active && (
          <Badge variant={active.recoveryStage === "successful" ? "success" : "default"}>
            {active.recoveryAction}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!active || active.recoveryStage === "idle" ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Standing by. The recovery engine auto-executes the right playbook
            the moment an incident is detected.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {INCIDENT_TYPE_META[active.type].emoji} {active.title}
            </div>
            {STEPS.map((step) => {
              const current = ORDER[active.recoveryStage];
              const stepOrder = ORDER[step.stage];
              const done = current > stepOrder;
              const running = current === stepOrder;
              return (
                <motion.div
                  key={step.stage}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: done || running ? 1 : 0.4 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    done && "border-emerald-400/30 bg-emerald-500/5",
                    running && "border-sky-400/30 bg-sky-500/5",
                    !done && !running && "border-border/50 bg-secondary/20",
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : running ? (
                    <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      done && "text-emerald-300",
                      running && "text-sky-300",
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
