import type { Incident, ReplayFrame } from "@/types";

/**
 * Convert an Incident into a structured Disaster Replay timeline that exposes
 * the AI's decision-making process. Built deterministically from the
 * incident's own timeline + agent fields — no fabrication.
 */
export function buildReplay(incident: Incident): ReplayFrame[] {
  const frames: ReplayFrame[] = [];
  const start = +new Date(incident.createdAt);

  frames.push({
    t: 0,
    kind: "detect",
    label: "Incident detected",
    detail: `${incident.title} on ${incident.service} (severity ${incident.severity}).`,
  });

  if (incident.diagnosis || incident.rootCause) {
    frames.push({
      t: 700,
      kind: "diagnose",
      label: "AI SRE Agent reasoning",
      detail: [
        incident.diagnosis ? `Diagnosis: ${incident.diagnosis}` : "",
        incident.rootCause ? `Root cause: ${incident.rootCause}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      confidence: incident.confidence,
    });
  }

  frames.push({
    t: 1600,
    kind: "decide",
    label: `Decision: ${incident.recoveryAction}`,
    detail: incident.businessImpact
      ? `Chosen because: ${incident.businessImpact}`
      : `Selected from recovery playbook for ${incident.type}.`,
    confidence: incident.confidence,
  });

  // Walk the recorded timeline for the actual recovery events
  for (const ev of incident.timeline) {
    const t = Math.max(0, +new Date(ev.timestamp) - start);
    if (/recovery started/i.test(ev.label)) {
      frames.push({
        t,
        kind: "recover",
        label: ev.label,
        detail: `Stage: started.`,
      });
    } else if (/recovery completed/i.test(ev.label)) {
      frames.push({
        t,
        kind: "resolve",
        label: ev.label,
        detail: `Stage: resolved · duration ${formatDur(incident.resolutionMs)}.`,
      });
    } else if (/recovery/i.test(ev.label) || /analyzed/i.test(ev.label)) {
      frames.push({
        t,
        kind: ev.label.toLowerCase().includes("analyzed") ? "diagnose" : "recover",
        label: ev.label,
        detail: ev.status === "done" ? "Completed" : "In progress",
      });
    }
  }

  return frames.sort((a, b) => a.t - b.t);
}

function formatDur(ms?: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
}
