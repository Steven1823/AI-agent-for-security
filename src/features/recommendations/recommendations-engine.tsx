"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  ZapOff,
} from "lucide-react";
import type { RecommendationKind } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  RecommendationKind,
  { label: string; icon: typeof Lightbulb; tone: string }
> = {
  quick_win: { label: "Quick Win", icon: Lightbulb, tone: "text-amber-300" },
  long_term: { label: "Long Term", icon: Rocket, tone: "text-violet-300" },
  hardening: { label: "Hardening", icon: ShieldCheck, tone: "text-emerald-300" },
};

const TABS: { id: "all" | RecommendationKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "quick_win", label: "Quick Wins" },
  { id: "long_term", label: "Long Term" },
  { id: "hardening", label: "Hardening" },
];

export function RecommendationsEngine({ compact }: { compact?: boolean }) {
  const recs = usePulseStore((s) => s.recommendations());
  const promote = usePulseStore((s) => s.promoteRecommendation);
  const queued = usePulseStore((s) => s.autonomousActions);

  const [tab, setTab] = useState<"all" | RecommendationKind>("all");
  const filtered = tab === "all" ? recs : recs.filter((r) => r.kind === tab);
  const show = compact ? filtered.slice(0, 3) : filtered;

  const queuedRecIds = new Set(queued.map((a) => a.recommendationId));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          AI Recommendations
        </CardTitle>
        <Badge variant="muted">{recs.length} active</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {!compact && (
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px]",
                  tab === t.id
                    ? "border-violet-400/60 bg-violet-500/10 text-violet-200"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {show.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <ZapOff className="mx-auto mb-2 h-5 w-5 text-muted-foreground/60" />
            No recommendations of this type right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {show.map((r, idx) => {
              const Icon = KIND_META[r.kind].icon;
              const queuedAlready = queuedRecIds.has(r.id);
              const tone =
                r.priority === 1
                  ? "border-rose-500/40"
                  : r.priority === 2
                  ? "border-amber-500/40"
                  : "border-border/60";
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "rounded-xl border bg-secondary/25 p-3",
                    tone,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon
                          className={cn("h-3.5 w-3.5", KIND_META[r.kind].tone)}
                        />
                        <p className="text-sm font-medium">{r.title}</p>
                        <Badge variant="muted">P{r.priority}</Badge>
                        <Badge variant="accent">{KIND_META[r.kind].label}</Badge>
                        {r.requiresHumanReview && (
                          <Badge variant="warning">Human Review</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.detail}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                          <span>Confidence</span>
                          <span>{r.confidence}%</span>
                        </div>
                        <Progress
                          value={r.confidence}
                          className="mt-0.5 h-1"
                          indicatorClassName={
                            r.confidence >= 80
                              ? "bg-emerald-400"
                              : r.confidence >= 60
                              ? "bg-amber-400"
                              : "bg-rose-400"
                          }
                        />
                      </div>
                      {r.evidence.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.evidence.slice(0, 3).map((e) => (
                            <span
                              key={e}
                              className="rounded bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={queuedAlready ? "ghost" : "secondary"}
                      onClick={() => !queuedAlready && promote(r)}
                      disabled={queuedAlready}
                      className="shrink-0"
                    >
                      {queuedAlready ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Queued
                        </>
                      ) : (
                        "Queue action"
                      )}
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
