import type { AnalyzeResponse, IncidentType, Severity } from "@/types";

interface AnalyzeInput {
  type: IncidentType;
  title: string;
  service: string;
  severity: Severity;
  rootCause: string;
}

const IMPACT_BY_TYPE: Record<IncidentType, string> = {
  api_failure:
    "Impact is estimated to affect live transaction processing and checkout completion for a subset of users.",
  database_failure:
    "Impact is estimated to affect order persistence and any write-heavy workloads until replication recovers.",
  high_latency:
    "Impact is estimated to degrade page responsiveness and increase request queue depth across the service.",
  security_attack:
    "Impact is estimated to threaten availability at the edge and may exhaust connection capacity if unmitigated.",
};

const RECOMMENDATION_BY_TYPE: Record<IncidentType, string> = {
  api_failure:
    "Failover traffic to the backup gateway and drain the saturated connection pool before re-enabling primary routing.",
  database_failure:
    "Promote a healthy replica, enable read-only mode for the primary, and monitor replication lag before resuming writes.",
  high_latency:
    "Enable the caching layer, pre-warm autoscaler capacity, and shed non-critical background jobs.",
  security_attack:
    "Apply adaptive rate limiting at the edge, block the offending IP ranges, and raise the WAF sensitivity threshold.",
};

/**
 * Deterministic, production-quality fallback used when no OpenAI key is set.
 * Reads like a real SRE incident summary so the demo always looks intelligent.
 */
export function fallbackAnalysis(input: AnalyzeInput): AnalyzeResponse {
  const explanation = `The ${input.service} service experienced a ${input.severity} ${
    input.title
  }. ${input.rootCause} ${IMPACT_BY_TYPE[input.type]} Automated recovery has been initiated to restore normal operation.`;

  return {
    explanation,
    rootCause: input.rootCause,
    recommendation: RECOMMENDATION_BY_TYPE[input.type],
    source: "fallback",
  };
}

export function buildPrompt(input: AnalyzeInput): string {
  return `You are PulseGuard, an elite Site Reliability Engineering copilot.
A production incident was detected. Write a concise, confident incident analysis.

Incident type: ${input.type}
Title: ${input.title}
Affected service: ${input.service}
Severity: ${input.severity}
Detected root cause: ${input.rootCause}

Return STRICT JSON with keys: "explanation" (2-3 sentences describing what happened and the business impact), "rootCause" (one sentence), "recommendation" (one concrete remediation sentence). No markdown, JSON only.`;
}
