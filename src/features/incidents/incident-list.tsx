"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import type { Incident } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import {
  INCIDENT_TYPE_META,
  SEVERITY_STYLE,
  STATUS_STYLE,
} from "@/lib/constants";
import { formatClock, formatDuration } from "@/lib/utils";

export function IncidentList({
  title = "Incident Feed",
  limit,
  compact = false,
}: {
  title?: string;
  limit?: number;
  compact?: boolean;
}) {
  const incidents = usePulseStore((s) => s.incidents);
  const list = limit ? incidents.slice(0, limit) : incidents;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Badge variant="muted">{incidents.length} total</Badge>
      </CardHeader>
      <CardContent className="flex-1">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No incidents recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Temporal memory is empty — your infrastructure is healthy.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {list.map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  compact={compact}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentRow({
  incident,
  compact,
}: {
  incident: Incident;
  compact: boolean;
}) {
  const meta = INCIDENT_TYPE_META[incident.type];
  const status = STATUS_STYLE[incident.status];
  const severity = SEVERITY_STYLE[incident.severity];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/20 p-3"
    >
      <span className="text-lg">{meta.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{incident.title}</p>
          <Badge variant={severity.badge}>{severity.label}</Badge>
        </div>
        {!compact && (
          <p className="truncate text-xs text-muted-foreground">
            {incident.service} · {formatClock(incident.createdAt)}
            {incident.resolutionMs
              ? ` · healed in ${formatDuration(incident.resolutionMs)}`
              : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <StatusDot tone={status.tone} pulse={incident.status !== "resolved"} />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {status.label}
        </span>
      </div>
    </motion.li>
  );
}
