"use client";

import { PageHeader } from "@/components/layout/page-header";
import { IncidentReports } from "@/features/reports/incident-reports";
import { CyberReportHistory } from "@/features/cyber/report-history";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Recovery Reports"
        description="Auto-generated post-incident reports and cyber analysis history. Export to PDF."
      />
      <CyberReportHistory />
      <IncidentReports />
    </div>
  );
}
