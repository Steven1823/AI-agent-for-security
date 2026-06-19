import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSREAgentPrompt, runSREAgent } from "@/services/sre-agent";
import { guardApi } from "@/lib/api-auth";
import type { SREAgentInput, SREAnalysis } from "@/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Any signed-in user can request analysis (read-only style query).
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const input = (await req.json().catch(() => null)) as SREAgentInput | null;
  if (!input || typeof input !== "object" || !input.title || !input.service) {
    return NextResponse.json(
      { error: "invalid body: title, service, type, severity, metrics required" },
      { status: 400 },
    );
  }
  const key = process.env.OPENAI_API_KEY;

  // Deterministic, metrics-aware fallback (always available, offline-safe).
  const fallback = runSREAgent(input);

  if (!key) {
    return NextResponse.json(fallback);
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an elite AI Site Reliability Engineer. Reply with JSON only.",
        },
        { role: "user", content: buildSREAgentPrompt(input) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const result: SREAnalysis = {
      incident: parsed.incident ?? fallback.incident,
      diagnosis: parsed.diagnosis ?? fallback.diagnosis,
      rootCause: parsed.rootCause ?? fallback.rootCause,
      severity: input.severity,
      recommendation: parsed.recommendation ?? fallback.recommendation,
      businessImpact: parsed.businessImpact ?? fallback.businessImpact,
      executiveSummary: parsed.executiveSummary ?? fallback.executiveSummary,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.round(parsed.confidence)
          : fallback.confidence,
      signals:
        Array.isArray(parsed.signals) && parsed.signals.length > 0
          ? parsed.signals.map(String)
          : fallback.signals,
      source: "openai",
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(fallback);
  }
}
