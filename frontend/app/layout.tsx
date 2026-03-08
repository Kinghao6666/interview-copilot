import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "./sidebar";

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
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="ambient-scanline" />
        <div className="ambient-orb orb-gold" />
        <div className="ambient-orb orb-blue" />
        <div className="ambient-orb orb-purple" />

        <div className="app-shell">
          <Sidebar />
          <main className="relative flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 scroll-fade">
            <div className="page-surface rounded-[28px] min-h-full px-5 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
