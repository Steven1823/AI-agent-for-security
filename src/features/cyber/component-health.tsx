"use client";

import { motion } from "framer-motion";
import { Boxes, BrainCircuit, Database, Radar, Workflow } from "lucide-react";
import type { ComponentHealth, ComponentId } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

const ICONS: Record<ComponentId, typeof BrainCircuit> = {
  llm: BrainCircuit,
  vector_db: Database,
  scanner: Radar,
  threat_intel: Boxes,
  queue: Workflow,
};

export function ComponentHealthPanel({ compact = false }: { compact?: boolean }) {
  const components = usePulseStore((s) => s.components);
  const toggle = usePulseStore((s) => s.toggleComponent);
  const restore = usePulseStore((s) => s.restoreAllComponents);
  const resilience = usePulseStore((s) => s.systemResilience());

  const list = Object.values(components);
  const offline = list.filter((c) => c.status === "offline").length;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Component Health</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={offline === 0 ? "success" : offline >= 3 ? "danger" : "warning"}>
            {resilience}% resilient
          </Badge>
          {offline > 0 && (
            <Button size="sm" variant="outline" onClick={restore}>
              Restore all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-1" : "sm:grid-cols-2",
        )}
      >
        {list.map((c) => (
          <ComponentRow key={c.id} comp={c} onToggle={() => toggle(c.id)} />
        ))}
      </CardContent>
    </Card>
  );
}

function ComponentRow({
  comp,
  onToggle,
}: {
  comp: ComponentHealth;
  onToggle: () => void;
}) {
  const Icon = ICONS[comp.id];
  const tone =
    comp.status === "online"
      ? "success"
      : comp.status === "degraded"
      ? "warning"
      : "danger";

  return (
    <motion.div
      layout
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        comp.status === "offline"
          ? "border-red-500/30 bg-red-500/5"
          : comp.status === "degraded"
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border/50 bg-secondary/20",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          comp.status === "online"
            ? "bg-emerald-500/10 text-emerald-400"
            : comp.status === "degraded"
            ? "bg-amber-500/10 text-amber-400"
            : "bg-red-500/10 text-red-400",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{comp.label}</p>
          <StatusDot tone={tone} pulse={comp.status !== "online"} />
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {comp.lastError ?? comp.description}
        </p>
      </div>
      <Button
        size="sm"
        variant={comp.status === "offline" ? "destructive" : "outline"}
        onClick={onToggle}
      >
        {comp.status === "offline" ? "Restore" : "Disable"}
      </Button>
    </motion.div>
  );
}
