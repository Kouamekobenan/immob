'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { auditLogService, type AuditLogFilters } from '@/lib/services/audit-log.service';
import type { AuditLog } from '@/types/prisma';
import { ShieldAlert, Database, Eye, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const actionColor: Record<string, string> = {
  USER_LOGIN:            'bg-blue-50 text-blue-700 border-blue-200',
  USER_LOGOUT:           'bg-slate-100 text-slate-600 border-slate-200',
  USER_UPDATE:           'bg-indigo-50 text-indigo-700 border-indigo-200',
  USER_CREATE:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  USER_DELETE:           'bg-red-50 text-red-700 border-red-200',
  USER_ROLE_CHANGE:      'bg-purple-50 text-purple-700 border-purple-200',
  USER_REGISTER:         'bg-teal-50 text-teal-700 border-teal-200',
  USER_SIMULATE_SWITCH:  'bg-violet-50 text-violet-700 border-violet-200',
  PROPERTY_CREATE:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROPERTY_UPDATE:       'bg-teal-50 text-teal-700 border-teal-200',
  PROPERTY_DELETE:       'bg-red-50 text-red-700 border-red-200',
  CONTRACT_CREATE:       'bg-cyan-50 text-cyan-700 border-cyan-200',
  CONTRACT_TERMINATE:    'bg-orange-50 text-orange-700 border-orange-200',
  PAYMENT_SUBMITTED:     'bg-amber-50 text-amber-700 border-amber-200',
  PAYMENT_CONFIRM:       'bg-green-50 text-green-700 border-green-200',
  PAYMENT_REJECT:        'bg-red-50 text-red-700 border-red-200',
  TICKET_CREATE:         'bg-rose-50 text-rose-700 border-rose-200',
  TICKET_ASSIGN:         'bg-violet-50 text-violet-700 border-violet-200',
  TICKET_STATUS_UPDATE:  'bg-sky-50 text-sky-700 border-sky-200',
  EXPENSE_CREATE:        'bg-amber-50 text-amber-700 border-amber-200',
  EXPENSE_PAY:           'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const { users } = useAppStore();

  const [logs,       setLogs]       = useState<AuditLog[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [detail,     setDetail]     = useState<Record<string, unknown> | null>(null);

  const [actionFilter, setActionFilter] = useState('');
  const [userFilter,   setUserFilter]   = useState('');
  const [dateDebut,    setDateDebut]    = useState('');
  const [dateFin,      setDateFin]      = useState('');

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const filters: AuditLogFilters = { page: p, limit: PAGE_SIZE };
      if (actionFilter) filters.action    = actionFilter;
      if (userFilter)   filters.userId    = userFilter;
      if (dateDebut)    filters.dateDebut = dateDebut;
      if (dateFin)      filters.dateFin   = dateFin;

      const result = await auditLogService.getAll(filters);
      setLogs(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, userFilter, dateDebut, dateFin]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, userFilter, dateDebut, dateFin]);

  useEffect(() => {
    fetchLogs(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const selectCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer';
  const inputCls  = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700';

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-slate-500" />
              Journal d&apos;audit
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {loading ? 'Chargement...' : `${total} entrée${total > 1 ? 's' : ''} enregistrée${total > 1 ? 's' : ''}.`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fetchLogs(page)}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Action</p>
              <input
                type="text"
                placeholder="Ex: USER_LOGIN"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Opérateur</p>
              <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selectCls}>
                <option value="">Tous les opérateurs</option>
                {users.filter(u => u.id && u.role).map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Depuis</p>
              <input
                type="date"
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Jusqu&apos;au</p>
              <input
                type="date"
                value={dateFin}
                onChange={e => setDateFin(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <p className="text-xs font-medium">Chargement des logs…</p>
            </div>
          ) : (
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
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        Aucun log correspondant aux filtres.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, i) => {
                      const actor    = users.find(u => u.id === log.userId);
                      const badgeCls = actionColor[log.action] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02, duration: 0.15 }}
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
                              <span className="text-xs text-slate-400 italic">
                                {log.userId ? log.userId.slice(0, 8) + '…' : 'Système'}
                              </span>
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
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[11px] text-slate-500 font-medium">
                Page <strong className="text-slate-700">{page}</strong> sur <strong className="text-slate-700">{totalPages}</strong>
                {' '}· {total} entrée{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
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
