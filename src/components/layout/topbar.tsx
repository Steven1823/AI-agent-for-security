"use client";

import { Volume2, VolumeX, Zap, Loader2 } from "lucide-react";
import { usePulseStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { formatClock } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Topbar() {
  const muted = usePulseStore((s) => s.muted);
  const volume = usePulseStore((s) => s.volume);
  const setVolume = usePulseStore((s) => s.setVolume);
  const toggleMute = usePulseStore((s) => s.toggleMute);
  const runDisaster = usePulseStore((s) => s.runDisasterScenario);
  const demoRunning = usePulseStore((s) => s.demoRunning);
  const health = usePulseStore((s) => s.healthScore());

  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => setClock(formatClock(new Date().toISOString()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const tone = health >= 85 ? "success" : health >= 60 ? "warning" : "danger";
  const effectivelyMuted = muted || volume === 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/60 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <StatusDot tone={tone} />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Operations Command</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Live · {clock || "--:--:--"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-2 py-1 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            aria-label={muted ? "Unmute voice" : "Mute voice"}
            title={muted ? "Unmute voice alerts" : "Mute voice alerts"}
            className="h-7 w-7"
          >
            {effectivelyMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-sky-400" />
            )}
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-secondary/80 accent-sky-400"
            aria-label="Voice volume"
            title={`Volume ${volume}%`}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={muted ? "Unmute voice" : "Mute voice"}
          title={muted ? "Unmute voice alerts" : "Mute voice alerts"}
          className="md:hidden"
        >
          {effectivelyMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-sky-400" />
          )}
        </Button>

        <Button
          variant="gradient"
          onClick={() => runDisaster()}
          disabled={demoRunning}
          className="hidden sm:inline-flex"
        >
          {demoRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {demoRunning ? "Running Scenario…" : "Run Disaster Scenario"}
        </Button>
      </div>
    </header>
  );
}
