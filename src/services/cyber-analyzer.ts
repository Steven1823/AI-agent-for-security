import type {
  ComponentId,
  CyberInput,
  CyberReport,
  FallbackStage,
  KnowledgeMatch,
  ScanResult,
  Severity,
  ThreatIntel,
} from "@/types";
import { emptyScan, maxSeverity, simulatedScan } from "./scanner";
import {
  classifyInput,
  fallbackThreatIntel,
  inputKindLabel,
  simulatedThreatIntel,
} from "./threat-intel";
import { retrievePlaybooks } from "./knowledge";
import { cacheGet, cachePut } from "./resilience";
import { uid } from "@/lib/utils";

export interface AnalyzeArgs {
  raw: string;
  disabled?: Partial<Record<ComponentId, boolean>>;
}

const SEV_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3, critical: 4 };

function severityFromScores(scanSev: Severity, reputation: number): Severity {
  let sev = scanSev;
  if (reputation >= 80 && SEV_RANK[sev] < SEV_RANK.critical) sev = "critical";
  else if (reputation >= 60 && SEV_RANK[sev] < SEV_RANK.high) sev = "high";
  else if (reputation >= 35 && SEV_RANK[sev] < SEV_RANK.medium) sev = "medium";
  return sev;
}

function riskScore(scan: ScanResult, threat: ThreatIntel): number {
  const findingWeight = scan.findings.reduce(
    (a, f) => a + SEV_RANK[f.severity] * 8,
    0,
  );
  return Math.min(99, Math.round(threat.reputationScore * 0.6 + findingWeight));
}

/** Rule-based analyzer — runs when the LLM is offline or fails. */
function rulesAnalysis(
  input: CyberInput,
  scan: ScanResult,
  threat: ThreatIntel,
  playbooks: KnowledgeMatch[],
): Pick<
  CyberReport,
  "diagnosis" | "rootCause" | "recommendation" | "businessImpact" | "executiveSummary" | "mitigations"
> {
  const scanSev = maxSeverity(scan.findings);
  const severity = severityFromScores(scanSev, threat.reputationScore);
  const topFinding = scan.findings.sort(
    (a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity],
  )[0];

  const diagnosis = topFinding
    ? `${topFinding.category}: ${topFinding.detail} Reputation score for ${input.target} is ${threat.reputationScore}/100 (${threat.categories.join(", ")}).`
    : `No critical signals from the scanner. Threat reputation for ${input.target} is ${threat.reputationScore}/100 (${threat.categories.join(", ")}).`;

  const rootCause = threat.knownActor
    ? `Indicators align with known threat actor ${threat.knownActor}; surface left exposed by configuration drift.`
    : `Configuration drift and missing hardening controls left the asset partially exposed.`;

  const recommendation = playbooks[0]?.playbook.steps[0]
    ?? "Contain the asset, rotate credentials, and engage the on-call incident commander.";

  const businessImpact =
    severity === "critical"
      ? "Potential customer data exposure and regulatory reporting obligations if exploited."
      : severity === "high"
      ? "Service availability and user trust at meaningful risk if left unmitigated."
      : severity === "medium"
      ? "Limited exposure window; primarily compliance and posture risk."
      : "Negligible immediate impact; address during the next hardening cycle.";

  const executiveSummary = `${severity.toUpperCase()} risk detected on ${input.target}. ${
    threat.knownActor ? `Linked to ${threat.knownActor}. ` : ""
  }PulseGuard Cyber AI initiated containment guidance automatically.`;

  const mitigations = (playbooks[0]?.playbook.steps ?? []).slice(0, 4);

  return { diagnosis, rootCause, recommendation, businessImpact, executiveSummary, mitigations };
}

interface LLMOpts {
  apiKey?: string;
  signal?: AbortSignal;
}

async function llmAnalysis(
  input: CyberInput,
  scan: ScanResult,
  threat: ThreatIntel,
  playbooks: KnowledgeMatch[],
  opts: LLMOpts,
): Promise<ReturnType<typeof rulesAnalysis>> {
  if (!opts.apiKey) throw new Error("no api key");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: opts.apiKey });

  const prompt = `You are an elite AI cybersecurity analyst. Analyze this incident.

INPUT (${inputKindLabel(input.kind)}): ${input.raw.slice(0, 1200)}
TARGET: ${input.target}

SCAN
- Open ports: ${scan.openPorts.join(", ") || "(none)"}
- Services: ${scan.services.join(", ") || "(none)"}
- TLS grade: ${scan.tlsGrade}
- Findings: ${scan.findings.map((f) => `${f.severity}/${f.category} - ${f.detail}`).join(" | ") || "(none)"}

THREAT INTEL
- Reputation: ${threat.reputationScore}/100
- Categories: ${threat.categories.join(", ")}
- Known actor: ${threat.knownActor ?? "none"}

KNOWLEDGE BASE PLAYBOOKS
${playbooks.map((m) => `- ${m.playbook.title}: ${m.playbook.summary}`).join("\n") || "(none)"}

Return STRICT JSON with keys: diagnosis, rootCause, recommendation, businessImpact, executiveSummary, mitigations (array of 3-4 short imperative steps). JSON only.`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an elite AI cybersecurity analyst. Reply with JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  return {
    diagnosis: String(parsed.diagnosis ?? ""),
    rootCause: String(parsed.rootCause ?? ""),
    recommendation: String(parsed.recommendation ?? ""),
    businessImpact: String(parsed.businessImpact ?? ""),
    executiveSummary: String(parsed.executiveSummary ?? ""),
    mitigations: Array.isArray(parsed.mitigations) ? parsed.mitigations.map(String) : [],
  };
}

/**
 * Master orchestrator. Always returns a report, regardless of which
 * components are disabled or fail. Fallback chain:
 *   AI(LLM) → Rules → Cache → Partial.
 */
export async function analyzeIncident(args: AnalyzeArgs): Promise<CyberReport> {
  const disabled = args.disabled ?? {};
  const fallbackChain: FallbackStage[] = [];
  const degraded: ComponentId[] = [];

  const input = classifyInput(args.raw);

  // 1. Scanner (optional)
  let scan: ScanResult;
  if (disabled.scanner) {
    scan = emptyScan(input);
    degraded.push("scanner");
  } else {
    try {
      scan = simulatedScan(input);
    } catch {
      scan = emptyScan(input);
      degraded.push("scanner");
    }
  }

  // 2. Threat intel (optional)
  let threat: ThreatIntel;
  if (disabled.threat_intel) {
    threat = fallbackThreatIntel(input);
    degraded.push("threat_intel");
  } else {
    try {
      threat = simulatedThreatIntel(input);
    } catch {
      threat = fallbackThreatIntel(input);
      degraded.push("threat_intel");
    }
  }

  // 3. Knowledge retrieval (vector → keyword)
  const query = `${input.raw} ${scan.findings.map((f) => f.category).join(" ")} ${threat.categories.join(" ")}`;
  if (disabled.vector_db) degraded.push("vector_db");
  const playbooks = retrievePlaybooks(query, !!disabled.vector_db);
  const playbookViaKeyword = playbooks.every((p) => p.via === "keyword");

  // 4. Analysis: AI → Rules → Cache → Partial
  const cacheKey = `cyber:${input.target}`;
  let analysis: ReturnType<typeof rulesAnalysis>;
  let source: CyberReport["source"];

  if (disabled.llm) {
    degraded.push("llm");
    fallbackChain.push("rules");
    analysis = rulesAnalysis(input, scan, threat, playbooks);
    source = "rules";
  } else {
    try {
      fallbackChain.push("ai");
      analysis = await llmAnalysis(input, scan, threat, playbooks, {
        apiKey: process.env.OPENAI_API_KEY,
      });
      source = "openai";
    } catch {
      degraded.push("llm");
      fallbackChain.push("rules");
      try {
        analysis = rulesAnalysis(input, scan, threat, playbooks);
        source = "rules";
      } catch {
        const cached = cacheGet<CyberReport>(cacheKey);
        if (cached) {
          fallbackChain.push("cache");
          return { ...cached, id: uid("rep"), createdAt: new Date().toISOString(), source: "cache" };
        }
        fallbackChain.push("partial");
        analysis = {
          diagnosis: "Partial report: primary analyzers unavailable.",
          rootCause: "Unknown — insufficient telemetry.",
          recommendation: "Engage on-call analyst for manual triage.",
          businessImpact: "Indeterminate — proceed conservatively.",
          executiveSummary: "Degraded analysis produced; manual review recommended.",
          mitigations: ["Open an incident channel.", "Snapshot the asset.", "Notify the IC."],
        };
        source = "partial";
      }
    }
  }

  // 5. Queue (informational — affects timing only)
  if (disabled.queue) degraded.push("queue");

  const scanSev = maxSeverity(scan.findings);
  const severity = severityFromScores(scanSev, threat.reputationScore);
  // Cache hits return early above, so only ai/rules/partial are reachable here.
  const confidencePenalty = source === "partial" ? 30 : 0;
  const confidence = Math.max(
    25,
    100 - degraded.length * 15 - (playbookViaKeyword ? 8 : 0) - confidencePenalty,
  );

  const report: CyberReport = {
    id: uid("rep"),
    createdAt: new Date().toISOString(),
    input,
    scan,
    threat,
    severity,
    riskScore: riskScore(scan, threat),
    diagnosis: analysis.diagnosis,
    rootCause: analysis.rootCause,
    recommendation: analysis.recommendation,
    businessImpact: analysis.businessImpact,
    executiveSummary: analysis.executiveSummary,
    mitigations: analysis.mitigations,
    playbooks,
    degradedComponents: Array.from(new Set(degraded)),
    fallbackChain,
    confidence,
    source,
  };

  cachePut(cacheKey, report);
  return report;
}
