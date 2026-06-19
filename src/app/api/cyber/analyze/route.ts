import { NextResponse } from "next/server";
import { analyzeIncident } from "@/services/cyber-analyzer";
import { guardApi } from "@/lib/api-auth";
import type { ComponentId } from "@/types";

export const runtime = "nodejs";

interface Body {
  raw: string;
  disabled?: Partial<Record<ComponentId, boolean>>;
}

export async function POST(req: Request) {
  // Engineers + admins only — viewers can read reports but not trigger new scans.
  const guard = await guardApi({ role: ["admin", "engineer"] });
  if (!guard.ok) return guard.res;

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
