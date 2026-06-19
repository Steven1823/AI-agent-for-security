# PulseGuard AI

AI-powered **self-healing infrastructure** platform. PulseGuard detects failures, diagnoses root causes with AI, auto-executes recovery playbooks, and narrates everything with voice — a futuristic DevOps copilot.

![stack](https://img.shields.io/badge/Next.js-15-black) ![ts](https://img.shields.io/badge/TypeScript-5-blue) ![tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **AI System Health Dashboard** — live health score, active/resolved incidents, recovery actions, security posture
- **Failure Simulation Center** — inject API / Database / Latency / Security failures
- **AI Incident Analyzer** — OpenAI-powered root-cause explanations (graceful fallback engine, no key required)
- **Recovery Engine** — auto-runs the right playbook (Backup Mode, Read-Only, Cache Mode, Rate Limit)
- **Recovery Timeline** — animated vertical timeline of the heal sequence
- **Voice Command Center** — browser Speech Synthesis narration with mute/unmute
- **Security Center** — threat scoring with animated progress ring
- **Temporal Memory** — historical resolution-time chart
- **Live Metrics Panel** — CPU / Memory / Network / Database / API, updated every 2s (Recharts)
- **Incident Reports** — auto-generated reports with **PDF export**
- **Run Disaster Scenario** — one-click end-to-end demo: failure → AI analysis → voice → recovery → restored

## Tech Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · ShadCN-style UI · Framer Motion · Recharts · Zustand · OpenAI · Supabase (optional) · Browser Speech Synthesis

## Getting Started

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI / Supabase keys
npm run dev
```

Open http://localhost:3000. The app works **out of the box** with no keys — OpenAI and Supabase are optional enhancements with built-in fallbacks.

## Architecture

```
src/
  app/          # Next.js routes + API (/api/analyze)
  components/   # UI primitives + layout shell
  features/     # Feature modules (dashboard, simulation, recovery, security, reports, metrics, incidents)
  hooks/        # useVoice, useMetricsTicker
  lib/          # store (zustand), constants, utils, supabase
  services/     # incident + ai domain logic
  types/        # shared TypeScript types
```

## Demo Script (judging)

1. Open the **Dashboard**.
2. Click **Run Disaster Scenario** (top-right).
3. Watch: incident detected → AI explains root cause → voice alert → recovery timeline animates → system restored.
4. Visit **Reports** → **Export PDF**.
