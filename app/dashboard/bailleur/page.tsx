'use client';

import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Building2, TrendingUp, Percent, AlertCircle,
  MapPin, ArrowRight, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } } },
};

export default function BailleurDashboard() {
  const { currentUser, properties, contracts, payments } = useAppStore();
  if (!currentUser) return null;

  const myProps = properties.filter(p => p.bailleurId === currentUser.id);
  const occupied = myProps.filter(p => p.estOccupe).length;
  const occupancyPct = myProps.length > 0 ? Math.round((occupied / myProps.length) * 100) : 0;

  const myContracts = contracts.filter(c => myProps.some(p => p.id === c.propertyId) && c.estActif);
  const myPayments = payments.filter(pay =>
    contracts.some(c => c.id === pay.contractId && myProps.some(p => p.id === c.propertyId))
  );

  const perceivedRev = myPayments.filter(p => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);
  const pendingRev   = myPayments.filter(p => p.statut === 'EN_ATTENTE').reduce((s, p) => s + p.montant, 0);
  const totalRev     = perceivedRev + pendingRev;

  // Chart data — last 4 periods
  const periodMap: Record<string, { paid: number; pending: number }> = {};
  myPayments.forEach(p => {
    if (!periodMap[p.periode]) periodMap[p.periode] = { paid: 0, pending: 0 };
    if (p.statut === 'PAYE') periodMap[p.periode].paid += p.montant;
    else if (p.statut === 'EN_ATTENTE') periodMap[p.periode].pending += p.montant;
  });
  const chartData = Object.entries(periodMap)
    .map(([period, d]) => ({ period, paid: d.paid, pending: d.pending, total: d.paid + d.pending }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-5);
  const maxVal = Math.max(...chartData.map(d => d.total), 1);

  // Donut ring
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDash = (occupancyPct / 100) * circumference;

  const kpis = [
    { label: 'Patrimoine', value: myProps.length, sub: `${occupied} loués · ${myProps.length - occupied} vacants`, icon: Building2, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { label: 'Revenus encaissés', value: formatCurrency(perceivedRev), sub: 'Loyers validés', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'En attente', value: formatCurrency(pendingRev), sub: 'À encaisser', icon: AlertCircle, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Taux d\'occupation', value: `${occupancyPct}%`, sub: `${occupied}/${myProps.length} biens loués`, icon: Percent, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
  ];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hub Financier</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi macro des revenus, rentabilité et occupation de votre patrimoine immobilier.</p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map(({ label, value, sub, icon: Icon, color, border }) => (
          <Card key={label} className={`p-5 flex items-start gap-4 border ${border} hover:shadow-md transition-shadow duration-200`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-extrabold text-slate-800 mt-0.5 leading-none truncate">{value}</p>
              <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-slate-800">Flux financiers par période</p>
                <p className="text-xs text-slate-400 mt-0.5">Loyers encaissés vs. en attente (€)</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" /> Encaissés</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" /> En attente</span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="relative h-44 flex items-end justify-around gap-3 pt-6">
                {/* Y-axis reference lines */}
                {[0, 0.5, 1].map(r => (
                  <div
                    key={r}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ bottom: `${r * 100}%` }}
                  >
                    <span className="absolute -top-3 -left-1 text-[9px] text-slate-300 font-bold">
                      {formatCurrency(r * maxVal)}
                    </span>
                  </div>
                ))}

                {chartData.map(({ period, paid, pending, total }) => {
                  const paidH  = total > 0 ? (paid / maxVal) * 100 : 0;
                  const pendH  = total > 0 ? (pending / maxVal) * 100 : 0;

                  return (
                    <div key={period} className="flex flex-col items-center gap-0 flex-1 relative group">
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatCurrency(total)}
                      </div>

                      <div className="flex flex-col justify-end w-8 h-36 gap-0">
                        {pendH > 0 && (
                          <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' as const, delay: 0.2 }}
                            style={{ height: `${pendH}%`, transformOrigin: 'bottom' }}
                            className="w-full bg-amber-400 rounded-t-md"
                          />
                        )}
                        {paidH > 0 && (
                          <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' as const, delay: 0.1 }}
                            style={{ height: `${paidH}%`, transformOrigin: 'bottom' }}
                            className={`w-full bg-emerald-500 ${pendH > 0 ? '' : 'rounded-t-md'}`}
                          />
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 mt-2">{period}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <Separator className="mt-6 mb-4" />
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Total encaissé : <strong className="text-emerald-600">{formatCurrency(perceivedRev)}</strong></span>
              <span>Total en attente : <strong className="text-amber-600">{formatCurrency(pendingRev)}</strong></span>
            </div>
          </Card>
        </motion.div>

        {/* Donut occupancy */}
        <motion.div variants={stagger.item}>
          <Card className="p-6 flex flex-col items-center gap-5 h-full justify-center">
            <p className="text-sm font-bold text-slate-800 self-start">Taux d&apos;occupation</p>

            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <motion.circle
                  cx="18" cy="18" r="15.9155" fill="none"
                  stroke={occupancyPct > 66 ? '#2563eb' : occupancyPct > 33 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${strokeDash} ${circumference - strokeDash}` }}
                  transition={{ duration: 0.9, ease: 'easeOut' as const, delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 leading-none">{occupancyPct}%</span>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Occupés</span>
              </div>
            </div>

            <ul className="w-full space-y-2 text-xs font-semibold">
              <li className="flex justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                  Biens loués
                </span>
                <span className="text-slate-800 font-bold">{occupied}</span>
              </li>
              <li className="flex justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200 inline-block" />
                  Vacants
                </span>
                <span className="text-slate-800 font-bold">{myProps.length - occupied}</span>
              </li>
              <Separator className="my-2" />
              <li className="flex justify-between">
                <span className="text-slate-400">Revenu potentiel/mois</span>
                <span className="text-slate-700 font-bold">{formatCurrency(myContracts.reduce((s, c) => s + c.loyerTotal, 0))}</span>
              </li>
            </ul>

            <Link href="/dashboard/bailleur/properties" className="w-full">
              <div className="text-center text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors cursor-pointer">
                Gérer le patrimoine <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* Patrimoine list */}
      <motion.div variants={stagger.item} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Mes biens immobiliers
          </h2>
          <Link href="/dashboard/bailleur/properties" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {myProps.map(prop => {
              const contract = myContracts.find(c => c.propertyId === prop.id);
              return (
                <li key={prop.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${prop.estOccupe ? 'bg-blue-50' : 'bg-slate-100'}`}>
                    <Building2 className={`h-4.5 w-4.5 ${prop.estOccupe ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{prop.titre}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />{prop.adresse}, {prop.ville}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-700">{formatCurrency(prop.loyerDeBase + prop.charges)}</p>
                      <p className="text-[10px] text-slate-400">/ mois</p>
                    </div>
                    <Badge className={`text-[9px] font-bold border ${prop.estOccupe ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {prop.estOccupe ? <><CheckCircle2 className="h-3 w-3 mr-1 inline" />Occupé</> : 'Vacant'}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </motion.div>
    </motion.div>
  );
}
