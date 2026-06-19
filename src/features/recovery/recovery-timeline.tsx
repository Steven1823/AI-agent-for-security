"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import type { Incident } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClock, cn } from "@/lib/utils";
import { usePulseStore } from "@/lib/store";

export function RecoveryTimeline({ incident }: { incident?: Incident }) {
  const incidents = usePulseStore((s) => s.incidents);
  const active = incident ?? incidents[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recovery Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {!active ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recovery sequences yet. Trigger an incident to watch the
            self-healing engine work.
          </p>
        ) : (
          <ol className="relative space-y-5 pl-2">
            {active.timeline.map((event, idx) => {
              const isDone = event.status === "done";
              const isActive = event.status === "active";
              const isLast = idx === active.timeline.length - 1;
              return (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex items-start gap-4"
                >
                  {!isLast && (
                    <span className="absolute left-[11px] top-7 h-[calc(100%+4px)] w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      isDone &&
                        "border-emerald-400/40 bg-emerald-500/20 text-emerald-400",
                      isActive &&
                        "border-sky-400/40 bg-sky-500/20 text-sky-400",
                      !isDone &&
                        !isActive &&
                        "border-border bg-secondary text-muted-foreground",
                    )}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isActive ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-foreground" : "text-foreground/90",
                        )}
                      >
                        {event.label}
                      </p>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatClock(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
