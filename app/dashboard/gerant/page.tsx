'use client';

import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Wrench, CreditCard, Building2, AlertTriangle,
  CheckCircle, ArrowRight, TrendingUp, Clock
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } },
};

export default function GerantDashboard() {
  const { currentUser, properties, tickets, payments, users, contracts } = useAppStore();
  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const myContracts = contracts.filter(c => myPropertyIds.includes(c.propertyId) && c.estActif);
  const myContractIds = myContracts.map(c => c.id);
  const myTickets = tickets.filter(t => myPropertyIds.includes(t.propertyId));
  const myPayments = payments.filter(p => myContractIds.includes(p.contractId));

  const pendingPayments = myPayments.filter(p => p.statut === 'EN_ATTENTE');
  const openTickets = myTickets.filter(t => t.statut === 'OUVERT' || t.urgence === 'CRITIQUE');
  const totalOccupied = myProperties.filter(p => p.estOccupe).length;
  const totalRevenueMois = myContracts.reduce((s, c) => s + c.loyerTotal, 0);

  const kpis = [
    {
      label: 'Biens gérés',
      value: myProperties.length,
      sub: `${totalOccupied} occupés · ${myProperties.length - totalOccupied} vacants`,
      icon: Building2,
      accent: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Loyers du mois',
      value: formatCurrency(totalRevenueMois),
      sub: `${myContracts.length} contrats actifs`,
      icon: TrendingUp,
      accent: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      label: 'Impayés en attente',
      value: pendingPayments.length,
      sub: pendingPayments.length > 0 ? 'Nécessite validation' : 'Tout est à jour',
      icon: CreditCard,
      accent: pendingPayments.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600',
      border: pendingPayments.length > 0 ? 'border-red-100' : 'border-emerald-100',
      urgent: pendingPayments.length > 0,
    },
    {
      label: 'Alertes maintenance',
      value: openTickets.length,
      sub: openTickets.length > 0 ? 'Tickets ouverts/critiques' : 'Aucune urgence',
      icon: Wrench,
      accent: openTickets.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600',
      border: openTickets.length > 0 ? 'border-amber-100' : 'border-emerald-100',
      urgent: openTickets.length > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Centre d&apos;Opérations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vue d&apos;ensemble de votre parc — loyers, maintenance et contrats en un coup d&apos;œil.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={stagger.item}>
              <Card className={`p-5 flex items-start gap-4 border ${kpi.border} hover:shadow-md transition-shadow duration-200`}>
                <div className={`p-2.5 rounded-xl shrink-0 ${kpi.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">{kpi.label}</p>
                  <p className={`text-2xl font-extrabold mt-0.5 leading-none ${kpi.urgent ? 'text-red-600' : 'text-slate-800'}`}>
                    {kpi.value}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{kpi.sub}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content grid */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Impayés */}
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Loyers en attente
            </h2>
            <Link href="/dashboard/gerant/payments" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="overflow-hidden">
            {pendingPayments.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
                <p className="text-xs font-medium">Tous les loyers sont à jour</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingPayments.map((pay) => {
                  const tenant = users.find(u => u.id === pay.locataireId);
                  const prop = properties.find(p => p.id === contracts.find(c => c.id === pay.contractId)?.propertyId);
                  return (
                    <li key={pay.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {tenant ? `${tenant.prenom} ${tenant.nom}` : '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{prop?.titre}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 font-semibold">
                          <Clock className="h-3 w-3 mr-1" />{pay.periode}
                        </Badge>
                        <span className="text-sm font-extrabold text-red-600">{formatCurrency(pay.montant)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>

        {/* Tickets critiques */}
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-500" />
              Incidents &amp; maintenance
            </h2>
            <Link href="/dashboard/gerant/tickets" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Assigner <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="overflow-hidden">
            {openTickets.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
                <p className="text-xs font-medium">Aucune urgence en cours</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {openTickets.slice(0, 5).map((ticket) => {
                  const prop = properties.find(p => p.id === ticket.propertyId);
                  return (
                    <li key={ticket.id} className="flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{ticket.titre}</p>
                        <p className="text-[11px] text-slate-400 truncate">{prop?.titre}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          className={`text-[9px] font-bold uppercase border ${
                            ticket.urgence === 'CRITIQUE'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : ticket.urgence === 'MOYEN'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {ticket.urgence}
                        </Badge>
                        <Badge
                          className={`text-[9px] font-bold uppercase border ${
                            ticket.statut === 'OUVERT'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {ticket.statut}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>

        {/* Biens récents */}
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Parc immobilier
            </h2>
            <Link href="/dashboard/gerant/properties" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Gérer <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {myProperties.map((prop) => (
                <li key={prop.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{prop.titre}</p>
                    <p className="text-[11px] text-slate-400">{prop.adresse}, {prop.ville}</p>
                  </div>
                  <Badge
                    className={`text-[9px] font-bold shrink-0 border ${
                      prop.estOccupe
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {prop.estOccupe ? 'Occupé' : 'Vacant'}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Contrats actifs */}
        <motion.div variants={stagger.item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-500" />
              Contrats actifs
            </h2>
            <Link href="/dashboard/gerant/contracts" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="overflow-hidden">
            {myContracts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">Aucun contrat actif</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myContracts.map((c) => {
                  const prop = properties.find(p => p.id === c.propertyId);
                  const tenant = users.find(u => u.id === c.locataireId);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{prop?.titre}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tenant ? `${tenant.prenom} ${tenant.nom}` : '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-slate-700">{formatCurrency(c.loyerTotal)}</p>
                        <p className="text-[10px] text-slate-400">Fin : {c.dateFin ? formatDate(c.dateFin) : '—'}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
