"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  Mic,
  Volume2,
  VolumeX,
  Wrench,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Sample {
  label: string;
  icon: LucideIcon;
  build: (state: ReturnType<typeof usePulseStore.getState>) => string;
}

const SAMPLES: Sample[] = [
  {
    label: "Speak active alerts",
    icon: AlertOctagon,
    build: (s) => {
      const active = s.incidents.filter((i) => i.status !== "resolved");
      if (active.length === 0) return "No active incidents. All systems nominal.";
      return `${active.length} active incidents. Most severe: ${active[0].title}, severity ${active[0].severity}.`;
    },
  },
  {
    label: "Speak recovery actions",
    icon: Wrench,
    build: (s) => {
      const recent = s.incidents
        .filter((i) => i.recoveryStage !== "idle")
        .slice(0, 3);
      if (recent.length === 0) return "No recovery actions executed yet.";
      return `Recovery actions: ${recent
        .map((i) => `${i.recoveryAction} on ${i.service}`)
        .join("; ")}.`;
    },
  },
  {
    label: "Speak threat summary",
    icon: ShieldAlert,
    build: (s) => {
      const reports = s.cyberReports;
      if (reports.length === 0) return "No cyber reports on file.";
      const r = reports[0];
      return `Latest threat: ${r.executiveSummary || r.diagnosis}`;
    },
  },
];

export function VoiceOpsCenter() {
  const muted = usePulseStore((s) => s.muted);
  const volume = usePulseStore((s) => s.volume);
  const toggleMute = usePulseStore((s) => s.toggleMute);
  const setVolume = usePulseStore((s) => s.setVolume);
  const speak = usePulseStore((s) => s.speak);
  const queue = usePulseStore((s) => s.voiceQueue);

  const [supportsTts, setSupportsTts] = useState(true);
  useEffect(() => {
    setSupportsTts(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const trigger = (sample: Sample) => {
    const text = sample.build(usePulseStore.getState());
    speak(text);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-sky-400" />
          Voice Operations Center
        </CardTitle>
        <Badge variant={muted ? "muted" : "success"}>
          {muted ? "Muted" : "Speaking"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supportsTts && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            This browser doesn&apos;t expose SpeechSynthesis. Voice alerts will be
            silenced.
          </p>
        )}

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Master volume</span>
            <span>{volume}%</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4 text-sky-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-secondary/80 accent-sky-400"
              aria-label="Voice volume"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {SAMPLES.map((s) => {
            const Icon = s.icon;
            return (
              <Button
                key={s.label}
                variant="secondary"
                onClick={() => trigger(s)}
                disabled={muted || volume === 0}
                className={cn(
                  "h-auto flex-col items-start gap-1 py-3 text-left",
                  (muted || volume === 0) && "opacity-60",
                )}
              >
                <Icon className="h-4 w-4 text-sky-400" />
                <span className="text-xs">{s.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Voice queue
          </p>
          {queue.length === 0 ? (
            <p className="text-muted-foreground">Empty.</p>
          ) : (
            <ul className="space-y-0.5">
              {queue.slice(0, 4).map((q, i) => (
                <li key={i} className="truncate text-muted-foreground">
                  • {q}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
