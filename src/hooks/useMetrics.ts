"use client";

import { useEffect } from "react";
import { usePulseStore } from "@/lib/store";

/**
 * Drives the live metrics simulation — ticks every 2 seconds.
 * Mounted once at the app shell level.
 */
export function useMetricsTicker(intervalMs = 2000) {
  const pushMetric = usePulseStore((s) => s.pushMetric);

  useEffect(() => {
    const id = setInterval(pushMetric, intervalMs);
    return () => clearInterval(id);
  }, [pushMetric, intervalMs]);
}
