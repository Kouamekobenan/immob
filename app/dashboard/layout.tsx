'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/context/app-store-context';
import { Sidebar } from '@/components/shared/sidebar';
import { NotificationBell } from '@/components/shared/notification-bell';
import { AnimatedMain } from '@/components/shared/animated-main';
import { Menu, ShieldAlert } from 'lucide-react';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthLoading, users, loginAsUser } = useAppStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only redirect once auth check is done
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            {isAuthLoading ? 'Chargement...' : 'Redirection vers la connexion...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSimulateRole = (userId: string) => {
    loginAsUser(userId);
    setSidebarOpen(false);
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    switch (targetUser.role) {
      case 'SUPER_ADMIN':  router.push('/dashboard/super-admin'); break;
      case 'BAILLEUR':     router.push('/dashboard/bailleur'); break;
      case 'GERANT':       router.push('/dashboard/gerant'); break;
      case 'LOCATAIRE':    router.push('/dashboard/locataire'); break;
      case 'PRESTATAIRE':  router.push('/dashboard/prestataire'); break;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 gap-3">
          {/* Left: hamburger (mobile) + branding (desktop) */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Plateforme Immobilière</span>
              <h2 className="text-sm font-bold text-slate-800 leading-none">Console Utilisateur</h2>
            </div>
            {/* Mobile: show logo text */}
            <div className="lg:hidden flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                Im
              </div>
              <span className="text-sm font-bold text-slate-800 truncate">Immob Platform</span>
            </div>
          </div>

          {/* Right: simulator + notifications + avatar */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Simulator — hidden on small mobile, compact on md+ */}
            <div className="hidden sm:flex items-center bg-blue-50/50 border border-blue-100 rounded-lg px-2 py-1.5 gap-1.5">
              <ShieldAlert className="h-3 w-3 text-blue-700 shrink-0" />
              <span className="text-[10px] font-bold text-blue-700 uppercase hidden md:inline">Simulateur :</span>
              <select
                value={currentUser.id}
                onChange={(e) => handleSimulateRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none focus:ring-0 cursor-pointer max-w-[120px] md:max-w-[180px]"
              >
                {users.filter(u => u.id && u.role).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications */}
            <NotificationBell />

            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-inner shrink-0">
                {currentUser.prenom?.[0] ?? '?'}{currentUser.nom?.[0] ?? ''}
              </div>
              <div className="hidden md:block text-left leading-none">
                <span className="text-xs font-bold text-slate-800 block">
                  {currentUser.prenom} {currentUser.nom}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatedMain>
            {children}
          </AnimatedMain>
        </main>
      </div>
    </div>
  );
}
