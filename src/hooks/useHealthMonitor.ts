"use client";

import { useEffect, useRef } from "react";
import { usePulseStore } from "@/lib/store";

/**
 * Drives the API Monitoring Engine on the client:
 *   - Bootstraps the demo service list on first mount.
 *   - Runs a full health-check sweep every `intervalMs` (default 30s).
 *   - Pauses while the tab is hidden — saves CPU & battery.
 *   - Resumes immediately when the tab regains focus, so the dashboard
 *     never looks stale.
 *
 * Mount once at the top of the app (we mount inside <AppShell/> so the
 * loop runs across every authenticated page).
 */
export function useHealthMonitor(intervalMs: number = 30_000) {
  const bootstrap = usePulseStore((s) => s.bootstrapMonitor);
  const runAll = usePulseStore((s) => s.runAllHealthChecks);
  const bootstrapped = usePulseStore((s) => s.monitorBootstrapped);
  const lastRun = useRef<number>(0);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!bootstrapped) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) {
        // visibility handler will restart us
        return;
      }
      lastRun.current = Date.now();
      try {
        await runAll();
      } catch {
        /* swallow — UI will retry on next tick */
      }
      if (cancelled) return;
      timer = setTimeout(tick, intervalMs);
    };

    // Fire once immediately so the dashboard has data, then schedule.
    tick();

    const onVisibility = () => {
      if (document.hidden) return;
      // If it's been a while, run immediately.
      if (Date.now() - lastRun.current > intervalMs / 2) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [bootstrapped, runAll, intervalMs]);
}
