/**
 * POST /api/fallback-analysis
 *
 * Always runs the deterministic rule-based analyzer — never calls OpenAI.
 * Used by /system-check to prove that the offline fallback is healthy
 * even if `OPENAI_API_KEY` is set.
 *
 * Body: same shape as /api/analyze (type, title, service, severity, rootCause)
 */
import { NextResponse } from "next/server";
import { fallbackAnalysis } from "@/services/ai";
import { runSREAgent } from "@/services/sre-agent";
import { guardApi } from "@/lib/api-auth";
import type { IncidentType, Severity, MetricSnapshot } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  type?: IncidentType;
  title?: string;
  service?: string;
  severity?: Severity;
  rootCause?: string;
  metrics?: MetricSnapshot;
}

const DEFAULT_METRICS: MetricSnapshot = {
  cpu: 70,
  memory: 65,
  network: 55,
  database: 50,
  api: 80,
};

export async function POST(req: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const input = {
    type: (body.type ?? "api_failure") as IncidentType,
    title: body.title ?? "Synthetic incident — rule engine test",
    service: body.service ?? "diagnostic-service",
    severity: (body.severity ?? "high") as Severity,
    rootCause: body.rootCause ?? "Deterministic fallback exercise.",
    timestamp: new Date().toISOString(),
    metrics: body.metrics ?? DEFAULT_METRICS,
  };

  const sre = runSREAgent(input);
  const simple = fallbackAnalysis(input);

  return NextResponse.json({
    ok: true,
    source: "rule-engine",
    sre,
    analysis: simple,
  });
}
