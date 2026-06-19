import { NextResponse } from "next/server";
import { analyzeIncident } from "@/services/cyber-analyzer";
import type { ComponentId } from "@/types";

export const runtime = "nodejs";

interface Body {
  raw: string;
  disabled?: Partial<Record<ComponentId, boolean>>;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body?.raw || typeof body.raw !== "string") {
    return NextResponse.json(
      { error: "raw input is required" },
      { status: 400 },
    );
  }
  const report = await analyzeIncident({
    raw: body.raw,
    disabled: body.disabled,
  });
  return NextResponse.json(report);
}
