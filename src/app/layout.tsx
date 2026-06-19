import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "PulseGuard AI — Self-Healing Cyber Infrastructure",
  description:
    "AI-powered cybersecurity & self-healing infrastructure. Detect, diagnose, explain, and auto-recover from threats in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased scrollbar-thin">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
