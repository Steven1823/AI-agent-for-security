"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, Inbox, ShieldAlert } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_STYLE } from "@/lib/constants";
import { formatClock } from "@/lib/utils";
import { inputKindLabel } from "@/services/threat-intel";

const SRC_TONE = {
  openai: "success",
  rules: "warning",
  cache: "warning",
  partial: "danger",
} as const;

export function CyberReportHistory({ limit }: { limit?: number }) {
  const reports = usePulseStore((s) => s.cyberReports);
  const list = limit ? reports.slice(0, limit) : reports;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-sky-400" />
          Cyber Reports
        </CardTitle>
        <Badge variant="muted">{reports.length} total</Badge>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No reports yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit an incident in the Analyzer to populate this feed.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {list.map((r) => {
                const sev = SEVERITY_STYLE[r.severity];
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 p-3"
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {r.input.target}
                        </p>
                        <Badge variant={sev.badge}>{sev.label}</Badge>
                        <Badge variant={SRC_TONE[r.source]}>{r.source}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {inputKindLabel(r.input.kind)} · risk {r.riskScore} ·{" "}
                        {formatClock(r.createdAt)}
                        {r.degradedComponents.length > 0 &&
                          ` · degraded: ${r.degradedComponents.join(", ")}`}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
