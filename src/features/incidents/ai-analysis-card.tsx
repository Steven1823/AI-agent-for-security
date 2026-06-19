"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, Lightbulb, Sparkles } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { fallbackAnalysis } from "@/services/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { INCIDENT_TYPE_META, SEVERITY_STYLE } from "@/lib/constants";

export function AIAnalysisCard() {
  const incidents = usePulseStore((s) => s.incidents);
  const latest = incidents[0];

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          AI Incident Analyzer
        </CardTitle>
        <Badge variant="accent">
          <Sparkles className="h-3 w-3" /> GPT-powered
        </Badge>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!latest ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50">
                <Brain className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No incidents to analyze</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Trigger a simulation and PulseGuard will diagnose the root cause
                and recommend a remediation in real time.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={latest.id + latest.status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold">
                  {INCIDENT_TYPE_META[latest.type].emoji} {latest.title}
                </span>
                <Badge variant={SEVERITY_STYLE[latest.severity].badge}>
                  {SEVERITY_STYLE[latest.severity].label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  · {latest.service}
                </span>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {latest.explanation ||
                    fallbackAnalysis(latest).explanation}
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-border/50 bg-secondary/30 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommended remediation
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/90">
                    {fallbackAnalysis(latest).recommendation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
