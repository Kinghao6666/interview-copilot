import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components";
import { AppShell } from "./app-shell";

export const metadata: Metadata = {
  title: "Interview Copilot - AI 校招面试助手",
  description: "通过 AI 模拟面试提升面试表现",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastProvider>
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="ambient-orb orb-gold" />
        <div className="ambient-orb orb-blue" />
        <div className="ambient-orb orb-purple" />

        <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
