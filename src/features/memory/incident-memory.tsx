"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Calendar,
  Compass,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { INCIDENT_TYPE_META } from "@/lib/constants";
import { findPatterns, predictNextFailure } from "@/services/predictor";
import { formatDateTime, formatDuration } from "@/lib/utils";

export function IncidentMemory({ compact }: { compact?: boolean }) {
  const incidents = usePulseStore((s) => s.incidents);
  const patterns = useMemo(() => findPatterns(incidents), [incidents]);
  const next = predictNextFailure(patterns);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-sky-400" />
          Temporal Incident Memory
        </CardTitle>
        <Badge variant="muted">{incidents.length} stored</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No incident history yet. As soon as incidents flow in, patterns and
            predictions appear here.
          </p>
        ) : (
          <>
            {next && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-3"
              >
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                  <Compass className="h-3 w-3" /> Predicted next failure
                </p>
                <p className="mt-1 text-sm">
                  <strong>{next.label}</strong> — {next.recurrenceRisk}/100 recurrence risk
                  {next.predictedNextWindowMin
                    ? `, ~${next.predictedNextWindowMin}min average window`
                    : ""}
                  .
                </p>
              </motion.div>
            )}

            <ul className="space-y-2">
              {(compact ? patterns.slice(0, 3) : patterns).map((p, idx) => {
                const meta = INCIDENT_TYPE_META[p.type];
                return (
                  <Row key={p.type} idx={idx} pattern={p} icon={IconFor(meta.emoji)} label={meta.label} />
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IconFor(_emoji: string): LucideIcon {
  // Reuse a single icon — visual differentiation comes from gradient + label.
  return Calendar;
}

function Row({
  pattern,
  idx,
  label,
}: {
  pattern: ReturnType<typeof findPatterns>[number];
  idx: number;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="rounded-xl border border-border/60 bg-secondary/30 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant="muted">{pattern.count}×</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-[11px] text-muted-foreground">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-amber-400" />
              Recurrence risk
            </span>
            <span className="text-foreground">{pattern.recurrenceRisk}/100</span>
          </div>
          <Progress
            value={pattern.recurrenceRisk}
            className="mt-0.5 h-1"
            indicatorClassName={
              pattern.recurrenceRisk >= 70
                ? "bg-rose-400"
                : pattern.recurrenceRisk >= 40
                ? "bg-amber-400"
                : "bg-emerald-400"
            }
          />
        </div>
        <div>
          <p>Last seen: <span className="text-foreground">{pattern.lastSeen ? formatDateTime(pattern.lastSeen) : "—"}</span></p>
          <p>Avg recovery: <span className="text-foreground">{formatDuration(pattern.avgResolutionMs) || "—"}</span></p>
          {pattern.predictedNextWindowMin != null && (
            <p>Avg gap: <span className="text-foreground">{pattern.predictedNextWindowMin}min</span></p>
          )}
        </div>
      </div>
    </motion.li>
  );
}
