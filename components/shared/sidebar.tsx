'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/context/app-store-context';
import {
  LayoutDashboard, Users, ShieldAlert, Building2,
  FileText, CreditCard, Wrench, LogOut, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, logout } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const getLinks = (): SidebarLink[] => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return [
          { label: "Vue d'ensemble", href: '/dashboard/super-admin', icon: LayoutDashboard },
          { label: 'Utilisateurs', href: '/dashboard/super-admin/users', icon: Users },
          { label: "Logs d'audit", href: '/dashboard/super-admin/audit-logs', icon: ShieldAlert },
        ];
      case 'BAILLEUR':
        return [
          { label: 'Hub Financier', href: '/dashboard/bailleur', icon: LayoutDashboard },
          { label: 'Mes Propriétés', href: '/dashboard/bailleur/properties', icon: Building2 },
        ];
      case 'GERANT':
        return [
          { label: 'Centre Opérations', href: '/dashboard/gerant', icon: LayoutDashboard },
          { label: 'Gestion Biens', href: '/dashboard/gerant/properties', icon: Building2 },
          { label: 'Contrats Locatifs', href: '/dashboard/gerant/contracts', icon: FileText },
          { label: 'Suivi Paiements', href: '/dashboard/gerant/payments', icon: CreditCard },
          { label: 'Maintenance', href: '/dashboard/gerant/tickets', icon: Wrench },
        ];
      case 'LOCATAIRE':
        return [
          { label: 'Mon Espace', href: '/dashboard/locataire', icon: LayoutDashboard },
          { label: 'Mon Contrat', href: '/dashboard/locataire/contract', icon: FileText },
          { label: 'Payer Loyer', href: '/dashboard/locataire/payments/pay', icon: CreditCard },
          { label: 'Tickets Panne', href: '/dashboard/locataire/tickets', icon: Wrench },
        ];
      case 'PRESTATAIRE':
        return [
          { label: 'Interventions', href: '/dashboard/prestataire', icon: LayoutDashboard },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside
      className={cn(
        /* Mobile: fixed overlay drawer */
        'fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform duration-300 ease-in-out',
        /* Desktop: static in flow, always visible */
        'lg:relative lg:translate-x-0 lg:z-auto',
        /* Mobile open/close */
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Platform Branding */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
            Im
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 tracking-tight leading-none text-base truncate">Immob Platform</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Gestion Immobilière</span>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Connected User Badge */}
      <div className="p-4 mx-3 my-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
            {currentUser.prenom[0]}{currentUser.nom[0]}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-slate-800 truncate">{currentUser.prenom} {currentUser.nom}</h4>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{currentUser.email}</p>
          </div>
        </div>
        <div className="mt-1">
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100/50 uppercase">
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-l-[3px] border-blue-600 rounded-l-none pl-2.5'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
              )} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100 shrink-0">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </div>
    </aside>
  );
}
