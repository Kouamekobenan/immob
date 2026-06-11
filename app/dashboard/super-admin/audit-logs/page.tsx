'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ShieldAlert, Database, Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const actionColor: Record<string, string> = {
  USER_LOGIN:            'bg-blue-50 text-blue-700 border-blue-200',
  USER_LOGOUT:           'bg-slate-100 text-slate-600 border-slate-200',
  USER_UPDATE:           'bg-indigo-50 text-indigo-700 border-indigo-200',
  USER_SIMULATE_SWITCH:  'bg-purple-50 text-purple-700 border-purple-200',
  PROPERTY_CREATE:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROPERTY_UPDATE:       'bg-teal-50 text-teal-700 border-teal-200',
  PROPERTY_DELETE:       'bg-red-50 text-red-700 border-red-200',
  CONTRACT_CREATE:       'bg-cyan-50 text-cyan-700 border-cyan-200',
  CONTRACT_TERMINATE:    'bg-orange-50 text-orange-700 border-orange-200',
  PAYMENT_SUBMITTED:     'bg-amber-50 text-amber-700 border-amber-200',
  PAYMENT_VALIDATE:      'bg-green-50 text-green-700 border-green-200',
  TICKET_CREATE:         'bg-rose-50 text-rose-700 border-rose-200',
  TICKET_ASSIGN:         'bg-violet-50 text-violet-700 border-violet-200',
  TICKET_STATUS_UPDATE:  'bg-sky-50 text-sky-700 border-sky-200',
};

export default function AuditLogsPage() {
  const { auditLogs, users } = useAppStore();
  const [actionFilter, setActionFilter] = useState('ALL');
  const [tableFilter,  setTableFilter]  = useState('ALL');
  const [userFilter,   setUserFilter]   = useState('ALL');
  const [detail,       setDetail]       = useState<Record<string, unknown> | null>(null);

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));
  const uniqueTables  = Array.from(new Set(auditLogs.map(l => l.table)));

  const filtered = auditLogs.filter(l => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (tableFilter  !== 'ALL' && l.table  !== tableFilter)  return false;
    if (userFilter   !== 'ALL' && l.userId !== userFilter)   return false;
    return true;
  });

  const selectCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer';

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-slate-500" />
          Journal d&apos;audit
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Traçabilité complète des actions — {auditLogs.length} entrée{auditLogs.length > 1 ? 's' : ''} enregistrée{auditLogs.length > 1 ? 's' : ''}.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action</p>
              <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={selectCls}>
                <option value="ALL">Toutes les actions</option>
                {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Table</p>
              <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} className={selectCls}>
                <option value="ALL">Toutes les tables</option>
                {uniqueTables.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Opérateur</p>
              <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selectCls}>
                <option value="ALL">Tous les opérateurs</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                  <th className="px-5 py-3.5">Horodatage</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Table · ID</th>
                  <th className="px-5 py-3.5">Opérateur</th>
                  <th className="px-5 py-3.5">IP</th>
                  <th className="px-5 py-3.5 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Aucun log correspondant aux filtres.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log, i) => {
                    const actor = users.find(u => u.id === log.userId);
                    const badgeCls = actionColor[log.action] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.18 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap font-medium">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[9px] font-bold border font-mono ${badgeCls}`}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Database className="h-3 w-3 text-slate-300 shrink-0" />
                            <span className="text-xs font-semibold text-slate-600">{log.table}</span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-20">
                              · {log.enregistrementId}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {actor ? (
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{actor.prenom} {actor.nom}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{actor.role.replace('_', ' ')}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Système</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                          {log.ipAdresse || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetail(log.details)}
                            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* JSON Inspector Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Détails de l'entrée">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Données structurées de la transaction :</p>
          <pre className="bg-slate-900 text-emerald-300 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
            {JSON.stringify(detail, null, 2)}
          </pre>
          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={() => setDetail(null)}>Fermer</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
