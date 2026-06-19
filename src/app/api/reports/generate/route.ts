/**
 * POST /api/reports/generate
 *
 * Generates a markdown summary report from a snapshot of incidents and
 * cyber reports. Used by the /system-check page and the Reports module
 * for quick "give me a portable text export" actions.
 *
 * Body: { incidents?: Incident[], cyberReports?: CyberReport[], format?: "markdown" | "json" }
 */
import { NextResponse } from "next/server";
import { guardApi } from "@/lib/api-auth";
import type { CyberReport, Incident } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  incidents?: Incident[];
  cyberReports?: CyberReport[];
  format?: "markdown" | "json";
}

function pct(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function buildMarkdown(incidents: Incident[], reports: CyberReport[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString();
  lines.push(`# PulseGuard Cyber AI — Report`);
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- Incidents: **${incidents.length}**`);
  lines.push(`- Cyber reports: **${reports.length}**`);
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  lines.push(`- Resolved incidents: **${resolved}**`);
  lines.push("");

  if (incidents.length > 0) {
    lines.push(`## Incidents`);
    lines.push("");
    for (const i of incidents) {
      lines.push(`### ${i.title} (${i.severity})`);
      lines.push(`- Service: \`${i.service}\``);
      lines.push(`- Status: ${i.status}`);
      lines.push(`- Created: ${i.createdAt}`);
      lines.push(`- Resolved: ${i.resolvedAt ?? "—"} (${pct(i.resolutionMs)})`);
      lines.push(`- Root cause: ${i.rootCause}`);
      if (i.diagnosis) lines.push(`- Diagnosis: ${i.diagnosis}`);
      if (i.executiveSummary)
        lines.push(`- Executive summary: ${i.executiveSummary}`);
      lines.push("");
    }
  }

  if (reports.length > 0) {
    lines.push(`## Cyber Analyses`);
    lines.push("");
    for (const r of reports) {
      lines.push(`### ${r.input?.target ?? "(unknown target)"} — ${r.severity}`);
      lines.push(`- Source: ${r.source}`);
      lines.push(`- Risk score: ${r.riskScore}/100`);
      lines.push(`- Confidence: ${r.confidence}%`);
      lines.push(`- Diagnosis: ${r.diagnosis}`);
      lines.push("");
    }
  }

  if (incidents.length === 0 && reports.length === 0) {
    lines.push(`> No incidents or reports yet. Trigger an incident from the`);
    lines.push(`> dashboard or run a scan from the Analyzer to populate this report.`);
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  const guard = await guardApi();
  if (!guard.ok) return guard.res;

  const body = (await req.json().catch(() => ({}))) as Body;
  const incidents = Array.isArray(body.incidents) ? body.incidents : [];
  const reports = Array.isArray(body.cyberReports) ? body.cyberReports : [];
  const format = body.format ?? "markdown";

  if (format === "json") {
    return NextResponse.json({
      ok: true,
      format,
      ts: new Date().toISOString(),
      summary: {
        incidents: incidents.length,
        cyberReports: reports.length,
        resolved: incidents.filter((i) => i.status === "resolved").length,
      },
      incidents,
      cyberReports: reports,
    });
  }

  const md = buildMarkdown(incidents, reports);
  return NextResponse.json({
    ok: true,
    format: "markdown",
    ts: new Date().toISOString(),
    markdown: md,
    bytes: md.length,
  });
}
