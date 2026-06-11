'use client';

import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Wrench, CheckCircle2, ArrowRight, MapPin, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UrgencyLevel, TicketStatus } from '@/types/prisma';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' as const } } },
};

const urgencyConfig: Record<UrgencyLevel, { label: string; cls: string }> = {
  CRITIQUE: { label: 'Critique',  cls: 'bg-red-50 text-red-700 border-red-200 animate-pulse' },
  MOYEN:    { label: 'Moyen',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAIBLE:   { label: 'Faible',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const statusConfig: Record<TicketStatus, { label: string; cls: string }> = {
  OUVERT:   { label: 'Ouvert',    cls: 'bg-red-50 text-red-600 border-red-200' },
  ASSIGNE:  { label: 'Assigné',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  EN_COURS: { label: 'En cours',  cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  RESOLU:   { label: 'Résolu',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOTURE:  { label: 'Clôturé',   cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function PrestataireDashboard() {
  const { currentUser, tickets, properties } = useAppStore();
  if (!currentUser) return null;

  const urgencyWeight = (l: UrgencyLevel) => ({ CRITIQUE: 3, MOYEN: 2, FAIBLE: 1 }[l] ?? 0);

  const interventions = tickets
    .filter(t => t.prestataireId === currentUser.id)
    .sort((a, b) => {
      const aResolved = a.statut === 'RESOLU' || a.statut === 'CLOTURE' ? 1 : 0;
      const bResolved = b.statut === 'RESOLU' || b.statut === 'CLOTURE' ? 1 : 0;
      if (aResolved !== bResolved) return aResolved - bResolved;
      return urgencyWeight(b.urgence) - urgencyWeight(a.urgence);
    });

  const active   = interventions.filter(t => t.statut !== 'RESOLU' && t.statut !== 'CLOTURE');
  const resolved = interventions.filter(t => t.statut === 'RESOLU' || t.statut === 'CLOTURE');

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mes interventions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ordres de dépannage qui vous sont assignés, triés par urgence.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger.item} className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'En cours', value: active.length,       icon: Wrench,       cls: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
          { label: 'Résolus',  value: resolved.length,     icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total',    value: interventions.length, icon: AlertTriangle, cls: 'bg-slate-50 text-slate-500', border: 'border-slate-200' },
        ].map(({ label, value, icon: Icon, cls, border }) => (
          <Card key={label} className={`p-4 flex items-center gap-3 border ${border}`}>
            <div className={`p-2 rounded-lg shrink-0 ${cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">{value}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Interventions list */}
      {interventions.length === 0 ? (
        <motion.div variants={stagger.item}>
          <Card className="p-12 text-center flex flex-col items-center gap-3 text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="font-semibold text-sm">Aucun ordre d&apos;intervention assigné</p>
            <p className="text-xs">Le gérant vous notifiera dès qu&apos;une panne vous sera attribuée.</p>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-3">
          {interventions.map((ticket) => {
            const prop    = properties.find(p => p.id === ticket.propertyId);
            const ugCfg   = urgencyConfig[ticket.urgence] ?? urgencyConfig.FAIBLE;
            const stCfg   = statusConfig[ticket.statut]   ?? statusConfig.OUVERT;
            const isDone  = ticket.statut === 'RESOLU' || ticket.statut === 'CLOTURE';

            return (
              <motion.div key={ticket.id} variants={stagger.item}>
                <Card className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 hover:shadow-md transition-all duration-200 ${isDone ? 'opacity-60' : ''}`}>
                  {/* Urgency indicator strip */}
                  <div className={`w-1 self-stretch rounded-full shrink-0 hidden sm:block ${
                    ticket.urgence === 'CRITIQUE' ? 'bg-red-400' :
                    ticket.urgence === 'MOYEN'    ? 'bg-amber-400' : 'bg-blue-300'
                  }`} />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{ticket.titre}</h3>
                      <Badge className={`text-[9px] font-bold border shrink-0 ${ugCfg.cls}`}>{ugCfg.label}</Badge>
                      <Badge className={`text-[9px] font-bold border shrink-0 ${stCfg.cls}`}>{stCfg.label}</Badge>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ticket.description}</p>

                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 font-medium">
                      {prop && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {prop.adresse}, {prop.ville}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/dashboard/prestataire/tickets/${ticket.id}`} className="shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant={isDone ? 'outline' : 'default'}
                      className="w-full gap-1.5 font-semibold"
                    >
                      {isDone ? 'Voir le rapport' : 'Intervenir'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
