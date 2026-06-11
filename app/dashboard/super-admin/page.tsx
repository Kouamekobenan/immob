'use client';

import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Users, ShieldAlert, Activity,
  ArrowRight, TrendingUp, Database
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' as const } } },
};

const roleStyle: Record<string, { label: string; cls: string; dot: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500' },
  BAILLEUR:    { label: 'Bailleur',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  GERANT:      { label: 'Gérant',      cls: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  LOCATAIRE:   { label: 'Locataire',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PRESTATAIRE: { label: 'Prestataire', cls: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-500' },
};

export default function SuperAdminDashboard() {
  const { users, payments, auditLogs } = useAppStore();

  const totalUsers  = users.length;
  const globalRev   = payments.filter(p => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);
  const totalLogs   = auditLogs.length;
  const recentLogs  = auditLogs.slice(0, 6);

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis = [
    { label: 'Utilisateurs', value: totalUsers,           icon: Users,      color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100' },
    { label: 'Volume encaissé', value: formatCurrency(globalRev), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: "Logs d'audit",  value: totalLogs,            icon: Database,   color: 'bg-slate-50 text-slate-500',  border: 'border-slate-200' },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Console Super Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Supervision globale — comptes, finances et traçabilité des actions.</p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {kpis.map(({ label, value, icon: Icon, color, border }) => (
          <Card key={label} className={`p-5 flex items-start gap-4 border ${border} hover:shadow-md transition-shadow`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5 leading-none">{value}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Audit logs */}
        <motion.div variants={stagger.item} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              Activités système récentes
            </h2>
            <Link href="/dashboard/super-admin/audit-logs" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Tous les logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {recentLogs.map((log) => {
                const actor = users.find(u => u.id === log.userId);
                return (
                  <li key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="pt-0.5 shrink-0">
                      <ShieldAlert className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                          {log.action}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          table <strong className="text-slate-700 font-semibold">{log.table}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                        {log.enregistrementId}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold text-slate-700 truncate max-w-28">
                        {actor ? `${actor.prenom} ${actor.nom}` : 'Système'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </motion.div>

        {/* Role distribution */}
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              Répartition des rôles
            </h2>
            <Link href="/dashboard/super-admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Gérer <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="p-5 space-y-4">
            {Object.entries(roleStyle).map(([role, cfg]) => {
              const count = roleCounts[role] ?? 0;
              const pct   = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
              return (
                <div key={role} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-slate-500">{count} · {Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${cfg.dot} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' as const, delay: 0.3 }}
                    />
                  </div>
                </div>
              );
            })}

            <Separator />

            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>Total comptes</span>
              <span className="font-bold text-slate-800">{totalUsers}</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
