/**
 * POST /api/services/check
 *
 * Runs a one-off health check for the given service. The caller can pass
 * either the full service (e.g. an unsaved one being tested in the
 * /services form) or just `{ serviceId }` plus an optional defaults list
 * the client already has in memory.
 *
 * Body: { service?: MonitoredService, serviceId?: string }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import {
  DEFAULT_SERVICES,
  checkService,
} from "@/services/monitor";
import { authEnabled, createClient } from "@/lib/supabase/server";
import type { MonitoredService } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  service?: MonitoredService;
  serviceId?: string;
}

export async function POST(req: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  let svc: MonitoredService | undefined = body.service;

  if (!svc && body.serviceId) {
    svc = DEFAULT_SERVICES.find((s) => s.id === body.serviceId);
    if (!svc && authEnabled) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data } = await supabase
            .from("monitored_services")
            .select("*")
            .eq("id", body.serviceId)
            .maybeSingle();
          if (data) {
            svc = {
              id: data.id,
              name: data.name,
              url: data.url,
              method: data.method,
              expectedStatus: data.expected_status,
              timeoutMs: data.timeout_ms,
              region: data.region,
              criticality: data.criticality,
              status: data.status,
              responseTimeMs: data.response_time_ms,
              lastCheckedAt: data.last_checked_at,
              failureCount: data.failure_count,
              createdAt: data.created_at,
            };
          }
        }
      } catch {
        // fall through to 404 below
      }
    }
  }

  if (!svc) {
    return NextResponse.json(
      { ok: false, error: "service not found" },
      { status: 404 },
    );
  }

  const check = await checkService(svc);

  // Persist if possible — non-fatal on failure.
  let persisted = false;
  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from("health_checks").insert({
          id: check.id,
          service_id: check.serviceId,
          service_name: check.serviceName,
          status: check.status,
          status_code: check.statusCode,
          response_time_ms: check.responseTimeMs,
          error_message: check.errorMessage,
          checked_at: check.checkedAt,
        });
        if (!error) persisted = true;
      }
    } catch {
      /* ignore persistence errors in demo */
    }
  }

  return NextResponse.json({
    ok: true,
    persisted,
    demoMode: !authEnabled,
    check,
  });
}
