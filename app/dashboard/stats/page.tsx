'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatFCFA } from '@/lib/utils';
import { statsService } from '@/lib/services/stats.service';
import type { DashboardKPIs, RevenuPoint, AlertesResponse } from '@/types/stats';
import {
  TrendingUp, TrendingDown, Building2, Users, FileText,
  RefreshCw, CheckCircle2, Zap, CreditCard, Wallet,
  BarChart3, AlertCircle, Wrench, Clock,
} from 'lucide-react';
import Link from 'next/link';

/* ── helpers ─────────────────────────────────────────────────────────── */

function fmtK(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

function fmtPeriode(p: string): string {
  const [mm, yyyy] = p.split('-');
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${months[parseInt(mm, 10) - 1] ?? mm} ${yyyy?.slice(2) ?? ''}`;
}

function fmtMonthFull(p: string): string {
  const [mm, yyyy] = p.split('-');
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${months[parseInt(mm, 10) - 1] ?? mm} ${yyyy ?? ''}`;
}

/* ── animation config ────────────────────────────────────────────────── */

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  },
};

/* ── shared sub-components ───────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className ?? ''}`} />;
}

function SectionError({ message }: { message: string }) {
  return (
    <Card className="p-6 text-center border-red-100">
      <AlertCircle className="h-5 w-5 mx-auto mb-2 text-red-400" />
      <p className="text-sm text-red-400">{message}</p>
    </Card>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, color, border,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; border: string;
}) {
  return (
    <Card className={`p-5 flex items-start gap-4 border ${border} hover:shadow-md transition-shadow duration-200`}>
      <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-base font-extrabold text-slate-800 mt-0.5 leading-none truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
    </Card>
  );
}

function Gauge({ pct }: { pct: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx={32} cy={32} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
        <motion.circle
          cx={32} cy={32} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black text-slate-800">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/* ── Revenue chart (custom SVG) ──────────────────────────────────────── */

function RevenueChart({ data }: { data: RevenuPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-300 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  const W = 560;
  const H = 176;
  const pad = { t: 10, r: 14, b: 36, l: 52 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const allVals = data.flatMap(d => [d.loyersEncaisses, d.depenses, d.solde]);
  const rawMax = Math.max(...allVals, 1);
  const rawMin = Math.min(...allVals, 0);
  const range = rawMax - rawMin || 1;

  const xOf = (i: number) =>
    pad.l + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW);
  const yOf = (v: number) =>
    pad.t + iH - ((v - rawMin) / range) * iH;

  const pts = (acc: (d: RevenuPoint) => number) =>
    data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(acc(d)).toFixed(1)}`).join(' ');

  const yTicks = [0, 0.5, 1].map(r => rawMin + r * range);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Horizontal grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={pad.l} x2={W - pad.r}
            y1={yOf(v)} y2={yOf(v)}
            stroke="#f1f5f9" strokeWidth={1}
          />
          <text
            x={pad.l - 4} y={yOf(v) + 3.5}
            textAnchor="end" fontSize={8} fill="#94a3b8"
          >
            {fmtK(v)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (data.length > 8 && i % 2 !== 0) return null;
        return (
          <text key={d.periode} x={xOf(i)} y={H - 4}
            textAnchor="middle" fontSize={8} fill="#94a3b8">
            {fmtPeriode(d.periode)}
          </text>
        );
      })}

      {/* Loyers encaissés — blue */}
      <polyline
        points={pts(d => d.loyersEncaisses)}
        fill="none" stroke="#3b82f6" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Dépenses — orange */}
      <polyline
        points={pts(d => d.depenses)}
        fill="none" stroke="#f97316" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Solde — green dashed */}
      <polyline
        points={pts(d => d.solde)}
        fill="none" stroke="#10b981" strokeWidth={2}
        strokeDasharray="5 3"
        strokeLinejoin="round" strokeLinecap="round"
      />

      {/* Dots */}
      {data.map((d, i) => (
        <g key={d.periode}>
          <circle cx={xOf(i)} cy={yOf(d.loyersEncaisses)} r={2.5} fill="#3b82f6" />
          <circle cx={xOf(i)} cy={yOf(d.depenses)} r={2.5} fill="#f97316" />
          <circle cx={xOf(i)} cy={yOf(d.solde)} r={2.5} fill="#10b981" />
        </g>
      ))}
    </svg>
  );
}

/* ── Alert list helpers ──────────────────────────────────────────────── */

function EmptyAlert({ message }: { message: string }) {
  return (
    <p className="text-xs text-slate-400 flex items-center gap-1.5 py-1.5">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      {message}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  Main page                                                            */
/* ══════════════════════════════════════════════════════════════════════ */

export default function StatsDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenus, setRevenus] = useState<RevenuPoint[]>([]);
  const [alertes, setAlertes] = useState<AlertesResponse | null>(null);
  const [mois, setMois] = useState(12);

  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingRevenus, setLoadingRevenus] = useState(true);
  const [loadingAlertes, setLoadingAlertes] = useState(true);
  const [errorKpis, setErrorKpis] = useState(false);
  const [errorRevenus, setErrorRevenus] = useState(false);
  const [errorAlertes, setErrorAlertes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKpis = useCallback(async () => {
    setLoadingKpis(true);
    setErrorKpis(false);
    try {
      const res = await statsService.getDashboard();
      setKpis(res.data);
    } catch {
      setErrorKpis(true);
    } finally {
      setLoadingKpis(false);
    }
  }, []);

  const fetchRevenus = useCallback(async (m: number) => {
    setLoadingRevenus(true);
    setErrorRevenus(false);
    try {
      const res = await statsService.getRevenus(m);
      setRevenus(res.data);
    } catch {
      setErrorRevenus(true);
    } finally {
      setLoadingRevenus(false);
    }
  }, []);

  const fetchAlertes = useCallback(async () => {
    setLoadingAlertes(true);
    setErrorAlertes(false);
    try {
      const res = await statsService.getAlertes();
      setAlertes(res.data);
    } catch {
      setErrorAlertes(true);
    } finally {
      setLoadingAlertes(false);
    }
  }, []);

  // Initial load — all 3 in parallel
  useEffect(() => {
    void fetchKpis();
    void fetchRevenus(mois);
    void fetchAlertes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload chart when period selector changes
  useEffect(() => {
    void fetchRevenus(mois);
  }, [mois, fetchRevenus]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(() => {
      void fetchKpis();
      void fetchRevenus(mois);
      void fetchAlertes();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchKpis(), fetchRevenus(mois), fetchAlertes()]);
    setIsRefreshing(false);
  }, [fetchKpis, fetchRevenus, fetchAlertes, mois]);

  const periodeLabel = kpis?.periode ? fmtMonthFull(kpis.periode) : '...';

  const totalAlertes = alertes
    ? alertes.totaux.loyersEnRetard + alertes.totaux.contratsExpirants + alertes.totaux.ticketsUrgents
    : 0;

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-7"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue analytique globale — <strong>{periodeLabel}</strong>
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </motion.div>

      {/* ── KPIs financiers ────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Finances du mois
        </p>
        {loadingKpis ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : errorKpis ? (
          <SectionError message="Erreur de chargement des KPIs financiers" />
        ) : kpis ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              label="Loyers attendus"
              value={formatFCFA(kpis.financier.loyersAttendus)}
              icon={Wallet}
              color="bg-slate-100 text-slate-600"
              border="border-slate-200"
            />
            <KpiCard
              label="Loyers encaissés"
              value={formatFCFA(kpis.financier.loyersEncaisses)}
              sub={`sur ${formatFCFA(kpis.financier.loyersAttendus)}`}
              icon={TrendingUp}
              color="bg-emerald-50 text-emerald-600"
              border="border-emerald-100"
            />
            <KpiCard
              label="Taux recouvrement"
              value={`${kpis.financier.tauxRecouvrement.toFixed(1)} %`}
              icon={BarChart3}
              color={
                kpis.financier.tauxRecouvrement >= 80
                  ? 'bg-emerald-50 text-emerald-600'
                  : kpis.financier.tauxRecouvrement >= 50
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-red-50 text-red-500'
              }
              border={
                kpis.financier.tauxRecouvrement >= 80
                  ? 'border-emerald-100'
                  : kpis.financier.tauxRecouvrement >= 50
                  ? 'border-amber-100'
                  : 'border-red-100'
              }
            />
            <KpiCard
              label="Dépenses du mois"
              value={formatFCFA(kpis.financier.depensesDuMois)}
              icon={CreditCard}
              color="bg-orange-50 text-orange-600"
              border="border-orange-100"
            />
            <KpiCard
              label="Solde net"
              value={formatFCFA(kpis.financier.soldeNet)}
              icon={kpis.financier.soldeNet >= 0 ? TrendingUp : TrendingDown}
              color={kpis.financier.soldeNet >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}
              border={kpis.financier.soldeNet >= 0 ? 'border-emerald-100' : 'border-red-100'}
            />
          </div>
        ) : null}
      </motion.div>

      {/* ── Patrimoine & Activité ───────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Patrimoine & Activité
        </p>
        {loadingKpis ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : kpis ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Taux d'occupation */}
            <Card className="p-5 border-blue-100 hover:shadow-md transition-shadow flex items-center gap-4">
              <Gauge pct={kpis.patrimoine.tauxOccupation} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Occupation</p>
                <p className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">
                  {kpis.patrimoine.biensLoues}<span className="text-sm font-semibold text-slate-400">/{kpis.patrimoine.totalBiens}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{kpis.patrimoine.biensDisponibles} vacant(s)</p>
              </div>
            </Card>

            {/* Contrats actifs */}
            <Card className="p-5 border-indigo-100 hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Contrats actifs</p>
                <p className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">{kpis.activite.contratsActifs}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  <Users className="h-3 w-3 inline mr-0.5" />{kpis.activite.totalLocataires} locataire(s)
                </p>
              </div>
            </Card>

            {/* Tickets ouverts */}
            <Card className="p-5 border-amber-100 hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tickets ouverts</p>
                <p className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">{kpis.activite.ticketsOuverts}</p>
                <p className="text-[11px] text-slate-400 mt-1">en traitement</p>
              </div>
            </Card>

            {/* Tickets urgents */}
            <Card className={`p-5 hover:shadow-md transition-shadow flex items-start gap-4 ${
              kpis.activite.ticketsUrgents > 0 ? 'border-red-200 bg-red-50/20' : 'border-emerald-100'
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${
                kpis.activite.ticketsUrgents > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {kpis.activite.ticketsUrgents > 0
                  ? <Zap className="h-5 w-5" />
                  : <CheckCircle2 className="h-5 w-5" />
                }
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tickets urgents</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xl font-extrabold text-slate-800 leading-none">{kpis.activite.ticketsUrgents}</p>
                  {kpis.activite.ticketsUrgents > 0 && (
                    <Badge className="text-[9px] font-bold bg-red-100 text-red-700 border-red-200 border">
                      CRITIQUE
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {kpis.activite.ticketsUrgents === 0 ? 'Aucun incident urgent' : 'Action requise'}
                </p>
              </div>
            </Card>
          </div>
        ) : null}
      </motion.div>

      {/* ── Chart + Alertes ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue chart */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-slate-800">Revenus vs Dépenses</p>
                <p className="text-xs text-slate-400 mt-0.5">Historique sur {mois} mois (FCFA)</p>
              </div>
              {/* Period selector */}
              <div className="flex items-center gap-1.5">
                {([6, 12, 24] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMois(m)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      mois === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {m} mois
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-blue-500 inline-block" />
                Loyers enc.
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-5 rounded-sm bg-orange-400 inline-block" />
                Dépenses
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-5 border-t-2 border-dashed border-emerald-500 inline-block" />
                Solde net
              </span>
            </div>

            {loadingRevenus ? (
              <Skeleton className="h-44 w-full" />
            ) : errorRevenus ? (
              <div className="h-44 flex items-center justify-center flex-col gap-2 text-red-400 text-sm">
                <AlertCircle className="h-5 w-5" />
                Erreur de chargement du graphique
              </div>
            ) : (
              <RevenueChart data={revenus} />
            )}
          </Card>
        </motion.div>

        {/* Alertes panel */}
        <motion.div variants={stagger.item}>
          <Card className="p-6 h-full flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="text-sm font-bold text-slate-800">Alertes</p>
              {alertes && (
                totalAlertes > 0
                  ? <Badge className="text-[10px] font-bold bg-red-100 text-red-700 border-red-200 border">{totalAlertes}</Badge>
                  : <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border-emerald-200 border">OK</Badge>
              )}
            </div>

            {loadingAlertes ? (
              <div className="space-y-3 flex-1">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : errorAlertes ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-2 text-red-400 text-sm">
                <AlertCircle className="h-5 w-5" />
                Erreur de chargement
              </div>
            ) : alertes ? (
              <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">

                {/* Loyers en retard */}
                <div>
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                    Loyers en retard ({alertes.totaux.loyersEnRetard})
                  </p>
                  {alertes.loyersEnRetard.length === 0 ? (
                    <EmptyAlert message="Aucun retard" />
                  ) : (
                    <ul className="space-y-1.5">
                      {alertes.loyersEnRetard.map(l => (
                        <li key={l.id}>
                          <Link
                            href={`/dashboard/gerant/payments?locataireId=${l.id}`}
                            className="block p-2.5 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-700 truncate">{l.locataire}</p>
                              <Badge className="text-[9px] font-bold bg-red-100 text-red-700 border-red-200 border shrink-0">
                                {l.joursRetard}j
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {l.bien} · {formatFCFA(l.montant)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Separator />

                {/* Contrats expirants */}
                <div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                    Contrats expirant ({alertes.totaux.contratsExpirants})
                  </p>
                  {alertes.contratsExpirants.length === 0 ? (
                    <EmptyAlert message="Aucun contrat à renouveler" />
                  ) : (
                    <ul className="space-y-1.5">
                      {alertes.contratsExpirants.map(c => (
                        <li key={c.id}>
                          <Link
                            href={`/dashboard/gerant/contracts/${c.id}`}
                            className="block p-2.5 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-700 truncate">{c.locataire}</p>
                              <Badge className={`text-[9px] font-bold border shrink-0 ${
                                c.joursRestants < 30
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                                {c.joursRestants}j
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {c.bien} · {c.dateFin
                                ? new Date(c.dateFin).toLocaleDateString('fr-FR')
                                : 'Sans échéance'}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Separator />

                {/* Tickets critiques */}
                <div>
                  <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
                    Tickets critiques ({alertes.totaux.ticketsUrgents})
                  </p>
                  {alertes.ticketsUrgents.length === 0 ? (
                    <EmptyAlert message="Aucun incident critique" />
                  ) : (
                    <ul className="space-y-1.5">
                      {alertes.ticketsUrgents.map(t => (
                        <li key={t.id}>
                          <Link
                            href={`/dashboard/gerant/tickets/${t.id}`}
                            className="block p-2.5 rounded-lg border border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-700 truncate">{t.titre}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3 text-orange-400" />
                                <Badge className="text-[9px] font-bold bg-orange-100 text-orange-700 border-orange-200 border">
                                  {t.joursOuverts}j
                                </Badge>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {t.bien} · {t.signalePar}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            ) : null}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
