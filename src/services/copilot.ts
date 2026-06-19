import type {
  ChatMessage,
  ComponentHealth,
  CopilotCitation,
  CyberReport,
  Incident,
  MetricSnapshot,
  Recommendation,
} from "@/types";
import { uid, formatClock, formatDuration } from "@/lib/utils";
import { computeExecutiveRisk, formatUsd } from "./business-risk";
import { findPatterns, predictNextFailure } from "./predictor";

export interface CopilotContext {
  incidents: Incident[];
  components: Record<string, ComponentHealth>;
  cyberReports: CyberReport[];
  metrics: MetricSnapshot;
  recommendations: Recommendation[];
}

/**
 * Pattern-based, grounded responder. Every answer is built from the actual
 * store state so the AI Copilot is never hallucinating — citations point at
 * real incident/cyber report / component ids.
 */
export function answer(query: string, ctx: CopilotContext): ChatMessage {
  const q = query.trim().toLowerCase();
  const ts = new Date().toISOString();

  const respond = (
    content: string,
    citations: CopilotCitation[] = [],
    confidence = 88,
  ): ChatMessage => ({
    id: uid("msg"),
    role: "assistant",
    content,
    ts,
    citations,
    confidence,
  });

  // ---- Why did this fail?
  if (/why.*(fail|fall|down|broke)/.test(q) || /root cause/.test(q)) {
    const recent = [...ctx.incidents].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )[0];
    if (!recent) {
      return respond("No incidents on record yet — trigger one from the Simulation Center and I'll explain the failure path.", [], 70);
    }
    const lines = [
      `**${recent.title}** (${recent.severity}, ${recent.service})`,
      ``,
      `**Root cause:** ${recent.rootCause}`,
      recent.diagnosis ? `**Diagnosis:** ${recent.diagnosis}` : "",
      recent.businessImpact ? `**Business impact:** ${recent.businessImpact}` : "",
      `**Status:** ${recent.status} · recovery stage ${recent.recoveryStage}.`,
    ].filter(Boolean);
    return respond(lines.join("\n"), [
      { kind: "incident", id: recent.id, label: recent.title },
    ], recent.confidence ?? 85);
  }

  // ---- Biggest risk
  if (/biggest risk|top risk|main risk|highest risk|critical risk/.test(q)) {
    const exec = computeExecutiveRisk(ctx);
    const active = ctx.incidents.filter((i) => i.status !== "resolved");
    const offline = Object.values(ctx.components).filter(
      (c) => c.status !== "online",
    );
    const lines = [
      `**Business risk: ${exec.businessRisk}/100** (security posture ${exec.securityPosture}/100).`,
      `Accumulated downtime cost so far: **${formatUsd(exec.downtimeCostUsd)}**.`,
      active.length
        ? `${active.length} active incident${active.length > 1 ? "s" : ""} — most severe: **${active[0].title}** (${active[0].severity}).`
        : `No active incidents.`,
      offline.length
        ? `Degraded components: ${offline.map((c) => c.label).join(", ")}.`
        : `All cyber components online.`,
    ];
    const citations: CopilotCitation[] = [];
    if (active[0]) citations.push({ kind: "incident", id: active[0].id, label: active[0].title });
    for (const c of offline) citations.push({ kind: "component", id: c.id, label: c.label });
    return respond(lines.join("\n"), citations, 90);
  }

  // ---- How to improve resilience
  if (/improve|harden|resilien|recommendation|what should/.test(q)) {
    const top = ctx.recommendations.slice(0, 3);
    if (top.length === 0) {
      return respond("System is currently nominal. No prioritized recommendations queued.", [], 75);
    }
    const lines = [
      `Top ${top.length} prioritized recommendation${top.length > 1 ? "s" : ""}:`,
      ...top.map(
        (r, idx) =>
          `${idx + 1}. **${r.title}** — ${r.detail} _(${r.kind.replace("_", " ")}, ${r.confidence}% confidence)_`,
      ),
    ];
    const citations: CopilotCitation[] = top.map((r) => ({
      kind: "recommendation",
      id: r.id,
      label: r.title,
    }));
    return respond(lines.join("\n"), citations, 89);
  }

  // ---- Incidents today / recent
  if (/today|recent|last|last hour|past/.test(q) && /incident|failure|outage/.test(q)) {
    const dayMs = 24 * 3600 * 1000;
    const since = Date.now() - dayMs;
    const recent = ctx.incidents.filter((i) => +new Date(i.createdAt) >= since);
    if (recent.length === 0) {
      return respond("No incidents in the past 24h. The system has been stable.", [], 92);
    }
    const lines = [
      `**${recent.length} incident${recent.length > 1 ? "s" : ""}** in the last 24h:`,
      ...recent.slice(0, 5).map(
        (i) =>
          `• ${formatClock(i.createdAt)} — **${i.title}** (${i.severity}, ${i.status})`,
      ),
    ];
    return respond(lines.join("\n"), recent.slice(0, 5).map((i) => ({
      kind: "incident", id: i.id, label: i.title,
    })), 94);
  }

  // ---- Predict / what next
  if (/predict|next failure|forecast|what will/.test(q)) {
    const patterns = findPatterns(ctx.incidents);
    const top = predictNextFailure(patterns);
    if (!top) {
      return respond("Not enough history yet to predict — run the disaster scenario a few times to build a pattern.", [], 60);
    }
    return respond(
      `Most likely next failure type: **${top.label}** (${top.count} historical occurrences, ${top.recurrenceRisk}/100 recurrence risk${top.predictedNextWindowMin ? `, ~${top.predictedNextWindowMin}min window` : ""}).`,
      [],
      Math.min(90, top.recurrenceRisk + 20),
    );
  }

  // ---- Status / health
  if (/status|health|how are we|how is everything|right now/.test(q)) {
    const exec = computeExecutiveRisk(ctx);
    const active = ctx.incidents.filter((i) => i.status !== "resolved").length;
    return respond(
      [
        `**${active === 0 ? "Nominal." : `${active} active incident${active > 1 ? "s" : ""}.`}**`,
        `Business risk **${exec.businessRisk}/100**, security posture **${exec.securityPosture}/100**.`,
        `MTTR ${formatDuration(exec.mttrMs)}, recovery success **${exec.recoverySuccessRate}%**.`,
        `Metrics — CPU ${Math.round(ctx.metrics.cpu)}%, DB ${Math.round(ctx.metrics.database)}%, API ${Math.round(ctx.metrics.api)}%.`,
      ].join("\n"),
      [],
      92,
    );
  }

  // ---- Default: small grounded summary
  const exec = computeExecutiveRisk(ctx);
  return respond(
    [
      `I'm grounded against the live state of PulseGuard. Try asking:`,
      `• "Why did this fail?"`,
      `• "What is our biggest risk?"`,
      `• "How can we improve resilience?"`,
      `• "Show incidents from today"`,
      `• "Predict the next failure"`,
      ``,
      `Current snapshot — business risk **${exec.businessRisk}/100**, posture **${exec.securityPosture}/100**, recovery success **${exec.recoverySuccessRate}%**.`,
    ].join("\n"),
    [],
    72,
  );
}
