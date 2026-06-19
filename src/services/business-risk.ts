import type {
  ComponentHealth,
  CyberReport,
  ExecutiveRisk,
  Incident,
  MetricSnapshot,
} from "@/types";

const COST_PER_MIN: Record<string, number> = {
  api_failure: 4200, // payments down — high
  database_failure: 3100,
  high_latency: 800,
  security_attack: 5800, // brand + remediation
};

const MTTD_BY_SEVERITY: Record<string, number> = {
  critical: 9_000, // 9s — automated detection
  high: 18_000,
  medium: 45_000,
  low: 120_000,
};

/** Derive a full executive risk snapshot from live state. Pure function. */
export function computeExecutiveRisk(args: {
  incidents: Incident[];
  components: Record<string, ComponentHealth>;
  cyberReports: CyberReport[];
  metrics: MetricSnapshot;
}): ExecutiveRisk {
  // ---- Downtime cost
  let cost = 0;
  const now = Date.now();
  for (const i of args.incidents) {
    const start = +new Date(i.createdAt);
    const end = i.resolvedAt ? +new Date(i.resolvedAt) : now;
    const minutes = Math.max(0, (end - start) / 60_000);
    cost += minutes * (COST_PER_MIN[i.type] ?? 1500);
  }

  // ---- MTTR (resolved incidents only)
  const resolved = args.incidents.filter(
    (i) => i.resolutionMs && i.resolutionMs > 0,
  );
  const mttrMs = resolved.length
    ? Math.round(
        resolved.reduce((a, i) => a + (i.resolutionMs ?? 0), 0) /
          resolved.length,
      )
    : 0;

  // ---- MTTD (synthetic from severity mix)
  const mttdMs = args.incidents.length
    ? Math.round(
        args.incidents.reduce(
          (a, i) => a + (MTTD_BY_SEVERITY[i.severity] ?? 30_000),
          0,
        ) / args.incidents.length,
      )
    : 0;

  // ---- Recovery success rate
  const total = args.incidents.length;
  const recoveredOk = args.incidents.filter(
    (i) => i.recoveryStage === "successful",
  ).length;
  const recoverySuccessRate = total ? Math.round((recoveredOk / total) * 100) : 100;

  // ---- Recovery effectiveness (success rate weighted by MTTR speed)
  const speedScore = mttrMs === 0 ? 100 : Math.max(0, 100 - mttrMs / 600); // 60s → 0
  const recoveryEffectiveness = Math.round(
    0.65 * recoverySuccessRate + 0.35 * Math.min(100, speedScore),
  );

  // ---- Security posture (components online + critical cyber report load)
  const compCount = Object.values(args.components).length || 1;
  const online = Object.values(args.components).filter(
    (c) => c.status === "online",
  ).length;
  const compHealth = (online / compCount) * 100;
  const criticalReports = args.cyberReports.filter(
    (r) => r.severity === "critical",
  ).length;
  const securityPosture = Math.max(
    10,
    Math.round(compHealth - criticalReports * 8),
  );

  // ---- Business risk (active severity + cost + posture inverse)
  const active = args.incidents.filter((i) => i.status !== "resolved");
  const activeWeight = active.reduce((acc, i) => {
    const w =
      i.severity === "critical"
        ? 30
        : i.severity === "high"
        ? 18
        : i.severity === "medium"
        ? 10
        : 4;
    return acc + w;
  }, 0);
  const businessRisk = Math.min(
    100,
    Math.round(
      activeWeight + (100 - securityPosture) * 0.3 + Math.min(40, cost / 2000),
    ),
  );

  // ---- 7-day resilience trend (synthetic, monotone-ish around current posture)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const resilienceTrend = days.map((d, idx) => {
    const drift = Math.sin((idx + 1) * 0.9) * 6;
    const v = Math.round(
      Math.min(100, Math.max(40, securityPosture - 10 + drift + idx)),
    );
    return { day: d, score: v };
  });

  return {
    businessRisk,
    downtimeCostUsd: Math.round(cost),
    recoveryEffectiveness,
    securityPosture,
    resilienceTrend,
    mttrMs,
    mttdMs,
    recoverySuccessRate,
  };
}

export function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}
