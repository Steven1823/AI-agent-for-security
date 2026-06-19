"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { ScanForm } from "@/features/cyber/scan-form";
import { ThreatReport } from "@/features/cyber/threat-report";
import { ComponentHealthPanel } from "@/features/cyber/component-health";
import { CyberReportHistory } from "@/features/cyber/report-history";

export default function AnalyzerPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Incident Analyzer"
        description="Submit a domain, IP, log, alert JSON, or natural-language incident. PulseGuard runs a safe simulated scan, queries the knowledge base, and produces an actionable report � even when components fail."
      />
      <PageIntro description="Submit logs, alert JSON, a domain, or an API error and the AI produces a diagnosis with confidence and recommended actions. Falls back to deterministic rules when the LLM is unavailable." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ScanForm />
          <ThreatReport />
        </div>
        <div className="space-y-5">
          <ComponentHealthPanel compact />
          <CyberReportHistory limit={6} />
        </div>
      </div>
    </div>
  );
}
