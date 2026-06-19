import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildPrompt, fallbackAnalysis } from "@/services/ai";
import type { AnalyzeResponse, IncidentType, Severity } from "@/types";

export const runtime = "nodejs";

interface Body {
  type: IncidentType;
  title: string;
  service: string;
  severity: Severity;
  rootCause: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body !== "object" || !body.title || !body.service) {
    return NextResponse.json(
      { error: "invalid body: title, service, type, severity required" },
      { status: 400 },
    );
  }
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return NextResponse.json(fallbackAnalysis(body));
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
            "You are PulseGuard, an elite SRE incident-analysis copilot. Reply with JSON only.",
        },
        { role: "user", content: buildPrompt(body) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const result: AnalyzeResponse = {
      explanation: parsed.explanation ?? fallbackAnalysis(body).explanation,
      rootCause: parsed.rootCause ?? body.rootCause,
      recommendation:
        parsed.recommendation ?? fallbackAnalysis(body).recommendation,
      source: "openai",
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(fallbackAnalysis(body));
  }
}
