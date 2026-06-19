"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { IncidentReports } from "@/features/reports/incident-reports";
import { CyberReportHistory } from "@/features/cyber/report-history";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Recovery Reports"
        description="Auto-generated post-incident reports and cyber analysis history. Export to PDF."
      />
      <PageIntro description="Auto-generated reports for every resolved incident plus your full cyber analysis history. Export to PDF, share with stakeholders, or feed back into the knowledge base." />
      <CyberReportHistory />
      <IncidentReports />
    </div>
  );
}
