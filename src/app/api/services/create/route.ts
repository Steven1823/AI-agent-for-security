/**
 * POST /api/services/create
 *
 * Adds a new monitored service. Requires engineer or admin role when auth
 * is enabled. In demo mode the row is returned as-is so the client can
 * push it to the Zustand store.
 *
 * Body: { name, url, method?, expectedStatus?, timeoutMs?, region?, criticality? }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import { authEnabled, createClient } from "@/lib/supabase/server";
import type {
  Criticality,
  MonitoredService,
  MonitorMethod,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  name?: string;
  url?: string;
  method?: MonitorMethod;
  expectedStatus?: number;
  timeoutMs?: number;
  region?: string;
  criticality?: Criticality;
}

const METHODS: MonitorMethod[] = ["GET", "HEAD", "POST"];
const CRITS: Criticality[] = ["low", "medium", "high", "critical"];

export async function POST(req: Request) {
  const guard = await guardApi({ role: ["admin", "engineer"] });
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = (body.name ?? "").trim();
  const url = (body.url ?? "").trim();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "name is required (min 2 chars)" },
      { status: 400 },
    );
  }
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("demo://"))) {
    return NextResponse.json(
      { ok: false, error: "url must start with http://, https://, or demo://" },
      { status: 400 },
    );
  }

  const service: MonitoredService = {
    id: `svc_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    name,
    url,
    method: METHODS.includes(body.method as MonitorMethod)
      ? (body.method as MonitorMethod)
      : "GET",
    expectedStatus: Math.max(100, Math.min(599, body.expectedStatus ?? 200)),
    timeoutMs: Math.max(500, Math.min(30000, body.timeoutMs ?? 5000)),
    region: body.region?.trim() || "us-east",
    criticality: CRITS.includes(body.criticality as Criticality)
      ? (body.criticality as Criticality)
      : "medium",
    status: "unknown",
    responseTimeMs: 0,
    lastCheckedAt: null,
    failureCount: 0,
    createdAt: new Date().toISOString(),
  };

  let persisted = false;
  let persistError: string | undefined;

  if (authEnabled) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { error } = await supabase.from("monitored_services").insert({
          id: service.id,
          name: service.name,
          url: service.url,
          method: service.method,
          expected_status: service.expectedStatus,
          timeout_ms: service.timeoutMs,
          region: service.region,
          criticality: service.criticality,
          status: service.status,
          response_time_ms: service.responseTimeMs,
          failure_count: service.failureCount,
          created_at: service.createdAt,
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
    service,
  });
}
