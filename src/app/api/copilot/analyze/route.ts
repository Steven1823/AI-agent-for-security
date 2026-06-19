/**
 * POST /api/copilot/analyze
 *
 * Thin server wrapper around the deterministic copilot.answer() engine —
 * lets external tooling (Slack bot, CLI) ask the Copilot questions without
 * loading the whole client store. Caller passes an optional context blob.
 *
 * Body: { query: string, context?: CopilotContext }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import { answer, type CopilotContext } from "@/services/copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  query?: string;
  context?: Partial<CopilotContext>;
}

const EMPTY_CONTEXT: CopilotContext = {
  incidents: [],
  components: {},
  cyberReports: [],
  metrics: { cpu: 0, memory: 0, network: 0, database: 0, api: 99 },
  recommendations: [],
};

export async function POST(req: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "query is required" },
      { status: 400 },
    );
  }

  const ctx: CopilotContext = {
    ...EMPTY_CONTEXT,
    ...body.context,
  } as CopilotContext;

  const reply = answer(query, ctx);

  return NextResponse.json({
    ok: true,
    reply,
  });
}
