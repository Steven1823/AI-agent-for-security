"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ComponentHealthPanel } from "@/features/cyber/component-health";
import { ChaosRunner } from "@/features/chaos/chaos-runner";
import { ThreatReport } from "@/features/cyber/threat-report";
import { SimulationCenter } from "@/features/simulation/simulation-center";

export default function ChaosPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Chaos Center"
        description="Break things on purpose. Toggle components offline to prove the resilience layer keeps the system functional — every analysis still produces a report."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ComponentHealthPanel />
        <ChaosRunner />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SimulationCenter />
        <ThreatReport />
      </div>
    </div>
  );
}
