import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "PulseGuard AI — Self-Healing Infrastructure",
  description:
    "AI-powered self-healing infrastructure platform. Detect, diagnose, explain, and auto-recover from failures in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased scrollbar-thin">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
