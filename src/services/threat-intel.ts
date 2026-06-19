import type { CyberInput, CyberInputKind, ThreatIntel } from "@/types";

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export function classifyInput(raw: string): CyberInput {
  const trimmed = raw.trim();

  // alert JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const target = String(
        parsed.target || parsed.host || parsed.domain || parsed.ip || parsed.source || "unknown-target",
      );
      return { raw: trimmed, kind: "alert_json", target };
    } catch {
      // fall through
    }
  }

  if (IPV4_RE.test(trimmed)) {
    return { raw: trimmed, kind: "ip", target: trimmed };
  }

  if (DOMAIN_RE.test(trimmed)) {
    return { raw: trimmed, kind: "domain", target: trimmed.toLowerCase() };
  }

  // multi-line or contains timestamps / brackets => log
  if (/\n/.test(trimmed) || /\[(info|warn|warning|error|critical)\]/i.test(trimmed)) {
    const ipMatch = trimmed.match(IPV4_RE);
    const domainMatch = trimmed.match(/(?:[a-z0-9-]+\.)+[a-z]{2,}/i);
    return {
      raw: trimmed,
      kind: "log",
      target: ipMatch?.[0] || domainMatch?.[0] || "log-bundle",
    };
  }

  return {
    raw: trimmed,
    kind: "natural_language",
    target: trimmed.split(/\s+/).slice(0, 4).join(" ") || "incident",
  };
}

export function inputKindLabel(kind: CyberInputKind): string {
  return {
    domain: "Domain",
    ip: "IP Address",
    log: "Log Bundle",
    alert_json: "Alert JSON",
    natural_language: "Natural Language",
  }[kind];
}

/**
 * Deterministic simulated threat intel feed. Always returns plausible data
 * keyed off the target so the demo is reproducible and offline-safe.
 */
export function simulatedThreatIntel(input: CyberInput): ThreatIntel {
  const seed = hash(input.target);
  const score = Math.min(95, 10 + (seed % 86));
  const allCategories = [
    "Phishing",
    "Command & Control",
    "Brute Force",
    "Credential Stuffing",
    "Malware Distribution",
    "Scanning",
    "DDoS Origin",
  ];
  const categories = pickStable(allCategories, 2 + (seed % 3), seed);
  const knownActor =
    score > 70
      ? ["APT-Coral", "BlueTangle", "RedLynx", "ShadowDrift"][seed % 4]
      : undefined;

  return {
    reputationScore: score,
    categories,
    knownActor,
    sources: ["abuse.ch", "OTX", "InternalHoneypot"],
    source: "feed",
  };
}

export function fallbackThreatIntel(input: CyberInput): ThreatIntel {
  return {
    reputationScore: 50,
    categories: ["Unknown"],
    sources: ["cache"],
    source: "fallback",
  };
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickStable<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    out.push(arr[(seed + i * 7) % arr.length]);
  }
  return Array.from(new Set(out));
}
