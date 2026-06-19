"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PageIntro } from "@/components/layout/page-intro";
import { AutonomousCenter } from "@/features/autonomous/autonomous-center";
import { RecommendationsEngine } from "@/features/recommendations/recommendations-engine";

export default function AutonomousPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Autonomous Response Center"
        description="Recommended ? Approved ? Executed. Every action shows its confidence and outcome; low-confidence items require human review."
      />
      <PageIntro description="Shows automatic decisions made by the recovery agent. Low-confidence actions require human approval; high-confidence ones execute automatically and report outcomes." />
      <RecommendationsEngine />
      <AutonomousCenter />
    </div>
  );
}
