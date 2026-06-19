"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ExecutiveRiskDashboard } from "@/features/executive/risk-dashboard";
import { IncidentMemory } from "@/features/memory/incident-memory";
import { RecoveryIntelligence } from "@/features/recovery/recovery-intel";

export default function ExecutivePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Executive Risk Dashboard"
        description="Business risk, downtime cost, recovery effectiveness, and security posture — all derived live from the operational fabric."
      />
      <ExecutiveRiskDashboard />
      <div className="grid gap-5 lg:grid-cols-2">
        <RecoveryIntelligence />
        <IncidentMemory />
      </div>
    </div>
  );
}
