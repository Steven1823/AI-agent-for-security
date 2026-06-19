export type IncidentType =
  | "api_failure"
  | "database_failure"
  | "high_latency"
  | "security_attack";

export type Severity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "detected"
  | "analyzing"
  | "recovering"
  | "resolved";

export type RecoveryStage =
  | "idle"
  | "started"
  | "in_progress"
  | "successful";

export type ThreatLevel = "safe" | "suspicious" | "critical";

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string; // ISO
  status: "done" | "active" | "pending";
}

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string; // ISO
  resolvedAt?: string; // ISO
  resolutionMs?: number;
  recoveryAction: string;
  recoveryStage: RecoveryStage;
  rootCause: string;
  explanation: string;
  threatScore: number; // 0-100
  metricImpact: number; // 0-100
  timeline: TimelineEvent[];
  // AI SRE Agent output
  diagnosis?: string;
  businessImpact?: string;
  executiveSummary?: string;
  confidence?: number; // 0-100
  agentSource?: "openai" | "fallback";
}

export interface SystemMetricPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number;
  database: number;
  api: number;
}

export interface MetricSnapshot {
  cpu: number;
  memory: number;
  network: number;
  database: number;
  api: number;
}

export interface IncidentReport {
  incidentId: string;
  issue: string;
  rootCause: string;
  recoveryAction: string;
  duration: string;
  status: string;
}

export interface AnalyzeResponse {
  explanation: string;
  rootCause: string;
  recommendation: string;
  source: "openai" | "fallback";
}

/** Input handed to the AI Site Reliability Engineer agent. */
export interface SREAgentInput {
  type: IncidentType;
  title: string;
  service: string;
  severity: Severity;
  timestamp: string; // ISO
  metrics: MetricSnapshot;
  rootCause?: string;
}

/** Structured analysis produced by the AI SRE agent. */
export interface SREAnalysis {
  incident: string; // human-readable incident name
  diagnosis: string; // what is happening
  rootCause: string; // why it is happening
  severity: Severity;
  recommendation: string; // recovery action
  businessImpact: string; // impact on users / revenue
  executiveSummary: string; // one-line summary for leadership
  confidence: number; // 0-100
  signals: string[]; // metric-derived evidence
  source: "openai" | "fallback";
}

// ---------- Cyber AI ----------

export type ComponentId =
  | "llm"
  | "vector_db"
  | "scanner"
  | "threat_intel"
  | "queue";

export type ComponentStatus = "online" | "degraded" | "offline";

export interface ComponentHealth {
  id: ComponentId;
  label: string;
  status: ComponentStatus;
  description: string;
  lastError?: string;
}

export type CyberInputKind =
  | "domain"
  | "ip"
  | "log"
  | "alert_json"
  | "natural_language";

export interface CyberInput {
  raw: string;
  kind: CyberInputKind;
  target: string;
}

export interface ScanFinding {
  category: string;
  detail: string;
  severity: Severity;
}

export interface ScanResult {
  target: string;
  openPorts: number[];
  services: string[];
  tlsGrade: string;
  dnsRecords: string[];
  headers: Record<string, string>;
  findings: ScanFinding[];
  source: "scanner" | "fallback";
}

export interface ThreatIntel {
  reputationScore: number; // 0-100 (higher = worse)
  categories: string[];
  knownActor?: string;
  sources: string[];
  source: "feed" | "fallback";
}

export interface Playbook {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  steps: string[];
}

export interface KnowledgeMatch {
  playbook: Playbook;
  score: number; // 0-1
  via: "vector" | "keyword";
}

export type FallbackStage = "ai" | "rules" | "cache" | "partial";

export interface CyberReport {
  id: string;
  createdAt: string;
  input: CyberInput;
  scan: ScanResult;
  threat: ThreatIntel;
  severity: Severity;
  riskScore: number; // 0-100
  diagnosis: string;
  rootCause: string;
  recommendation: string;
  businessImpact: string;
  executiveSummary: string;
  mitigations: string[];
  playbooks: KnowledgeMatch[];
  degradedComponents: ComponentId[];
  fallbackChain: FallbackStage[];
  confidence: number; // 0-100
  source: "openai" | "rules" | "cache" | "partial";
}

// ---------- Enterprise extensions ----------

/** MITRE ATT&CK technique mapping. */
export interface MitreTechnique {
  id: string; // e.g. "T1110"
  name: string; // e.g. "Brute Force"
  tactic: string; // e.g. "Credential Access"
  url: string;
}

/** A single CVE-style record used by the simulated CVE lookup. */
export interface CveRecord {
  id: string; // e.g. "CVE-2024-1234"
  title: string;
  cvss: number; // 0-10
  severity: Severity;
  summary: string;
  affected: string[];
}

/** Threat feed item generated from current incidents + cyber reports. */
export interface ThreatFeedItem {
  id: string;
  ts: string; // ISO
  severity: Severity;
  source: string; // "Edge Firewall" | "Cyber Analyzer" | ...
  indicator: string; // domain / IP / pattern
  message: string;
  actor?: string;
  mitre: MitreTechnique[];
  cves: CveRecord[];
  origin: "incident" | "cyber_report" | "synthetic";
  originId?: string;
}

/** Quick AI recommendation surfaced to operators. */
export type RecommendationKind = "quick_win" | "long_term" | "hardening";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  detail: string;
  confidence: number; // 0-100
  priority: number; // 1 (highest) – 5
  evidence: string[]; // grounded references e.g. "incident:inc_..."
  requiresHumanReview: boolean;
}

/** Autonomous action lifecycle. */
export type AutonomousStatus =
  | "recommended"
  | "approved"
  | "executing"
  | "executed"
  | "rejected";

export interface AutonomousAction {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  status: AutonomousStatus;
  recommendationId?: string;
  confidence: number;
  createdAt: string;
  approvedAt?: string;
  executedAt?: string;
  outcome?: string;
  requiresHumanReview: boolean;
}

/** Copilot chat. */
export type CopilotRole = "user" | "assistant" | "system";

export interface CopilotCitation {
  kind: "incident" | "cyber_report" | "metric" | "component" | "recommendation";
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: CopilotRole;
  content: string;
  ts: string; // ISO
  citations?: CopilotCitation[];
  confidence?: number;
}

/** Pattern discovered in temporal incident memory. */
export interface IncidentPattern {
  type: IncidentType;
  label: string;
  count: number;
  avgResolutionMs: number;
  recurrenceRisk: number; // 0-100
  lastSeen?: string; // ISO
  predictedNextWindowMin?: number;
}

/** Disaster Replay frame — one step in the AI decision process. */
export type ReplayFrameKind =
  | "detect"
  | "diagnose"
  | "decide"
  | "recover"
  | "resolve";

export interface ReplayFrame {
  t: number; // ms offset from incident start
  kind: ReplayFrameKind;
  label: string;
  detail: string;
  confidence?: number;
}

/** Business / executive risk snapshot. */
export interface ExecutiveRisk {
  businessRisk: number; // 0-100 (higher = worse)
  downtimeCostUsd: number; // dollars accrued from active/recent incidents
  recoveryEffectiveness: number; // 0-100
  securityPosture: number; // 0-100 (higher = better)
  resilienceTrend: { day: string; score: number }[]; // last 7 days
  mttrMs: number; // mean time to recovery (ms)
  mttdMs: number; // mean time to detection (ms) — simulated from severity
  recoverySuccessRate: number; // 0-100
}

// ---------- Monitoring Engine ----------


/** API monitor status: derived from latency + status code + chaos overrides. */
export type MonitorStatus = "healthy" | "degraded" | "failed" | "unknown";

/** Service criticality � drives alert priority, voice, and recovery selection. */
export type Criticality = "low" | "medium" | "high" | "critical";

/** HTTP methods supported by the monitor (kept tight on purpose). */
export type MonitorMethod = "GET" | "HEAD" | "POST";

/** A monitored service. URL "demo://service-id" runs in deterministic sim. */
export interface MonitoredService {
  id: string;
  name: string;
  url: string;
  method: MonitorMethod;
  expectedStatus: number;
  timeoutMs: number;
  region: string;
  criticality: Criticality;
  status: MonitorStatus;
  responseTimeMs: number;
  lastCheckedAt: string | null;
  failureCount: number; // consecutive failures (resets to 0 on healthy)
  createdAt: string;
}

/** A single point-in-time health-check observation. */
export interface HealthCheck {
  id: string;
  serviceId: string;
  serviceName: string;
  status: MonitorStatus;
  statusCode: number | null;
  responseTimeMs: number;
  errorMessage: string | null;
  checkedAt: string;
}

/** What kind of automated remediation to attempt. */
export type RecoveryActionType =
  | "switch-backup"
  | "enable-cache"
  | "rule-fallback"
  | "keyword-fallback"
  | "rate-limit"
  | "alert-admin"
  | "restart-component";

export type RecoveryActionStatus = "queued" | "running" | "done" | "failed";

export interface RecoveryAction {
  id: string;
  incidentId: string;
  serviceId: string | null;
  actionType: RecoveryActionType;
  actionStatus: RecoveryActionStatus;
  message: string;
  createdAt: string;
  completedAt?: string;
}

/** Chaos scenarios the user can trigger from the Chaos Center. */
export type ChaosScenario =
  | "api-failure"
  | "latency"
  | "ai-down"
  | "db-failure"
  | "security-attack";
