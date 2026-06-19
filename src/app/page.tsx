"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { StatCards } from "@/features/dashboard/stat-cards";
import { SimulationCenter } from "@/features/simulation/simulation-center";
import { SREAgentReport } from "@/features/incidents/sre-agent-report";
import { LiveMetricsPanel } from "@/features/metrics/live-metrics-panel";
import { SecurityCenter } from "@/features/security/security-center";
import { RecoveryTimeline } from "@/features/recovery/recovery-timeline";
import { RecoveryStatus } from "@/features/recovery/recovery-status";
import { IncidentList } from "@/features/incidents/incident-list";
import { HistoricalChart } from "@/features/metrics/historical-chart";
import { ComponentHealthPanel } from "@/features/cyber/component-health";
import { CyberReportHistory } from "@/features/cyber/report-history";
import { ExecutiveRiskDashboard } from "@/features/executive/risk-dashboard";
import { CopilotPanel } from "@/features/copilot/copilot-panel";
import { RecommendationsEngine } from "@/features/recommendations/recommendations-engine";
import { IncidentMemory } from "@/features/memory/incident-memory";

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="System Health Dashboard"
        description="AI-powered cybersecurity, autonomous detection, and self-healing recovery — resilient even when components fail."
      />

      <StatCards />

      <motion.div {...fade} transition={{ delay: 0.04 }}>
        <ExecutiveRiskDashboard />
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.05 }} className="lg:col-span-2">
          <LiveMetricsPanel />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <SimulationCenter />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div {...fade} transition={{ delay: 0.05 }} className="lg:col-span-2">
          <SREAgentReport />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <SecurityCenter />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <motion.div {...fade} transition={{ delay: 0.05 }}>
          <CopilotPanel compact />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <RecommendationsEngine compact />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05 }}>
          <ComponentHealthPanel />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <IncidentMemory compact />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05 }}>
          <RecoveryStatus />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <RecoveryTimeline />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05 }}>
          <HistoricalChart />
        </motion.div>
        <motion.div {...fade} transition={{ delay: 0.1 }}>
          <IncidentList limit={6} />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div {...fade} transition={{ delay: 0.05 }}>
          <CyberReportHistory limit={5} />
        </motion.div>
      </div>
    </div>
  );
}
