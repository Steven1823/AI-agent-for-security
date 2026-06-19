/**
 * GET/POST /api/monitor/run-checks
 *
 * Server-side fan-out: load every monitored service, run a health check for
 * each, persist results (when Supabase is wired), open incidents on
 * 3-strike failures, and return a summary the dashboard can poll.
 *
 * Designed to be called by:
 *   - Vercel Cron        ("0/30 * * * * *" — every 30s)
 *   - Supabase Edge Func (schedule with pg_cron)
 *   - A Render / Railway worker doing setInterval
 *
 * It is safe to call from a browser too: in demo mode the in-memory
 * Zustand store keeps its own runAllHealthChecks loop and the two streams
 * simply converge on the same shape.
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import {
  DEFAULT_SERVICES,
  checkService,
  recoveryActionFor,
  summarize,
} from "@/services/monitor";
import { authEnabled, createClient } from "@/lib/supabase/server";
import { createIncident } from "@/services/incident";
import type {
  HealthCheck,
  Incident,
  IncidentType,
  MonitoredService,
  RecoveryAction,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FAILURE_THRESHOLD = 3;

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}

async function run() {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  let services: MonitoredService[] = DEFAULT_SERVICES.map((s) => ({ ...s }));
  let source: "supabase" | "demo" = "demo";
  const supabase = authEnabled ? await createClient() : null;

  if (supabase) {
    const { data, error } = await supabase
      .from("monitored_services")
      .select("*");
    if (!error && data && data.length > 0) {
      services = data.map((r: ServiceRow) => ({
        id: r.id,
        name: r.name,
        url: r.url,
        method: r.method as MonitoredService["method"],
        expectedStatus: r.expected_status,
        timeoutMs: r.timeout_ms,
        region: r.region,
        criticality: r.criticality as MonitoredService["criticality"],
        status: r.status as MonitoredService["status"],
        responseTimeMs: r.response_time_ms,
        lastCheckedAt: r.last_checked_at,
        failureCount: r.failure_count,
        createdAt: r.created_at,
      }));
      source = "supabase";
    }
  }

  const checks: HealthCheck[] = await Promise.all(
    services.map((s) => checkService(s)),
  );

  // Update service rows in-memory so summarize() reflects the new state.
  const updated = services.map((s, i) => {
    const c = checks[i];
    const failureCount = c.status === "failed" ? s.failureCount + 1 : 0;
    return {
      ...s,
      status: c.status,
      responseTimeMs: c.responseTimeMs,
      lastCheckedAt: c.checkedAt,
      failureCount,
    };
  });

  const newIncidents: Incident[] = [];
  const newRecoveries: RecoveryAction[] = [];

  for (let i = 0; i < updated.length; i++) {
    const s = updated[i];
    if (s.failureCount === FAILURE_THRESHOLD) {
      const inc = openIncidentFor(s);
      newIncidents.push(inc);
      const reco = recoveryActionFor(s);
      newRecoveries.push({
        id: `rec_${Math.random().toString(36).slice(2, 10)}`,
        incidentId: inc.id,
        serviceId: s.id,
        actionType: reco.actionType,
        actionStatus: "queued",
        message: reco.message,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Best-effort persistence — never fail the whole run on a bad write.
  if (supabase) {
    try {
      if (checks.length > 0) {
        await supabase.from("health_checks").insert(
          checks.map((c) => ({
            id: c.id,
            service_id: c.serviceId,
            service_name: c.serviceName,
            status: c.status,
            status_code: c.statusCode,
            response_time_ms: c.responseTimeMs,
            error_message: c.errorMessage,
            checked_at: c.checkedAt,
          })),
        );
      }
      for (const s of updated) {
        await supabase
          .from("monitored_services")
          .update({
            status: s.status,
            response_time_ms: s.responseTimeMs,
            failure_count: s.failureCount,
            last_checked_at: s.lastCheckedAt,
          })
          .eq("id", s.id);
      }
      if (newIncidents.length > 0) {
        await supabase.from("incidents").insert(
          newIncidents.map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title,
            service: i.service,
            severity: i.severity,
            status: i.status,
            root_cause: i.rootCause,
            recovery_action: i.recoveryAction,
            threat_score: i.threatScore,
            metric_impact: i.metricImpact,
            created_at: i.createdAt,
          })),
        );
      }
      if (newRecoveries.length > 0) {
        await supabase.from("recovery_actions").insert(
          newRecoveries.map((r) => ({
            id: r.id,
            incident_id: r.incidentId,
            service_id: r.serviceId,
            action_type: r.actionType,
            action_status: r.actionStatus,
            message: r.message,
            created_at: r.createdAt,
          })),
        );
      }
    } catch {
      /* swallow */
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    demoMode: !authEnabled,
    summary: summarize(updated),
    services: updated,
    checks,
    newIncidents,
    newRecoveries,
  });
}

function openIncidentFor(svc: MonitoredService): Incident {
  const type: IncidentType = (() => {
    const n = svc.name.toLowerCase();
    if (n.includes("auth") || n.includes("security")) return "security_attack";
    if (n.includes("database") || n.includes("db")) return "database_failure";
    if (n.includes("ai") || n.includes("payment")) return "high_latency";
    return "api_failure";
  })();
  const base = createIncident(type);
  return {
    ...base,
    service: svc.name,
    title: `${svc.name} unreachable — ${FAILURE_THRESHOLD} consecutive failed checks`,
  };
}

interface ServiceRow {
  id: string;
  name: string;
  url: string;
  method: string;
  expected_status: number;
  timeout_ms: number;
  region: string;
  criticality: string;
  status: string;
  response_time_ms: number;
  failure_count: number;
  last_checked_at: string | null;
  created_at: string;
}
