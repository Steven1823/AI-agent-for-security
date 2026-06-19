"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleSlash,
  Loader2,
  PlayCircle,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { AutonomousStatus } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SEVERITY_STYLE } from "@/lib/constants";
import { cn, formatClock } from "@/lib/utils";

const STATUS_META: Record<
  AutonomousStatus,
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  recommended: {
    label: "Recommended",
    tone: "bg-sky-500/20 text-sky-300",
    icon: Shield,
  },
  approved: {
    label: "Approved",
    tone: "bg-violet-500/20 text-violet-300",
    icon: ShieldCheck,
  },
  executing: {
    label: "Executing",
    tone: "bg-amber-500/20 text-amber-300",
    icon: Loader2,
  },
  executed: {
    label: "Executed",
    tone: "bg-emerald-500/20 text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    tone: "bg-rose-500/20 text-rose-300",
    icon: XCircle,
  },
};

const COLUMNS: { status: AutonomousStatus; label: string }[] = [
  { status: "recommended", label: "Recommended" },
  { status: "approved", label: "Approved" },
  { status: "executed", label: "Executed" },
];

export function AutonomousCenter() {
  const actions = usePulseStore((s) => s.autonomousActions);
  const approve = usePulseStore((s) => s.approveAction);
  const execute = usePulseStore((s) => s.executeAction);
  const reject = usePulseStore((s) => s.rejectAction);
  const clear = usePulseStore((s) => s.clearAutonomous);

  const grouped = useMemo(() => {
    const out: Record<AutonomousStatus, typeof actions> = {
      recommended: [],
      approved: [],
      executing: [],
      executed: [],
      rejected: [],
    };
    for (const a of actions) out[a.status].push(a);
    return out;
  }, [actions]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Autonomous Response Center
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="muted">{actions.length} total</Badge>
          {actions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <CircleSlash className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No autonomous actions queued. Promote a recommendation from the AI
            Recommendations Engine to get started.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {COLUMNS.map((col) => {
              const list =
                col.status === "approved"
                  ? [...grouped.approved, ...grouped.executing]
                  : grouped[col.status];
              return (
                <div key={col.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {col.label}
                    </p>
                    <Badge variant="muted">{list.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {list.length === 0 && (
                      <p className="rounded-md border border-dashed border-border/60 px-2 py-3 text-center text-[11px] text-muted-foreground/70">
                        Empty
                      </p>
                    )}
                    {list.map((a) => {
                      const sev = SEVERITY_STYLE[a.severity];
                      const meta = STATUS_META[a.status];
                      const Icon = meta.icon;
                      return (
                        <motion.div
                          key={a.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-border/60 bg-secondary/30 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px]",
                                meta.tone,
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-3 w-3",
                                  a.status === "executing" && "animate-spin",
                                )}
                              />
                              {meta.label}
                            </span>
                            <Badge variant={sev.badge}>{sev.label}</Badge>
                          </div>
                          <p className="mt-1.5 text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.detail}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                              <span>Confidence</span>
                              <span>{a.confidence}%</span>
                            </div>
                            <Progress
                              value={a.confidence}
                              className="mt-0.5 h-1"
                              indicatorClassName={
                                a.confidence >= 80
                                  ? "bg-emerald-400"
                                  : a.confidence >= 60
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }
                            />
                          </div>
                          {a.outcome && (
                            <p className="mt-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-200">
                              ✓ {a.outcome}
                            </p>
                          )}
                          {a.requiresHumanReview && a.status === "recommended" && (
                            <p className="mt-1 text-[10px] text-amber-300">
                              Requires human review before execution.
                            </p>
                          )}
                          <div className="mt-2 flex gap-1.5">
                            {a.status === "recommended" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="gradient"
                                  onClick={() => approve(a.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reject(a.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {a.status === "approved" && (
                              <Button
                                size="sm"
                                variant="gradient"
                                onClick={() => execute(a.id)}
                              >
                                <PlayCircle className="h-3.5 w-3.5" />
                                Execute
                              </Button>
                            )}
                            {a.executedAt && (
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                {formatClock(a.executedAt)}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
