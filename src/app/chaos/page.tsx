"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { ComponentHealthPanel } from "@/features/cyber/component-health";
import { ChaosRunner } from "@/features/chaos/chaos-runner";
import { ChaosScenarios } from "@/features/chaos/chaos-scenarios";
import { ThreatReport } from "@/features/cyber/threat-report";
import { SimulationCenter } from "@/features/simulation/simulation-center";

export default function ChaosPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Chaos Center"
        description="Break things on purpose. Toggle components offline to prove the resilience layer keeps the system functional — every analysis still produces a report."
      />
      <PageIntro description="Simulate failures to prove the system can recover. Click any scenario to corrupt a real monitored service — the dashboard, voice alerts, and AI recovery agent all react in real time." />
      <ChaosScenarios />
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
