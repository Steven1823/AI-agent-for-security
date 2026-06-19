"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SimulationCenter } from "@/features/simulation/simulation-center";
import { SREAgentReport } from "@/features/incidents/sre-agent-report";
import { IncidentList } from "@/features/incidents/incident-list";
import { IncidentInvestigator } from "@/features/ai-investigator/incident-investigator";

export default function IncidentsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Incidents"
        description="Every detected failure, diagnosed and tracked through resolution."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SREAgentReport />
          <IncidentList title="All Incidents" />
        </div>
        <div className="lg:col-span-1">
          <SimulationCenter />
        </div>
      </div>
      <IncidentInvestigator />
    </div>
  );
}
