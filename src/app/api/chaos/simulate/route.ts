/**
 * POST /api/chaos/simulate
 *
 * Higher-level chaos endpoint — activates a named scenario that crosses
 * multiple subsystems (services, components, incidents). Used by the new
 * Chaos Center quick-action buttons.
 *
 * The server validates the scenario and returns a directive the client
 * applies to the Zustand store. This keeps the API stateless while still
 * giving us a single source of truth for what each scenario does.
 *
 * Body: { scenario: ChaosScenario }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import type { ChaosScenario } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCENARIOS: ChaosScenario[] = [
  "api-failure",
  "latency",
  "ai-down",
  "db-failure",
  "security-attack",
];

const HUMAN: Record<ChaosScenario, string> = {
  "api-failure": "Main API offline — backup endpoint engaged.",
  latency: "Latency injected across all services — autoscaler tracking.",
  "ai-down": "AI provider unavailable — switching to deterministic rules.",
  "db-failure": "Database unreachable — serving cached reads.",
  "security-attack": "Auth attack detected — paging on-call admin.",
};

interface Body {
  scenario?: ChaosScenario;
}

export async function POST(req: Request) {
  const guard = await guardApi({ role: ["admin", "engineer"] });
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const scenario = body.scenario;

  if (!scenario || !SCENARIOS.includes(scenario)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Invalid scenario. Must be one of: ${SCENARIOS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    scenario,
    message: HUMAN[scenario],
    apply: { kind: "simulate-chaos" as const, scenario },
  });
}
