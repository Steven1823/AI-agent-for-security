/**
 * GET/POST /api/recovery/actions
 *
 * GET  — list recent recovery actions (Supabase if available, else empty).
 * POST — queue a new recovery action.
 *
 * Body (POST): { incidentId, serviceId?, actionType, message }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import { authEnabled, createClient } from "@/lib/supabase/server";
import type { RecoveryAction, RecoveryActionType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: RecoveryActionType[] = [
  "switch-backup",
  "enable-cache",
  "rule-fallback",
  "keyword-fallback",
  "rate-limit",
  "alert-admin",
  "restart-component",
];

export async function GET() {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  let actions: RecoveryAction[] = [];
  let error: string | undefined;

  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error: e } = await supabase
          .from("recovery_actions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (e) error = e.message;
        else if (data) {
          actions = data.map((r: ActionRow) => ({
            id: r.id,
            incidentId: r.incident_id ?? "",
            serviceId: r.service_id,
            actionType: r.action_type as RecoveryActionType,
            actionStatus: r.action_status as RecoveryAction["actionStatus"],
            message: r.message,
            createdAt: r.created_at,
            completedAt: r.completed_at ?? undefined,
          }));
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "unknown error";
    }
  }

  return NextResponse.json({
    ok: true,
    error,
    demoMode: !authEnabled,
    count: actions.length,
    actions,
  });
}

interface PostBody {
  incidentId?: string;
  serviceId?: string | null;
  actionType?: RecoveryActionType;
  message?: string;
}

export async function POST(req: Request) {
  const guard = await guardApi({ role: ["admin", "engineer"] });
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as PostBody;
  if (!body.incidentId) {
    return NextResponse.json(
      { ok: false, error: "incidentId is required" },
      { status: 400 },
    );
  }
  if (!ACTIONS.includes(body.actionType as RecoveryActionType)) {
    return NextResponse.json(
      { ok: false, error: "invalid actionType" },
      { status: 400 },
    );
  }

  const action: RecoveryAction = {
    id: `rec_${Math.random().toString(36).slice(2, 10)}`,
    incidentId: body.incidentId,
    serviceId: body.serviceId ?? null,
    actionType: body.actionType as RecoveryActionType,
    actionStatus: "queued",
    message: body.message?.trim() || `${body.actionType} initiated.`,
    createdAt: new Date().toISOString(),
  };

  let persisted = false;
  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from("recovery_actions").insert({
          id: action.id,
          incident_id: action.incidentId,
          service_id: action.serviceId,
          action_type: action.actionType,
          action_status: action.actionStatus,
          message: action.message,
          created_at: action.createdAt,
        });
        if (!error) persisted = true;
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    ok: true,
    persisted,
    demoMode: !authEnabled,
    action,
  });
}

interface ActionRow {
  id: string;
  incident_id: string | null;
  service_id: string | null;
  action_type: string;
  action_status: string;
  message: string;
  created_at: string;
  completed_at: string | null;
}
