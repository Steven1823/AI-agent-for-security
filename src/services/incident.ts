import type {
  Incident,
  IncidentType,
  Severity,
  ThreatLevel,
} from "@/types";
import { randBetween, uid } from "@/lib/utils";

interface Blueprint {
  title: string;
  service: string;
  severity: Severity;
  recoveryAction: string;
  rootCause: string;
  threat: [number, number];
  impact: [number, number];
}

export const INCIDENT_BLUEPRINTS: Record<IncidentType, Blueprint> = {
  api_failure: {
    title: "Payment API Failure",
    service: "payments-gateway",
    severity: "critical",
    recoveryAction: "Switch to Backup Mode",
    rootCause:
      "The primary API gateway returned repeated 5xx responses after an upstream dependency exhausted its connection pool.",
    threat: [10, 25],
    impact: [70, 95],
  },
  database_failure: {
    title: "Database Connection Failure",
    service: "orders-db-primary",
    severity: "high",
    recoveryAction: "Enable Read Only Mode",
    rootCause:
      "The primary database node lost quorum due to a replication lag spike, causing write transactions to time out.",
    threat: [8, 20],
    impact: [60, 88],
  },
  high_latency: {
    title: "Elevated Service Latency",
    service: "checkout-service",
    severity: "medium",
    recoveryAction: "Activate Cache Mode",
    rootCause:
      "Response times degraded as request volume surged beyond the autoscaler's warm-up threshold, saturating worker threads.",
    threat: [5, 15],
    impact: [40, 70],
  },
  security_attack: {
    title: "Suspicious Traffic Surge",
    service: "edge-firewall",
    severity: "critical",
    recoveryAction: "Rate Limit Requests",
    rootCause:
      "An anomalous burst of requests from a clustered set of IP ranges matched a volumetric DDoS signature at the edge.",
    threat: [70, 98],
    impact: [55, 90],
  },
};

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  api_failure: "API Failure",
  database_failure: "Database Failure",
  high_latency: "High Latency",
  security_attack: "Security Attack",
};

export function createIncident(type: IncidentType): Incident {
  const bp = INCIDENT_BLUEPRINTS[type];
  const now = new Date().toISOString();
  const threatScore = randBetween(bp.threat[0], bp.threat[1]);
  const metricImpact = randBetween(bp.impact[0], bp.impact[1]);

  return {
    id: uid("inc"),
    type,
    title: bp.title,
    service: bp.service,
    severity: bp.severity,
    status: "detected",
    createdAt: now,
    recoveryAction: bp.recoveryAction,
    recoveryStage: "idle",
    rootCause: bp.rootCause,
    explanation: "",
    threatScore,
    metricImpact,
    timeline: [
      {
        id: uid("ev"),
        label: "Incident detected",
        timestamp: now,
        status: "active",
      },
    ],
  };
}

export function threatLevelFromScore(score: number): ThreatLevel {
  if (score >= 70) return "critical";
  if (score >= 35) return "suspicious";
  return "safe";
}

export function computeHealthScore(incidents: Incident[]): number {
  const active = incidents.filter((i) => i.status !== "resolved");
  if (active.length === 0) return 100;
  const penalty = active.reduce((acc, i) => {
    const weight =
      i.severity === "critical"
        ? 22
        : i.severity === "high"
        ? 14
        : i.severity === "medium"
        ? 8
        : 4;
    const stageRelief = i.recoveryStage === "in_progress" ? 0.6 : 1;
    return acc + weight * stageRelief;
  }, 0);
  return Math.max(12, Math.round(100 - penalty));
}
