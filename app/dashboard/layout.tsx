'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/context/app-store-context';
import { Sidebar } from '@/components/shared/sidebar';
import { NotificationBell } from '@/components/shared/notification-bell';
import { AnimatedMain } from '@/components/shared/animated-main';
import { Users, Info, ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, users, loginAsUser } = useAppStore();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  // Handle fast switch for simulation purposes
  const handleSimulateRole = (userId: string) => {
    loginAsUser(userId);
    
    // Redirect to the appropriate dashboard
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    switch (targetUser.role) {
      case 'SUPER_ADMIN':
        router.push('/dashboard/super-admin');
        break;
      case 'BAILLEUR':
        router.push('/dashboard/bailleur');
        break;
      case 'GERANT':
        router.push('/dashboard/gerant');
        break;
      case 'LOCATAIRE':
        router.push('/dashboard/locataire');
        break;
      case 'PRESTATAIRE':
        router.push('/dashboard/prestataire');
        break;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Plateforme Immobilière</span>
            <h2 className="text-sm font-bold text-slate-800 leading-none">Console Utilisateur</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* SIMULATOR QUICK SWITCHER - EXTREMELY HELPFUL FOR FLOW SHOWCASE */}
            <div className="flex items-center bg-blue-50/50 border border-blue-100 rounded-lg px-2.5 py-1.5 gap-2 max-w-sm">
              <span className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Simulateur :
              </span>
              <select
                value={currentUser.id}
                onChange={(e) => handleSimulateRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none pr-6 py-0 focus:ring-0 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Separator */}
            <div className="h-6 w-px bg-slate-200" />

            {/* User Avatar & Name */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-inner">
                {currentUser.prenom[0]}{currentUser.nom[0]}
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

        {/* Dashboard Pages Scrollable Container */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Simulation Helper Note */}
          <div className="mb-6 p-3 bg-amber-50 border border-amber-100/50 rounded-xl flex items-start gap-2.5 shadow-sm text-slate-700 animate-in fade-in duration-300">
            <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-amber-800">Mode Démonstration Interactif Actif</p>
              <p className="text-amber-700 mt-0.5">
                Vous naviguez actuellement en tant que <strong>{currentUser.prenom} {currentUser.nom}</strong> ({currentUser.role}). 
                Utilisez le sélecteur &quot;Simulateur&quot; dans l&apos;en-tête pour changer instantanément d&apos;identité et observer comment les actions (validation de paiement, ticket de panne, signature de contrat) se répercutent en temps réel sur les autres comptes.
              </p>
            </div>
          </div>

          <AnimatedMain>
            {children}
          </AnimatedMain>
        </main>
      </div>
    </div>
  );
}
