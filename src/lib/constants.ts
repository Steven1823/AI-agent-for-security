import type { IncidentType, Severity, IncidentStatus } from "@/types";
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldCheck,
  Activity,
  FileText,
  Settings,
  Radar,
  Zap,
  BookOpen,
  Bot,
  Briefcase,
  Brain,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Copilot", href: "/copilot", icon: Bot },
  { label: "Executive", href: "/executive", icon: Briefcase },
  { label: "Analyzer", href: "/analyzer", icon: Radar },
  { label: "Chaos Center", href: "/chaos", icon: Zap },
  { label: "Intelligence", href: "/intelligence", icon: BookOpen },
  { label: "Autonomous", href: "/autonomous", icon: Brain },
  { label: "Replay", href: "/replay", icon: PlayCircle },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle },
  { label: "Recovery", href: "/recovery", icon: Activity },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const SEVERITY_STYLE: Record<
  Severity,
  { label: string; badge: "warning" | "danger" | "critical" | "muted"; ring: string }
> = {
  low: { label: "Low", badge: "muted", ring: "stroke-emerald-400" },
  medium: { label: "Medium", badge: "warning", ring: "stroke-amber-400" },
  high: { label: "High", badge: "danger", ring: "stroke-orange-400" },
  critical: { label: "Critical", badge: "critical", ring: "stroke-red-400" },
};

export const STATUS_STYLE: Record<
  IncidentStatus,
  { label: string; tone: "primary" | "warning" | "danger" | "success" }
> = {
  detected: { label: "Detected", tone: "danger" },
  analyzing: { label: "Analyzing", tone: "warning" },
  recovering: { label: "Recovering", tone: "primary" },
  resolved: { label: "Resolved", tone: "success" },
};

export const INCIDENT_TYPE_META: Record<
  IncidentType,
  { label: string; emoji: string; gradient: string }
> = {
  api_failure: {
    label: "API Failure",
    emoji: "🔌",
    gradient: "from-rose-500 to-red-600",
  },
  database_failure: {
    label: "Database Failure",
    emoji: "🗄️",
    gradient: "from-amber-500 to-orange-600",
  },
  high_latency: {
    label: "High Latency",
    emoji: "🐢",
    gradient: "from-sky-500 to-blue-600",
  },
  security_attack: {
    label: "Security Attack",
    emoji: "🛡️",
    gradient: "from-fuchsia-500 to-violet-600",
  },
};
