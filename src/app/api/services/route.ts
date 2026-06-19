/**
 * GET /api/services
 *
 * Returns the list of monitored services. When Supabase is configured we
 * read from `public.monitored_services`; otherwise we return the demo set
 * so the dashboard always has something to render.
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import { authEnabled, createClient } from "@/lib/supabase/server";
import { DEFAULT_SERVICES } from "@/services/monitor";
import type { MonitoredService } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  let services: MonitoredService[] = DEFAULT_SERVICES.map((s) => ({ ...s }));
  let source: "supabase" | "demo" = "demo";
  let error: string | undefined;

  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error: e } = await supabase
          .from("monitored_services")
          .select("*")
          .order("created_at", { ascending: true });
        if (e) {
          error = e.message;
        } else if (data && data.length > 0) {
          services = data.map(rowToService);
          source = "supabase";
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "unknown error";
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    error,
    demoMode: !authEnabled,
    count: services.length,
    services,
  });
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

function rowToService(r: ServiceRow): MonitoredService {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    method: (r.method as MonitoredService["method"]) ?? "GET",
    expectedStatus: r.expected_status ?? 200,
    timeoutMs: r.timeout_ms ?? 5000,
    region: r.region ?? "us-east",
    criticality: (r.criticality as MonitoredService["criticality"]) ?? "medium",
    status: (r.status as MonitoredService["status"]) ?? "unknown",
    responseTimeMs: r.response_time_ms ?? 0,
    lastCheckedAt: r.last_checked_at,
    failureCount: r.failure_count ?? 0,
    createdAt: r.created_at,
  };
}
