"use client";

import { jsPDF } from "jspdf";
import { Download, FileText } from "lucide-react";
import type { Incident } from "@/types";
import { usePulseStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INCIDENT_TYPE_META, SEVERITY_STYLE } from "@/lib/constants";
import { fallbackAnalysis } from "@/services/ai";
import { formatDateTime, formatDuration } from "@/lib/utils";

export function IncidentReports() {
  const incidents = usePulseStore((s) => s.incidents);

  return (
    <div className="space-y-4">
      {incidents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No reports available yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Each resolved incident automatically generates a post-incident
              report you can export as a PDF.
            </p>
          </CardContent>
        </Card>
      ) : (
        incidents.map((incident) => (
          <ReportCard key={incident.id} incident={incident} />
        ))
      )}
    </div>
  );
}

function ReportCard({ incident }: { incident: Incident }) {
  const meta = INCIDENT_TYPE_META[incident.type];
  const severity = SEVERITY_STYLE[incident.severity];
  const recommendation = fallbackAnalysis(incident).recommendation;

  const rows = [
    { label: "Issue", value: incident.title },
    {
      label: "Root Cause",
      value: incident.rootCause,
    },
    {
      label: "Business Impact",
      value: incident.businessImpact ?? fallbackAnalysis(incident).explanation,
    },
    { label: "Recovery Action", value: incident.recoveryAction },
    {
      label: "Duration",
      value: incident.resolutionMs
        ? formatDuration(incident.resolutionMs)
        : "In progress",
    },
    {
      label: "Status",
      value: incident.status === "resolved" ? "Resolved" : "Mitigating",
    },
  ];

  function exportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 48;
    let y = 64;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 595, 96, "F");
    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PulseGuard AI", left, 52);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Post-Incident Report", left, 72);

    y = 132;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(incident.title, left, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${incident.service}  ·  ${severity.label} severity  ·  ${formatDateTime(
        incident.createdAt,
      )}`,
      left,
      y,
    );

    y += 30;
    const fields: [string, string][] = [
      ["Issue", incident.title],
      ["Diagnosis", incident.diagnosis || incident.explanation || fallbackAnalysis(incident).explanation],
      ["Root Cause", incident.rootCause],
      ["Business Impact", incident.businessImpact || fallbackAnalysis(incident).explanation],
      ["Recovery Action", incident.recoveryAction],
      ["Recommendation", recommendation],
      [
        "Duration",
        incident.resolutionMs ? formatDuration(incident.resolutionMs) : "In progress",
      ],
      ["Status", incident.status === "resolved" ? "Resolved" : "Mitigating"],
      ["Executive Summary", incident.executiveSummary || fallbackAnalysis(incident).explanation],
    ];

    fields.forEach(([label, value]) => {
      const lines = doc.splitTextToSize(value, 500);
      if (y + lines.length * 14 + 30 > 800) {
        doc.addPage();
        y = 64;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(label.toUpperCase(), left, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(lines, left, y);
      y += lines.length * 14 + 14;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, 547, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Generated automatically by PulseGuard AI · Self-Healing Infrastructure",
      left,
      y,
    );

    doc.save(`pulseguard-report-${incident.id}.pdf`);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 normal-case tracking-normal">
          <span className="text-base">{meta.emoji}</span>
          <span className="text-sm font-semibold text-foreground">
            {incident.title}
          </span>
          <Badge variant={severity.badge}>{severity.label}</Badge>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={exportPdf}>
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-border/50 bg-secondary/20 p-3"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground/90">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
