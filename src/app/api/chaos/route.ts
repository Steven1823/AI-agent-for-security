/**
 * POST /api/chaos
 *
 * Validates a chaos command (disable / enable / restore-all a component).
 * The real component state lives in the client-side Zustand store, so this
 * endpoint is mostly a contract & validator — it returns the canonical
 * payload the client should apply, plus a human-readable message.
 *
 * Body: { component?: ComponentId, action: "disable" | "enable" | "restore-all" }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import type { ComponentId } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_COMPONENTS: ComponentId[] = [
  "llm",
  "vector_db",
  "scanner",
  "threat_intel",
  "queue",
];

const COMPONENT_LABEL: Record<ComponentId, string> = {
  llm: "LLM Analyzer",
  vector_db: "Vector Knowledge DB",
  scanner: "Safe Recon Scanner",
  threat_intel: "Threat Intel Feed",
  queue: "Analysis Queue",
};

type Action = "disable" | "enable" | "restore-all";

interface Body {
  component?: ComponentId;
  action?: Action;
}

export async function POST(req: Request) {
  // Chaos is a write-ish action — engineers & admins only.
  const guard = await guardApi({ role: ["admin", "engineer"] });
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const action = body.action;

  if (!action || !["disable", "enable", "restore-all"].includes(action)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid action. Must be one of: disable | enable | restore-all",
      },
      { status: 400 },
    );
  }

  if (action === "restore-all") {
    return NextResponse.json({
      ok: true,
      action,
      message: "All components restored to nominal.",
      apply: { kind: "restore-all" as const },
    });
  }

  const component = body.component;
  if (!component || !VALID_COMPONENTS.includes(component)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid component. Must be one of: ${VALID_COMPONENTS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const newStatus = action === "disable" ? "offline" : "online";
  return NextResponse.json({
    ok: true,
    action,
    component,
    message: `${COMPONENT_LABEL[component]} ${action === "disable" ? "disabled" : "enabled"}. Fallback path engaged.`,
    apply: {
      kind: "set-component" as const,
      component,
      status: newStatus,
    },
  });
}
