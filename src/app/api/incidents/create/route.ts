/**
 * POST /api/incidents/create
 *
 * Creates an incident record. When Supabase is configured AND the
 * `incidents` table exists, the row is persisted; otherwise we return a
 * synthetic row so demo mode is still useful.
 *
 * Body: { type: IncidentType, title?: string, service?: string, severity?: Severity }
 */
import { NextResponse } from "next/server";
import { createIncident } from "@/services/incident";
import { authEnabled, createClient } from "@/lib/supabase/server";
import { guardApi } from "@/lib/api-auth";
import type { Incident, IncidentType, Severity } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: IncidentType[] = [
  "api_failure",
  "database_failure",
  "high_latency",
  "security_attack",
];

interface Body {
  type?: IncidentType;
  title?: string;
  service?: string;
  severity?: Severity;
}

export async function POST(req: Request) {
  // Any signed-in role can create demo incidents (engineers/admins are
  // expected to; viewers can still run system tests in demo mode).
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const type: IncidentType = VALID_TYPES.includes(body.type as IncidentType)
    ? (body.type as IncidentType)
    : "api_failure";

  const incident: Incident = {
    ...createIncident(type),
    ...(body.title ? { title: body.title } : {}),
    ...(body.service ? { service: body.service } : {}),
    ...(body.severity ? { severity: body.severity } : {}),
  };

  let persisted = false;
  let persistError: string | undefined;

  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from("incidents").insert({
          id: incident.id,
          type: incident.type,
          title: incident.title,
          service: incident.service,
          severity: incident.severity,
          status: incident.status,
          root_cause: incident.rootCause,
          recovery_action: incident.recoveryAction,
          threat_score: incident.threatScore,
          metric_impact: incident.metricImpact,
          created_at: incident.createdAt,
        });
        if (error) {
          persistError = error.message;
        } else {
          persisted = true;
        }
      }
    } catch (err) {
      persistError = err instanceof Error ? err.message : "unknown error";
    }
  }

  return NextResponse.json({
    ok: true,
    persisted,
    persistError,
    demoMode: !authEnabled,
    incident,
  });
}
