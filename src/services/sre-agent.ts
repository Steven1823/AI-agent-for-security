import type {
  IncidentType,
  MetricSnapshot,
  Severity,
  SREAgentInput,
  SREAnalysis,
} from "@/types";

const INCIDENT_NAME: Record<IncidentType, string> = {
  api_failure: "API Timeout / Failure",
  database_failure: "Database Connection Failure",
  high_latency: "Elevated Service Latency",
  security_attack: "Security Attack / Volumetric Surge",
};

const ROOT_CAUSE: Record<IncidentType, string> = {
  api_failure:
    "Repeated timeout responses from an upstream service exhausted the primary gateway's connection pool.",
  database_failure:
    "The primary database node lost quorum after a replication lag spike, causing write transactions to time out.",
  high_latency:
    "Request volume surged past the autoscaler's warm-up threshold, saturating worker threads and queueing requests.",
  security_attack:
    "An anomalous burst of traffic from a clustered set of IP ranges matched a volumetric attack signature at the edge.",
};

const RECOVERY: Record<IncidentType, string> = {
  api_failure: "Switching traffic to the backup endpoint and draining the saturated connection pool.",
  database_failure: "Enabling read-only mode and promoting a healthy replica while replication recovers.",
  high_latency: "Activating the caching layer and pre-warming autoscaler capacity to absorb load.",
  security_attack: "Applying adaptive rate limiting at the edge and blocking the offending IP ranges.",
};

const USER_IMPACT: Record<IncidentType, string> = {
  api_failure: "Users may experience delayed or failed transactions during checkout.",
  database_failure: "Users may be unable to place new orders or save changes until writes are restored.",
  high_latency: "Users may experience slow page loads and sluggish interactions across the service.",
  security_attack: "Legitimate users may face intermittent availability while malicious traffic is filtered.",
};

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/**
 * Derives human-readable evidence from the live metric snapshot so the
 * diagnosis is grounded in real signals rather than a static template.
 */
export function metricSignals(m: MetricSnapshot): string[] {
  const signals: string[] = [];
  if (m.api < 90) signals.push(`API health degraded to ${Math.round(m.api)}%`);
  if (m.cpu > 75) signals.push(`CPU saturation at ${Math.round(m.cpu)}%`);
  if (m.memory > 75) signals.push(`Memory pressure at ${Math.round(m.memory)}%`);
  if (m.network > 70) signals.push(`Network throughput elevated to ${Math.round(m.network)}%`);
  if (m.database > 70) signals.push(`Database load elevated to ${Math.round(m.database)}%`);
  if (signals.length === 0) {
    signals.push("All core metrics within nominal range; anomaly detected at the request layer");
  }
  return signals;
}

function impactQualifier(severity: Severity, type: IncidentType): string {
  const scope =
    SEVERITY_RANK[severity] >= 4
      ? "A significant share of"
      : SEVERITY_RANK[severity] === 3
      ? "A subset of"
      : "A small number of";
  const revenue =
    type === "api_failure" || type === "database_failure"
      ? " Transaction revenue is at risk until the service is fully restored."
      : type === "security_attack"
      ? " Brand trust and availability SLAs are at risk if the surge is sustained."
      : " SLA latency targets may be breached if the condition persists.";
  return `${scope} active users are affected. ${USER_IMPACT[type]}${revenue}`;
}

/**
 * Deterministic AI SRE agent fallback. Produces a full, executive-ready
 * incident analysis grounded in the provided metrics — used when no OpenAI
 * key is configured so the demo is always intelligent and offline-safe.
 */
export function runSREAgent(input: SREAgentInput): SREAnalysis {
  const signals = metricSignals(input.metrics);
  const rootCause = input.rootCause || ROOT_CAUSE[input.type];

  const diagnosis = `${INCIDENT_NAME[input.type]} detected on ${input.service}. ${signals.join(
    "; ",
  )}.`;

  const businessImpact = impactQualifier(input.severity, input.type);

  const executiveSummary =
    SEVERITY_RANK[input.severity] >= 3
      ? `${input.severity === "critical" ? "Critical" : "High-severity"} service degradation detected on ${input.service} and automatically mitigated by PulseGuard. No manual intervention required.`
      : `Minor service degradation detected on ${input.service} and automatically contained by PulseGuard before user-facing impact.`;

  const confidence = Math.min(
    98,
    72 + SEVERITY_RANK[input.severity] * 5 + Math.min(signals.length, 4) * 2,
  );

  return {
    incident: INCIDENT_NAME[input.type],
    diagnosis,
    rootCause,
    severity: input.severity,
    recommendation: RECOVERY[input.type],
    businessImpact,
    executiveSummary,
    confidence,
    signals,
    source: "fallback",
  };
}

export function buildSREAgentPrompt(input: SREAgentInput): string {
  const m = input.metrics;
  return `You are an elite AI Site Reliability Engineer for PulseGuard, a self-healing infrastructure platform.
A production incident was detected. Analyze it like a senior SRE during an active page.

INCIDENT
- Type: ${input.type}
- Title: ${input.title}
- Affected service: ${input.service}
- Severity: ${input.severity}
- Timestamp: ${input.timestamp}

LIVE METRICS (0-100)
- CPU: ${Math.round(m.cpu)}
- Memory: ${Math.round(m.memory)}
- Network: ${Math.round(m.network)}
- Database: ${Math.round(m.database)}
- API health: ${Math.round(m.api)}

Tasks:
1. Diagnose the problem from the metrics and type.
2. Explain the most likely root cause.
3. Recommend a concrete recovery action.
4. Summarize the business impact for users/revenue.
5. Write a one-line executive summary for leadership.

Return STRICT JSON only, with keys:
"incident" (short name), "diagnosis", "rootCause", "recommendation", "businessImpact", "executiveSummary", "confidence" (0-100 integer), "signals" (array of short metric-based evidence strings). No markdown, JSON only.`;
}
