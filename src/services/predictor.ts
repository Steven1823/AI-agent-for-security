import type { Incident, IncidentPattern, IncidentType } from "@/types";

const LABELS: Record<IncidentType, string> = {
  api_failure: "API Failure",
  database_failure: "Database Failure",
  high_latency: "High Latency",
  security_attack: "Security Attack",
};

/**
 * Look at historical incidents, group by type, and produce a recurrence-risk
 * score with a coarse "next window" prediction. Pure function — works against
 * whatever the store currently holds.
 */
export function findPatterns(incidents: Incident[]): IncidentPattern[] {
  if (incidents.length === 0) return [];
  const groups = new Map<IncidentType, Incident[]>();
  for (const i of incidents) {
    const arr = groups.get(i.type) ?? [];
    arr.push(i);
    groups.set(i.type, arr);
  }

  const out: IncidentPattern[] = [];
  for (const [type, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );
    const count = sorted.length;
    const resolved = sorted.filter((i) => i.resolutionMs);
    const avgResolutionMs = resolved.length
      ? Math.round(
          resolved.reduce((a, i) => a + (i.resolutionMs ?? 0), 0) /
            resolved.length,
        )
      : 0;

    // Average gap between consecutive incidents → prediction window
    let avgGapMs = 0;
    if (sorted.length >= 2) {
      let total = 0;
      for (let k = 1; k < sorted.length; k++) {
        total += +new Date(sorted[k].createdAt) - +new Date(sorted[k - 1].createdAt);
      }
      avgGapMs = total / (sorted.length - 1);
    }

    // Recurrence risk: more frequent + more recent = higher
    const recencyHrs =
      (Date.now() - +new Date(sorted[sorted.length - 1].createdAt)) / 3_600_000;
    const recencyBoost = Math.max(0, 30 - recencyHrs); // last 30h gets boost
    const recurrenceRisk = Math.min(
      100,
      Math.round(count * 14 + recencyBoost * 1.5),
    );

    out.push({
      type,
      label: LABELS[type],
      count,
      avgResolutionMs,
      recurrenceRisk,
      lastSeen: sorted[sorted.length - 1].createdAt,
      predictedNextWindowMin:
        avgGapMs > 0 ? Math.round(avgGapMs / 60_000) : undefined,
    });
  }

  return out.sort((a, b) => b.recurrenceRisk - a.recurrenceRisk);
}

/** Predicts the most likely next failure given current patterns. */
export function predictNextFailure(
  patterns: IncidentPattern[],
): IncidentPattern | null {
  if (patterns.length === 0) return null;
  return patterns[0];
}
