/**
 * Seed three demo users for PulseGuard AI:
 *   admin@pulseguard.ai     · admin
 *   engineer@pulseguard.ai  · engineer
 *   viewer@pulseguard.ai    · viewer
 *
 * Uses the Supabase service-role key — **never expose this to the browser**.
 * Run with:  npm run seed:users
 *
 * Requires env vars in `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent: re-running updates passwords + profiles, never duplicates rows.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader (avoids adding a dotenv dependency).
function loadDotEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, val] = m;
      if (!process.env[key]) {
        process.env[key] = val.replace(/^['"]|['"]$/g, "");
      }
    }
  } catch {
    // .env.local missing — fall through, fail-fast below.
  }
}

loadDotEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  console.error("  Add them to .env.local and re-run.");
  process.exit(1);
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo!2026";

const USERS = [
  {
    email: "admin@pulseguard.ai",
    role: "admin" as const,
    full_name: "Ada Admin",
    organization: "PulseGuard Demo",
  },
  {
    email: "engineer@pulseguard.ai",
    role: "engineer" as const,
    full_name: "Eli Engineer",
    organization: "PulseGuard Demo",
  },
  {
    email: "viewer@pulseguard.ai",
    role: "viewer" as const,
    full_name: "Vera Viewer",
    organization: "PulseGuard Demo",
  },
];

async function main() {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const u of USERS) {
    process.stdout.write(`• ${u.email.padEnd(28)} (${u.role}) … `);

    // Try to find existing user (list paginated up to 1000).
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) {
      console.log("✖", listErr.message);
      continue;
    }
    const existing = list.users.find(
      (x) => x.email?.toLowerCase() === u.email.toLowerCase(),
    );

    let userId: string;
    if (existing) {
      const { error } = await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          organization: u.organization,
          role: u.role,
        },
      });
      if (error) {
        console.log("✖ update:", error.message);
        continue;
      }
      userId = existing.id;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          organization: u.organization,
          role: u.role,
        },
      });
      if (error || !data.user) {
        console.log("✖ create:", error?.message);
        continue;
      }
      userId = data.user.id;
    }

    // Upsert profile (in case the trigger isn't applied).
    const { error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: u.email,
          full_name: u.full_name,
          organization: u.organization,
          role: u.role,
        },
        { onConflict: "id" },
      );

    if (profErr) {
      console.log("✖ profile:", profErr.message);
      continue;
    }
    console.log("✓");
  }

  console.log("\nDone. Demo password:", DEMO_PASSWORD);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
