"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import type { ComponentId } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sleep } from "@/lib/utils";

const SCENARIO_INPUT =
  "evil-bank-login.example.com — suspicious lookalike domain hosting fake login page";

interface Step {
  label: string;
  toggle?: ComponentId;
}

const SCRIPT: Step[] = [
  { label: "Submit suspicious domain to analyzer" },
  { label: "Disable LLM — force rules engine fallback", toggle: "llm" },
  { label: "Disable Vector DB — force keyword fallback", toggle: "vector_db" },
  { label: "Restore LLM and Vector DB" },
];

export function ChaosRunner() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const analyze = usePulseStore((s) => s.analyzeCyber);
  const setComponent = usePulseStore((s) => s.setComponent);
  const speak = usePulseStore((s) => s.speak);
  const restore = usePulseStore((s) => s.restoreAllComponents);

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      restore();
      await sleep(300);

      // Step 1: clean analysis
      setStep(0);
      speak("Running baseline analysis.");
      await analyze(SCENARIO_INPUT);
      await sleep(600);

      // Step 2: disable LLM
      setStep(1);
      setComponent("llm", "offline");
      await sleep(700);
      await analyze(SCENARIO_INPUT);
      await sleep(600);

      // Step 3: disable vector DB too
      setStep(2);
      setComponent("vector_db", "offline");
      await sleep(700);
      await analyze(SCENARIO_INPUT);
      await sleep(600);

      // Step 4: restore
      setStep(3);
      setComponent("llm", "online");
      setComponent("vector_db", "online");
      await sleep(500);
      speak("All systems restored. Resilience demonstration complete.");
    } finally {
      setStep(-1);
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Resilience Scenario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          One click runs the full resilience story: analyze a suspicious domain,
          disable the LLM (rules take over), then disable the vector DB
          (keyword retrieval takes over), and finally restore everything.
        </p>
        <ol className="space-y-1.5">
          {SCRIPT.map((s, i) => {
            const active = step === i;
            const done = step > i;
            return (
              <motion.li
                key={s.label}
                animate={{ opacity: active ? 1 : done ? 0.7 : 0.5 }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  active
                    ? "border-sky-500/40 bg-sky-500/5 text-foreground"
                    : done
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/40 bg-secondary/20 text-muted-foreground"
                }`}
              >
                <span className="font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.label}</span>
              </motion.li>
            );
          })}
        </ol>
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          disabled={running}
          onClick={run}
        >
          {running ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
          {running ? "Running…" : "Run Resilience Scenario"}
        </Button>
      </CardContent>
    </Card>
  );
}
