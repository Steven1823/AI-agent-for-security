"use client";

/**
 * Public landing page (route `/`).
 *
 * Premium hero with feature grid, mock dashboard preview, social proof,
 * and CTA cards. Routes to /login or /signup. Inspired by the visual
 * style of Linear / Vercel / Datadog / Google Cloud SCC.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldHalf,
  Sparkles,
  Activity,
  Lock,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Eye,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora" />
      <div className="fixed inset-0 -z-10 grid-bg" />

      <Nav />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:pt-28">
        <Hero />

        <DashboardPreview />

        <FeatureGrid />

        <MetricsStrip />

        <RolesSection />

        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 shadow-lg shadow-violet-500/30">
            <ShieldHalf className="h-4 w-4 text-white" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-gradient">
            PulseGuard
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#preview" className="hover:text-foreground">
            Product
          </a>
          <a href="#roles" className="hover:text-foreground">
            Roles
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="gradient" size="sm">
            <Link href="/signup">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Badge variant="accent" className="mx-auto">
          <Sparkles className="h-3 w-3" /> AI SRE Agent · Self-healing recovery
        </Badge>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
      >
        The cybersecurity copilot that{" "}
        <span className="text-gradient">heals itself</span> in real time.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
      >
        PulseGuard detects threats, diagnoses root causes with AI, and
        auto-executes recovery playbooks — even when individual components
        fail. Built for enterprise security teams.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <Button asChild variant="gradient" size="lg">
          <Link href="/signup">
            Start defending free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        SOC 2-ready · RBAC · Row-level security · No card required
      </motion.div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section id="preview" className="mx-auto mt-20 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background/80 to-secondary/30 p-1 shadow-2xl shadow-violet-500/20"
      >
        <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-6 backdrop-blur-2xl">
          {/* Fake browser chrome */}
          <div className="mb-6 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            <div className="ml-4 hidden h-7 flex-1 items-center rounded-md border border-border/60 bg-secondary/40 px-3 text-xs text-muted-foreground sm:flex">
              app.pulseguard.ai/dashboard
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PreviewCard
              icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
              label="System Health"
              value="98%"
              tone="emerald"
              spark={[60, 72, 81, 78, 85, 92, 98]}
            />
            <PreviewCard
              icon={<Cpu className="h-4 w-4 text-sky-400" />}
              label="Active Threats"
              value="3"
              tone="sky"
              spark={[2, 5, 4, 7, 3, 6, 3]}
            />
            <PreviewCard
              icon={<Bot className="h-4 w-4 text-violet-400" />}
              label="AI Confidence"
              value="94%"
              tone="violet"
              spark={[80, 82, 88, 90, 91, 93, 94]}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live incident — auth-service
                </p>
              </div>
              <p className="mt-3 text-sm font-medium">
                AI Diagnosis · Token validation regression
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recovery playbook executed in 2.4s · 100% restored
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Badge variant="danger">High</Badge>
                <Badge variant="success">Recovered</Badge>
                <Badge variant="accent">AI · 94%</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Executive Risk
              </p>
              <p className="mt-3 text-2xl font-bold">$0 lost</p>
              <p className="text-xs text-muted-foreground">
                Auto-recovery prevented $12,400 estimated impact
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary/60">
                <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Glow */}
        <div className="pointer-events-none absolute -inset-x-20 -top-40 h-80 rounded-full bg-violet-500/20 blur-3xl" />
      </motion.div>
    </section>
  );
}

function PreviewCard({
  icon,
  label,
  value,
  tone,
  spark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "sky" | "violet";
  spark: number[];
}) {
  const max = Math.max(...spark);
  const points = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");
  const colorMap = {
    emerald: "stroke-emerald-400",
    sky: "stroke-sky-400",
    violet: "stroke-violet-400",
  } as const;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/30 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-2 h-10 w-full"
      >
        <polyline
          points={points}
          fill="none"
          strokeWidth="2"
          className={colorMap[tone]}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: <Bot className="h-5 w-5 text-violet-400" />,
      title: "AI SRE Agent",
      body: "Grounded incident analysis with rule-engine fallback. Returns root cause, business impact, and recovery action.",
    },
    {
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      title: "Self-healing playbooks",
      body: "Auto-runs Backup Mode, Read-Only, Cache Mode, and Rate Limit playbooks the second a failure is detected.",
    },
    {
      icon: <Lock className="h-5 w-5 text-sky-400" />,
      title: "Role-based access",
      body: "Admin · Engineer · Viewer roles enforced end-to-end with Supabase row-level security.",
    },
    {
      icon: <Eye className="h-5 w-5 text-fuchsia-400" />,
      title: "Live threat intel",
      body: "MITRE ATT&CK mapping, CVE lookups, and a curated threat feed grounded in your real incidents.",
    },
    {
      icon: <Zap className="h-5 w-5 text-amber-400" />,
      title: "Chaos engineering",
      body: "Inject API / DB / latency / security failures to validate recovery — safely sandboxed.",
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-rose-400" />,
      title: "Executive dashboard",
      body: "Risk score, MTTR/MTTD trends, cost-saved metric, and PDF-exportable incident reports.",
    },
  ];
  return (
    <section id="features" className="mx-auto mt-24 max-w-6xl">
      <SectionTitle
        eyebrow="Platform"
        title="Everything you need to defend & recover."
        subtitle="From real-time detection to autonomous remediation, in one premium console."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.03 * i }}
            className="glass rounded-2xl p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60">
              {f.icon}
            </span>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MetricsStrip() {
  const stats = [
    { v: "2.4s", l: "Median time-to-recovery" },
    { v: "94%", l: "AI confidence avg." },
    { v: "13", l: "Live ops modules" },
    { v: "RLS", l: "Row-level security" },
  ];
  return (
    <section className="mx-auto mt-24 max-w-6xl">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border/60 bg-border/60 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="bg-background/80 p-6 text-center">
            <p className="text-3xl font-bold tracking-tight text-gradient">
              {s.v}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RolesSection() {
  const roles = [
    {
      role: "Admin",
      tone: "danger" as const,
      desc: "Manage users, approve autonomous actions, run chaos scenarios.",
      perms: [
        "Run disaster scenarios",
        "Approve autonomous remediation",
        "Manage organization members",
      ],
    },
    {
      role: "Engineer",
      tone: "default" as const,
      desc: "Investigate, analyze, and queue recovery actions.",
      perms: [
        "Run incident analyzer",
        "Trigger recovery playbooks",
        "Author runbooks & queries",
      ],
    },
    {
      role: "Viewer",
      tone: "muted" as const,
      desc: "Read-only access to dashboards and reports.",
      perms: ["Browse dashboards", "Export incident reports", "View threat feed"],
    },
  ];
  return (
    <section id="roles" className="mx-auto mt-24 max-w-6xl">
      <SectionTitle
        eyebrow="Access control"
        title="Three roles. Zero ambiguity."
        subtitle="Enforced at the API and database layers via Supabase RLS — not just the UI."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {roles.map((r) => (
          <div key={r.role} className="glass rounded-2xl p-6">
            <Badge variant={r.tone}>
              <ShieldCheck className="h-3 w-3" />
              {r.role}
            </Badge>
            <p className="mt-4 text-sm text-muted-foreground">{r.desc}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {r.perms.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-sky-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto mt-24 max-w-5xl">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-violet-500/10 to-fuchsia-500/10 p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute -inset-x-20 -top-40 h-80 rounded-full bg-sky-500/20 blur-3xl" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to make your infra{" "}
          <span className="text-gradient">unbreakable</span>?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Spin up your tenant in under a minute. Demo credentials included.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="gradient" size="lg">
            <Link href="/signup">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} PulseGuard AI · Built for security
          teams.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
