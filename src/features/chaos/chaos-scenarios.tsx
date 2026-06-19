"use client";

import { useState } from "react";
import {
  Database,
  ServerOff,
  ShieldAlert,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { usePulseStore } from "@/lib/store";
import type { ChaosScenario } from "@/types";

interface ScenarioButton {
  scenario: ChaosScenario;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const BUTTONS: ScenarioButton[] = [
  {
    scenario: "api-failure",
    label: "Simulate API Failure",
    detail: "Take the Main API offline — backup endpoint engages.",
    icon: ServerOff,
    tone: "text-rose-400",
  },
  {
    scenario: "latency",
    label: "High Latency Spike",
    detail: "Inject >3s latency across all services.",
    icon: Timer,
    tone: "text-amber-400",
  },
  {
    scenario: "ai-down",
    label: "AI Provider Down",
    detail: "Kill the AI provider — rule engine takes over.",
    icon: Sparkles,
    tone: "text-violet-400",
  },
  {
    scenario: "db-failure",
    label: "Database Failure",
    detail: "Crash the database — cache serves reads.",
    icon: Database,
    tone: "text-sky-400",
  },
  {
    scenario: "security-attack",
    label: "Security Attack",
    detail: "Burst of auth-failures — on-call paged.",
    icon: ShieldAlert,
    tone: "text-fuchsia-400",
  },
];

export function ChaosScenarios() {
  const simulate = usePulseStore((s) => s.simulateChaos);
  const clearChaos = usePulseStore((s) => s.clearChaos);
  const chaosCount = usePulseStore(
    (s) => Object.values(s.chaosOverrides).filter(Boolean).length,
  );
  const { toast } = useToast();
  const [busy, setBusy] = useState<ChaosScenario | null>(null);

  const run = async (scenario: ChaosScenario, label: string) => {
    setBusy(scenario);
    const tid = toast.loading(`Activating: ${label}…`);
    try {
      // Call API for validation + canonical message, then apply via store.
      const res = await fetch("/api/chaos/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.update(tid, {
          kind: "error",
          title: data.error ?? "Chaos request failed",
        });
        return;
      }
      await simulate(scenario);
      toast.update(tid, {
        kind: "success",
        title: label,
        description: data.message,
      });
    } catch (err) {
      toast.update(tid, {
        kind: "error",
        title: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Chaos Scenarios
          </div>
          <h2 className="text-lg font-semibold">One-click failure injection</h2>
        </div>
        {chaosCount > 0 && (
          <Badge variant="danger" className="text-[10px]">
            <Zap className="h-3 w-3" /> {chaosCount} active
          </Badge>
        )}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Each button corrupts a real service in the monitor, opens an incident,
        triggers recovery, and speaks an alert. Use this to prove the system
        keeps working even when pieces break.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {BUTTONS.map((b) => {
          const Icon = b.icon;
          return (
            <motion.button
              key={b.scenario}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => run(b.scenario, b.label)}
              disabled={busy !== null}
              className="group flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 p-3 text-left transition-colors hover:border-border disabled:opacity-50"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${b.tone}`} />
              <div className="min-w-0">
                <div className="text-sm font-medium">{b.label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {b.detail}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
        <span className="text-muted-foreground">
          Chaos clears automatically after the AI agent finishes recovery.
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearChaos();
            toast.info("All chaos cleared");
          }}
        >
          Clear all
        </Button>
      </div>
    </Card>
  );
}
