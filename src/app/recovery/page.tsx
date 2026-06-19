"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { RecoveryStatus } from "@/features/recovery/recovery-status";
import { RecoveryTimeline } from "@/features/recovery/recovery-timeline";
import { RecoveryIntelligence } from "@/features/recovery/recovery-intel";
import { HistoricalChart } from "@/features/metrics/historical-chart";
import { IncidentList } from "@/features/incidents/incident-list";

export default function RecoveryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Recovery Center"
        description="Watch the self-healing engine execute remediation playbooks autonomously."
      />
      <PageIntro description="Recovery actions and their status. When a service fails, the AI picks the right remediation � switch to backup, enable cache, drop to rule fallback, alert admin � and you can watch it execute live." />
      <div className="grid gap-5 lg:grid-cols-2">
        <RecoveryStatus />
        <RecoveryTimeline />
      </div>
      <RecoveryIntelligence />
      <div className="grid gap-5 lg:grid-cols-2">
        <HistoricalChart />
        <IncidentList title="Recovery History" limit={8} />
      </div>
    </div>
  );
}
