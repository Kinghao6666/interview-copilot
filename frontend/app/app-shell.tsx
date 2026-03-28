'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 p-2 text-white/80 hover:text-white transition-colors lg:hidden"
        aria-label="打开菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="relative flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 scroll-fade">
          <div className="page-surface rounded-[28px] min-h-full px-5 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
