import type {
  ComponentHealth,
  CyberReport,
  Incident,
  MetricSnapshot,
  Recommendation,
} from "@/types";

// IDs must be deterministic — the same recommendation across renders must
// keep the same id so the autonomous queue can match it back and the UI can
// show "Queued" state. Do NOT use random uid() here.

/**
 * Compute prioritized recommendations from the live store snapshot. Every
 * recommendation is grounded in an evidence reference (incident id, component
 * id, metric key, etc.) so the UI can show provenance and the AI Copilot can
 * cite them.
 */
export function computeRecommendations(args: {
  incidents: Incident[];
  components: Record<string, ComponentHealth>;
  cyberReports: CyberReport[];
  metrics: MetricSnapshot;
}): Recommendation[] {
  const out: Recommendation[] = [];

  // ---- Quick wins: degraded components
  const offline = Object.values(args.components).filter(
    (c) => c.status === "offline",
  );
  for (const c of offline) {
    out.push({
      id: `rec:restore:${c.id}`,
      kind: "quick_win",
      title: `Restore ${c.label}`,
      detail: `${c.label} is offline. Restoring it returns the cyber AI to full primary mode.`,
      confidence: 96,
      priority: 1,
      evidence: [`component:${c.id}`],
      requiresHumanReview: false,
    });
  }

  // ---- Quick wins: active critical/high incidents lacking diagnosis
  const stale = args.incidents.filter(
    (i) => i.status !== "resolved" && !i.diagnosis,
  );
  for (const i of stale) {
    out.push({
      id: `rec:sre:${i.id}`,
      kind: "quick_win",
      title: `Run SRE Agent on ${i.title}`,
      detail: `Incident ${i.id} has no diagnosis yet. Rerun the AI SRE agent to populate root cause.`,
      confidence: 88,
      priority: 2,
      evidence: [`incident:${i.id}`],
      requiresHumanReview: false,
    });
  }

  // ---- Hardening: critical cyber reports with low-grade TLS
  const weakTls = args.cyberReports.filter(
    (r) => r.scan.tlsGrade && /[CDF]/.test(r.scan.tlsGrade),
  );
  for (const r of weakTls.slice(0, 3)) {
    out.push({
      id: `rec:tls:${r.id}`,
      kind: "hardening",
      title: `Upgrade TLS on ${r.input.target}`,
      detail: `Scanner returned TLS grade ${r.scan.tlsGrade}. Disable legacy ciphers and enable HSTS.`,
      confidence: 92,
      priority: 2,
      evidence: [`cyber_report:${r.id}`],
      requiresHumanReview: false,
    });
  }

  // ---- Hardening: each critical cyber report
  for (const r of args.cyberReports.filter((r) => r.severity === "critical").slice(0, 3)) {
    out.push({
      id: `rec:contain:${r.id}`,
      kind: "hardening",
      title: `Containment for ${r.input.target}`,
      detail: r.mitigations[0] ?? r.recommendation,
      confidence: r.confidence,
      priority: 1,
      evidence: [`cyber_report:${r.id}`],
      requiresHumanReview: r.confidence < 70,
    });
  }

  // ---- Long-term: recurring incident types (3+ of the same type)
  const counts = new Map<string, Incident[]>();
  for (const i of args.incidents) {
    const arr = counts.get(i.type) ?? [];
    arr.push(i);
    counts.set(i.type, arr);
  }
  for (const [type, group] of counts) {
    if (group.length >= 3) {
      out.push({
        id: `rec:recur:${type}`,
        kind: "long_term",
        title: `Reduce ${type.replace("_", " ")} recurrence`,
        detail: `${group.length} incidents of this type detected. Invest in capacity planning or upstream redundancy.`,
        confidence: 75,
        priority: 3,
        evidence: group.slice(0, 3).map((i) => `incident:${i.id}`),
        requiresHumanReview: true,
      });
    }
  }

  // ---- Long-term: high metric pressure (sustained)
  if (args.metrics.cpu > 75 || args.metrics.database > 70) {
    out.push({
      id: "rec:scale",
      kind: "long_term",
      title: "Right-size compute and database tiers",
      detail: `CPU ${Math.round(args.metrics.cpu)}% / DB ${Math.round(args.metrics.database)}% under load. Consider vertical or horizontal scaling.`,
      confidence: 70,
      priority: 3,
      evidence: ["metric:cpu", "metric:database"],
      requiresHumanReview: true,
    });
  }

  // ---- Hardening floor: always provide at least one suggestion
  if (out.length === 0) {
    out.push({
      id: "rec:mfa-baseline",
      kind: "hardening",
      title: "Enable MFA for all administrative roles",
      detail: "Baseline best-practice. No active incidents, so use the quiet window to lift the floor.",
      confidence: 95,
      priority: 4,
      evidence: ["baseline"],
      requiresHumanReview: false,
    });
  }

  return out.sort(
    (a, b) => a.priority - b.priority || b.confidence - a.confidence,
  );
}
