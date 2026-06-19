"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  Brain,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Incident, ReplayFrame, ReplayFrameKind } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SEVERITY_STYLE } from "@/lib/constants";
import { buildReplay } from "@/services/replay";
import { cn, formatDateTime, formatDuration } from "@/lib/utils";

const KIND_META: Record<
  ReplayFrameKind,
  { icon: LucideIcon; tone: string; label: string }
> = {
  detect: { icon: AlertOctagon, tone: "text-rose-400", label: "Detection" },
  diagnose: { icon: Brain, tone: "text-sky-400", label: "Diagnosis" },
  decide: { icon: Brain, tone: "text-violet-400", label: "Decision" },
  recover: { icon: Wrench, tone: "text-amber-400", label: "Recovery" },
  resolve: { icon: CheckCircle2, tone: "text-emerald-400", label: "Resolved" },
};

export function DisasterReplay() {
  const incidents = usePulseStore((s) => s.incidents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    incidents.find((i) => i.id === selectedId) ?? incidents[0] ?? null;

  const frames = useMemo(
    () => (selected ? buildReplay(selected) : []),
    [selected],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-violet-400" />
          Disaster Replay
        </CardTitle>
        <Badge variant="muted">{incidents.length} replayable</Badge>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No incidents to replay yet. Trigger one from the Simulation Center.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <IncidentList
              incidents={incidents}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
            />
            {selected && <Player incident={selected} frames={frames} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IncidentList({
  incidents,
  selectedId,
  onSelect,
}: {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {incidents.slice(0, 8).map((i) => {
        const sev = SEVERITY_STYLE[i.severity];
        const isActive = selectedId === i.id;
        return (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className={cn(
              "w-full rounded-xl border bg-secondary/30 p-3 text-left transition-colors hover:border-violet-400/40",
              isActive
                ? "border-violet-400/60 bg-violet-500/5"
                : "border-border/60",
            )}
          >
            <div className="flex items-center justify-between">
              <Badge variant={sev.badge}>{sev.label}</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatDateTime(i.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{i.title}</p>
            <p className="text-xs text-muted-foreground">{i.service}</p>
          </button>
        );
      })}
    </div>
  );
}

function Player({ incident, frames }: { incident: Incident; frames: ReplayFrame[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [incident.id]);

  useEffect(() => {
    if (!playing) return;
    if (idx >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    tickRef.current = window.setTimeout(() => setIdx((i) => i + 1), 1100);
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
  }, [playing, idx, frames.length]);

  const current = frames[idx];
  const pct = frames.length > 1 ? Math.round((idx / (frames.length - 1)) * 100) : 100;
  const sev = SEVERITY_STYLE[incident.severity];

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{incident.title}</p>
          <p className="text-xs text-muted-foreground">
            {incident.service} · {formatDuration(incident.resolutionMs) || "in flight"}
          </p>
        </div>
        <Badge variant={sev.badge}>{sev.label}</Badge>
      </div>

      <Progress value={pct} className="h-1.5" indicatorClassName="bg-violet-400" />

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`${incident.id}-${idx}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-lg border border-border/60 bg-background/40 p-3"
          >
            <Frame frame={current} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Step {idx + 1} / {frames.length}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIdx(0);
              setPlaying(false);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart
          </Button>
          <Button
            variant={playing ? "secondary" : "gradient"}
            size="sm"
            onClick={() => {
              if (idx >= frames.length - 1) setIdx(0);
              setPlaying((p) => !p);
            }}
          >
            {playing ? (
              <>
                <PauseCircle className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step-rail */}
      <ol className="grid grid-cols-5 gap-1">
        {frames.map((f, fi) => {
          const meta = KIND_META[f.kind];
          const Icon = meta.icon;
          const active = fi === idx;
          const past = fi < idx;
          return (
            <li key={`${f.t}-${fi}`}>
              <button
                onClick={() => {
                  setIdx(fi);
                  setPlaying(false);
                }}
                className={cn(
                  "group flex w-full flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] transition-colors",
                  active && "bg-violet-500/15 text-violet-200",
                  past && !active && "text-muted-foreground",
                  !active && !past && "text-muted-foreground/60",
                )}
                title={f.label}
              >
                <Icon className={cn("h-3.5 w-3.5", active && meta.tone)} />
                {meta.label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Frame({ frame }: { frame: ReplayFrame }) {
  const meta = KIND_META[frame.kind];
  const Icon = meta.icon;
  return (
    <>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", meta.tone)} />
        <p className="text-sm font-medium">{frame.label}</p>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          +{Math.round(frame.t / 100) / 10}s
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
        {frame.detail}
      </p>
      {frame.confidence != null && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>AI Confidence</span>
            <span>{frame.confidence}%</span>
          </div>
          <Progress
            value={frame.confidence}
            className="mt-0.5 h-1"
            indicatorClassName={
              frame.confidence >= 80
                ? "bg-emerald-400"
                : frame.confidence >= 60
                ? "bg-amber-400"
                : "bg-rose-400"
            }
          />
        </div>
      )}
    </>
  );
}
