"use client";

import { create } from "zustand";
import type {
  AutonomousAction,
  ChatMessage,
  ComponentHealth,
  ComponentId,
  ComponentStatus,
  CyberReport,
  Incident,
  IncidentType,
  MetricSnapshot,
  Recommendation,
  SystemMetricPoint,
} from "@/types";
import {
  computeHealthScore,
  createIncident,
  threatLevelFromScore,
} from "@/services/incident";
import { runSREAgent } from "@/services/sre-agent";
import { answer as copilotAnswer } from "@/services/copilot";
import { computeRecommendations } from "@/services/recommendations";
import { clamp, formatClock, randBetween, uid } from "@/lib/utils";

const RECOVERY_DETAIL: Record<
  Incident["recoveryStage"],
  string
> = {
  idle: "Standing by",
  started: "Recovery started",
  in_progress: "Recovery in progress",
  successful: "Recovery successful",
};

interface PulseState {
  incidents: Incident[];
  metricHistory: SystemMetricPoint[];
  metrics: MetricSnapshot;
  muted: boolean;
  volume: number; // 0–100
  voiceQueue: string[];
  demoRunning: boolean;

  // cyber state
  components: Record<ComponentId, ComponentHealth>;
  cyberReports: CyberReport[];
  analyzing: boolean;

  // copilot / autonomous
  chatLog: ChatMessage[];
  copilotThinking: boolean;
  autonomousActions: AutonomousAction[];

  // derived helpers
  healthScore: () => number;
  threatScore: () => number;
  systemResilience: () => number;
  recommendations: () => Recommendation[];

  // actions
  toggleMute: () => void;
  setVolume: (v: number) => void;
  speak: (text: string) => void;
  consumeVoice: () => string | null;
  pushMetric: () => void;
  triggerIncident: (type: IncidentType) => Promise<Incident>;
  runDisasterScenario: () => Promise<void>;
  reset: () => void;

  // cyber actions
  setComponent: (id: ComponentId, status: ComponentStatus) => void;
  toggleComponent: (id: ComponentId) => void;
  restoreAllComponents: () => void;
  analyzeCyber: (raw: string) => Promise<CyberReport>;
  clearCyberReports: () => void;

  // copilot actions
  askCopilot: (text: string) => Promise<ChatMessage>;
  clearChat: () => void;

  // autonomous actions
  promoteRecommendation: (rec: Recommendation) => AutonomousAction;
  approveAction: (id: string) => void;
  executeAction: (id: string) => Promise<void>;
  rejectAction: (id: string) => void;
  clearAutonomous: () => void;
}

const BASELINE: MetricSnapshot = {
  cpu: 32,
  memory: 48,
  network: 40,
  database: 28,
  api: 99,
};

const DEFAULT_COMPONENTS: Record<ComponentId, ComponentHealth> = {
  llm: {
    id: "llm",
    label: "LLM Analyzer",
    status: "online",
    description: "OpenAI-powered cyber analyst.",
  },
  vector_db: {
    id: "vector_db",
    label: "Vector Knowledge DB",
    status: "online",
    description: "Embeddings-style playbook retrieval.",
  },
  scanner: {
    id: "scanner",
    label: "Safe Recon Scanner",
    status: "online",
    description: "Simulated, read-only attack surface scanner.",
  },
  threat_intel: {
    id: "threat_intel",
    label: "Threat Intel Feed",
    status: "online",
    description: "External reputation and IoC feeds.",
  },
  queue: {
    id: "queue",
    label: "Analysis Queue",
    status: "online",
    description: "Background work queue for long-running scans.",
  },
};

function nudge(value: number, target: number, jitter: number): number {
  const drift = (target - value) * 0.12;
  return clamp(value + drift + randBetween(-jitter, jitter));
}

export const usePulseStore = create<PulseState>((set, get) => ({
  incidents: [],
  metricHistory: seedHistory(),
  metrics: { ...BASELINE },
  muted: false,
  volume: 80,
  voiceQueue: [],
  demoRunning: false,

  components: { ...DEFAULT_COMPONENTS },
  cyberReports: [],
  analyzing: false,

  chatLog: [],
  copilotThinking: false,
  autonomousActions: [],

  healthScore: () => computeHealthScore(get().incidents),
  threatScore: () => {
    const active = get().incidents.filter((i) => i.status !== "resolved");
    if (active.length === 0) return 6;
    return Math.max(...active.map((i) => i.threatScore));
  },
  systemResilience: () => {
    const comps = Object.values(get().components);
    const online = comps.filter((c) => c.status === "online").length;
    return Math.round((online / comps.length) * 100);
  },
  recommendations: () =>
    computeRecommendations({
      incidents: get().incidents,
      components: get().components,
      cyberReports: get().cyberReports,
      metrics: get().metrics,
    }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),
  setVolume: (v) => set({ volume: clamp(v, 0, 100) }),

  speak: (text) => {
    set((s) => ({ voiceQueue: [...s.voiceQueue, text] }));
  },

  consumeVoice: () => {
    const [next, ...rest] = get().voiceQueue;
    if (!next) return null;
    set({ voiceQueue: rest });
    return next;
  },

  pushMetric: () => {
    const { metrics, incidents } = get();
    const active = incidents.filter((i) => i.status !== "resolved");
    const stress = active.reduce(
      (acc, i) => acc + i.metricImpact * (i.recoveryStage === "successful" ? 0 : 1),
      0,
    );
    const load = clamp(stress / 2, 0, 60);

    const next: MetricSnapshot = {
      cpu: nudge(metrics.cpu, BASELINE.cpu + load, 4),
      memory: nudge(metrics.memory, BASELINE.memory + load * 0.7, 3),
      network: nudge(metrics.network, BASELINE.network + load * 0.9, 5),
      database: nudge(metrics.database, BASELINE.database + load * 0.8, 4),
      api: clamp(nudge(metrics.api, 99 - load, 2)),
    };

    const point: SystemMetricPoint = {
      time: formatClock(new Date().toISOString()),
      ...roundSnapshot(next),
    };

    set((s) => ({
      metrics: next,
      metricHistory: [...s.metricHistory.slice(-29), point],
    }));
  },

  triggerIncident: async (type) => {
    const incident = createIncident(type);
    set((s) => ({ incidents: [incident, ...s.incidents] }));

    get().speak(voiceFor(type, "detected"));

    // 1. AI SRE Agent analysis (metrics-aware)
    await delay(700);
    const analysis = await runAgent(incident, get().metrics);
    patch(set, incident.id, (i) => ({
      status: "analyzing",
      explanation: analysis.diagnosis,
      rootCause: analysis.rootCause,
      diagnosis: analysis.diagnosis,
      recoveryAction: i.recoveryAction,
      businessImpact: analysis.businessImpact,
      executiveSummary: analysis.executiveSummary,
      confidence: analysis.confidence,
      agentSource: analysis.source,
      timeline: addEvent(i, "Root cause analyzed"),
    }));

    // 2. Recovery started
    await delay(900);
    get().speak("Recovery process initiated.");
    patch(set, incident.id, (i) => ({
      status: "recovering",
      recoveryStage: "started",
      timeline: addEvent(i, `Recovery started — ${i.recoveryAction}`),
    }));

    // 3. Recovery in progress
    await delay(1100);
    patch(set, incident.id, () => ({ recoveryStage: "in_progress" }));

    // 4. Resolved
    await delay(1600);
    const resolvedAt = new Date().toISOString();
    patch(set, incident.id, (i) => ({
      status: "resolved",
      recoveryStage: "successful",
      resolvedAt,
      resolutionMs: new Date(resolvedAt).getTime() - new Date(i.createdAt).getTime(),
      timeline: addEvent(
        { ...i, timeline: markActiveDone(i.timeline) },
        "Recovery completed",
        "done",
      ),
    }));
    get().speak(voiceFor(type, "resolved"));

    return get().incidents.find((i) => i.id === incident.id) ?? incident;
  },

  runDisasterScenario: async () => {
    if (get().demoRunning) return;
    set({ demoRunning: true });
    get().speak("Initiating disaster recovery simulation.");
    await get().triggerIncident("api_failure");
    set({ demoRunning: false });
  },

  reset: () =>
    set({
      incidents: [],
      metrics: { ...BASELINE },
      metricHistory: seedHistory(),
      voiceQueue: [],
      cyberReports: [],
      components: { ...DEFAULT_COMPONENTS },
      chatLog: [],
      autonomousActions: [],
    }),

  // ---------- cyber ----------

  setComponent: (id, status) =>
    set((s) => {
      const prev = s.components[id];
      const next: ComponentHealth = {
        ...prev,
        status,
        lastError:
          status === "offline" ? "Component disabled by chaos engineer." : undefined,
      };
      // Speak transitions for high-signal demo moments.
      if (prev.status !== status) {
        if (status === "offline") {
          s.voiceQueue.push(
            `${prev.label} disabled. Fallback path activated.`,
          );
        } else if (status === "online" && prev.status === "offline") {
          s.voiceQueue.push(`${prev.label} restored.`);
        }
      }
      return {
        components: { ...s.components, [id]: next },
        voiceQueue: [...s.voiceQueue],
      };
    }),

  toggleComponent: (id) => {
    const cur = get().components[id];
    get().setComponent(id, cur.status === "online" ? "offline" : "online");
  },

  restoreAllComponents: () => {
    const cur = get().components;
    const anyOffline = Object.values(cur).some((c) => c.status !== "online");
    set({ components: { ...DEFAULT_COMPONENTS } });
    if (anyOffline) get().speak("All systems restored to nominal.");
  },

  analyzeCyber: async (raw) => {
    set({ analyzing: true });
    const comps = get().components;
    const disabled = {
      llm: comps.llm.status === "offline",
      vector_db: comps.vector_db.status === "offline",
      scanner: comps.scanner.status === "offline",
      threat_intel: comps.threat_intel.status === "offline",
      queue: comps.queue.status === "offline",
    };

    get().speak("Threat detected. Analysis started.");

    // Simulate queue latency unless the queue is also disabled
    if (!disabled.queue) await delay(600);

    let report: CyberReport;
    try {
      try {
        const res = await fetch("/api/cyber/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw, disabled }),
        });
        if (!res.ok) throw new Error("analyze failed");
        report = (await res.json()) as CyberReport;
      } catch {
        // Last resort: client-side analyzer so we still produce a report.
        const { analyzeIncident } = await import("@/services/cyber-analyzer");
        report = await analyzeIncident({ raw, disabled });
      }

      if (report.source === "rules") {
        get().speak("AI provider failed. Rule-based fallback activated.");
      } else if (report.source === "cache") {
        get().speak("Serving last known good analysis from cache.");
      } else if (report.source === "partial") {
        get().speak("Partial report generated. Manual review recommended.");
      }

      // Batch the report-append and analyzing-reset into a single set() so
      // the UI never momentarily renders with both the new report AND the
      // loading spinner visible (the AnimatePresence in <ThreatReport/>
      // would otherwise keep the Loading branch around for a frame).
      set((s) => ({
        cyberReports: [report, ...s.cyberReports].slice(0, 25),
        analyzing: false,
      }));
      return report;
    } finally {
      // Defensive: always clear the analyzing flag so the UI never gets
      // stuck if the try block exits abnormally (HMR / nav / network reset).
      if (get().analyzing) set({ analyzing: false });
    }
  },

  clearCyberReports: () => set({ cyberReports: [] }),

  // ---------- copilot ----------

  askCopilot: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return null as unknown as ChatMessage;
    const userMsg: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed,
      ts: new Date().toISOString(),
    };
    set((s) => ({
      chatLog: [...s.chatLog, userMsg],
      copilotThinking: true,
    }));

    // Small delay so the typing indicator is visible.
    await delay(380);

    const ctx = {
      incidents: get().incidents,
      components: get().components,
      cyberReports: get().cyberReports,
      metrics: get().metrics,
      recommendations: get().recommendations(),
    };
    const reply = copilotAnswer(trimmed, ctx);

    set((s) => ({
      chatLog: [...s.chatLog, reply],
      copilotThinking: false,
    }));
    return reply;
  },

  clearChat: () => set({ chatLog: [] }),

  // ---------- autonomous response ----------

  promoteRecommendation: (rec) => {
    const action: AutonomousAction = {
      id: uid("act"),
      title: rec.title,
      detail: rec.detail,
      severity:
        rec.priority === 1 ? "critical" : rec.priority === 2 ? "high" : "medium",
      status: "recommended",
      recommendationId: rec.id,
      confidence: rec.confidence,
      createdAt: new Date().toISOString(),
      requiresHumanReview: rec.requiresHumanReview,
    };
    set((s) => ({ autonomousActions: [action, ...s.autonomousActions] }));
    get().speak(`New autonomous action queued: ${rec.title}.`);
    return action;
  },

  approveAction: (id) => {
    set((s) => ({
      autonomousActions: s.autonomousActions.map((a) =>
        a.id === id
          ? { ...a, status: "approved", approvedAt: new Date().toISOString() }
          : a,
      ),
    }));
    const a = get().autonomousActions.find((x) => x.id === id);
    if (a) get().speak(`Action approved: ${a.title}.`);
  },

  rejectAction: (id) => {
    set((s) => ({
      autonomousActions: s.autonomousActions.map((a) =>
        a.id === id ? { ...a, status: "rejected" } : a,
      ),
    }));
  },

  executeAction: async (id) => {
    set((s) => ({
      autonomousActions: s.autonomousActions.map((a) =>
        a.id === id ? { ...a, status: "executing" } : a,
      ),
    }));
    const action = get().autonomousActions.find((x) => x.id === id);
    if (!action) return;
    get().speak(`Executing ${action.title}.`);

    // Best-effort wiring to a real underlying action when possible.
    let outcome = "Action executed successfully.";
    for (const ev of action.detail.matchAll(/component:(\w+)/g)) {
      const compId = ev[1] as ComponentId;
      if (get().components[compId]?.status !== "online") {
        get().setComponent(compId, "online");
        outcome = `Restored ${get().components[compId].label}.`;
      }
    }
    if (/Restore ([A-Z].+)/.test(action.title)) {
      // Action title from quick-win component restoration.
      const label = action.title.replace(/^Restore\s+/, "");
      const target = Object.values(get().components).find(
        (c) => c.label === label,
      );
      if (target && target.status !== "online") {
        get().setComponent(target.id, "online");
        outcome = `Restored ${target.label}.`;
      }
    }

    await delay(900);

    set((s) => ({
      autonomousActions: s.autonomousActions.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "executed",
              executedAt: new Date().toISOString(),
              outcome,
            }
          : a,
      ),
    }));
    get().speak(`Action completed: ${action.title}.`);
  },

  clearAutonomous: () => set({ autonomousActions: [] }),
}));

// ---------- helpers ----------

function patch(
  set: (fn: (s: PulseState) => Partial<PulseState>) => void,
  id: string,
  updater: (i: Incident) => Partial<Incident>,
) {
  set((s) => ({
    incidents: s.incidents.map((i) =>
      i.id === id ? { ...i, ...updater(i) } : i,
    ),
  }));
}

function addEvent(
  incident: Incident,
  label: string,
  status: "active" | "done" = "active",
) {
  const timeline = markActiveDone(incident.timeline);
  return [
    ...timeline,
    {
      id: uid("ev"),
      label,
      timestamp: new Date().toISOString(),
      status,
    },
  ];
}

function markActiveDone(timeline: Incident["timeline"]) {
  return timeline.map((e) =>
    e.status === "active" ? { ...e, status: "done" as const } : e,
  );
}

async function runAgent(incident: Incident, metrics: MetricSnapshot) {
  const payload = {
    type: incident.type,
    title: incident.title,
    service: incident.service,
    severity: incident.severity,
    timestamp: incident.createdAt,
    metrics,
    rootCause: incident.rootCause,
  };
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("agent failed");
    return await res.json();
  } catch {
    return runSREAgent(payload);
  }
}

function voiceFor(type: IncidentType, phase: "detected" | "resolved"): string {
  const names: Record<IncidentType, string> = {
    api_failure: "Critical API failure",
    database_failure: "Database failure",
    high_latency: "High latency event",
    security_attack: "Security attack",
  };
  if (phase === "detected") return `${names[type]} detected.`;
  return "System restored successfully.";
}

function roundSnapshot(s: MetricSnapshot): MetricSnapshot {
  return {
    cpu: Math.round(s.cpu),
    memory: Math.round(s.memory),
    network: Math.round(s.network),
    database: Math.round(s.database),
    api: Math.round(s.api),
  };
}

function seedHistory(): SystemMetricPoint[] {
  const out: SystemMetricPoint[] = [];
  const base = Date.now() - 30 * 2000;
  for (let i = 0; i < 30; i++) {
    out.push({
      time: formatClock(new Date(base + i * 2000).toISOString()),
      cpu: clamp(BASELINE.cpu + randBetween(-5, 6)),
      memory: clamp(BASELINE.memory + randBetween(-5, 6)),
      network: clamp(BASELINE.network + randBetween(-6, 7)),
      database: clamp(BASELINE.database + randBetween(-4, 5)),
      api: clamp(99 + randBetween(-1, 0)),
    });
  }
  return out;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export { threatLevelFromScore };
