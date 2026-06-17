'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatFCFA } from '@/lib/utils';
import { statsService } from '@/lib/services/stats.service';
import type { DashboardKPIs, RevenuPoint, AlertesResponse } from '@/types/stats';
import {
  RefreshCw, CheckCircle2, AlertCircle,
  ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════════
   MICRO-COMPONENTS
══════════════════════════════════════════════════════════════ */

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className ?? ''}`} />;
}

/* ── Gradient wave card (purple / cyan) ─────────────────────── */
function WaveCard({ label, value, sub, gradient }: {
  label: string; value: string; sub?: string; gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 text-white shadow-md ${gradient}`}>
      {/* decorative waves */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-16 sm:h-20 opacity-20 pointer-events-none">
        <path d="M0,40 C80,80 160,0 240,40 C320,80 380,20 400,50 L400,120 L0,120 Z" fill="white" />
        <path d="M0,60 C80,100 160,20 240,60 C320,100 380,40 400,70 L400,120 L0,120 Z" fill="white" opacity="0.6" />
      </svg>
      <div className="relative z-10">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-75 mb-2">{label}</p>
        <p className="text-2xl sm:text-3xl font-black leading-none mb-1 break-words">{value}</p>
        {sub && <p className="text-[11px] opacity-70">{sub}</p>}
        <button className="mt-3 flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 hover:bg-white/35 transition-colors">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Multi-ring gauge ───────────────────────────────────────── */
function RingGauge({ occupation, biensLoues, totalBiens, contratsActifs }: {
  occupation: number; biensLoues: number; totalBiens: number; contratsActifs: number;
}) {
  const rings = [
    { r: 52, pct: Math.min(occupation, 100), stroke: '#06b6d4', width: 7 },
    { r: 40, pct: totalBiens > 0 ? (biensLoues / totalBiens) * 100 : 0, stroke: '#1e293b', width: 7 },
    { r: 28, pct: Math.min((contratsActifs / Math.max(totalBiens, 1)) * 100, 100), stroke: '#e2e8f0', width: 7 },
  ];

  const legends = [
    { label: 'Occupation', pct: occupation, color: '#06b6d4' },
    { label: 'Biens loués', pct: totalBiens > 0 ? (biensLoues / totalBiens) * 100 : 0, color: '#1e293b' },
    { label: 'Contrats', pct: Math.min((contratsActifs / Math.max(totalBiens, 1)) * 100, 100), color: '#a8a29e' },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: 128, height: 128 }}>
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          {rings.map(({ r, pct, stroke, width }) => {
            const circ = 2 * Math.PI * r;
            const dash = (pct / 100) * circ;
            return (
              <g key={r}>
                <circle cx={64} cy={64} r={r} fill="none" stroke="#f1f5f9" strokeWidth={width} />
                <motion.circle
                  cx={64} cy={64} r={r} fill="none"
                  stroke={stroke} strokeWidth={width} strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circ}` }}
                  animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800 leading-none">{occupation.toFixed(0)}%</span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5">OCCUPÉ</span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {legends.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>{label}</span>
              <span className="text-slate-700 font-bold">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Revenue SVG line chart ─────────────────────────────────── */
function RevenueChart({ data }: { data: RevenuPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-200 text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  const W = 560, H = 160;
  const pad = { t: 20, r: 14, b: 36, l: 50 };
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

  // Peak callout points
  const peakLoyers = data.reduce((m, d, i) => d.loyersEncaisses > m.val ? { val: d.loyersEncaisses, i } : m, { val: -Infinity, i: 0 });
  const peakSolde  = data.reduce((m, d, i) => d.solde > m.val ? { val: d.solde, i } : m, { val: -Infinity, i: 0 });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="fillLoyers" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={yOf(v)} y2={yOf(v)} stroke="#f8fafc" strokeWidth={1} />
          <text x={pad.l - 4} y={yOf(v) + 3.5} textAnchor="end" fontSize={8} fill="#cbd5e1">{fmtK(v)}</text>
        </g>
      ))}

      {/* X labels */}
      {data.map((d, i) => {
        if (data.length > 8 && i % 2 !== 0) return null;
        return (
          <text key={d.periode} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="#cbd5e1">
            {fmtPeriode(d.periode)}
          </text>
        );
      })}

      {/* Area fill */}
      <polygon
        points={`${pts(d => d.loyersEncaisses)} ${xOf(data.length - 1).toFixed(1)},${yOf(rawMin).toFixed(1)} ${xOf(0).toFixed(1)},${yOf(rawMin).toFixed(1)}`}
        fill="url(#fillLoyers)"
      />

      {/* Dépenses — purple dashed */}
      <polyline points={pts(d => d.depenses)} fill="none" stroke="#60a5fa"
        strokeWidth={1.5} strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />
      {/* Solde — rose */}
      <polyline points={pts(d => d.solde)} fill="none" stroke="#f43f5e"
        strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Loyers — cyan */}
      <polyline points={pts(d => d.loyersEncaisses)} fill="none" stroke="#06b6d4"
        strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {/* Callout — peak loyers */}
      {data.length > 0 && (() => {
        const x = xOf(peakLoyers.i);
        const y = yOf(data[peakLoyers.i].loyersEncaisses);
        return (
          <g>
            <circle cx={x} cy={y} r={4.5} fill="white" stroke="#06b6d4" strokeWidth={2} />
            <rect x={x - 22} y={y - 24} width={44} height={15} rx={5} fill="#06b6d4" />
            <text x={x} y={y - 14} textAnchor="middle" fontSize={8.5} fill="white" fontWeight="700">
              {fmtK(data[peakLoyers.i].loyersEncaisses)}
            </text>
          </g>
        );
      })()}

      {/* Callout — peak solde (only if different point) */}
      {data.length > 1 && peakSolde.i !== peakLoyers.i && (() => {
        const x = xOf(peakSolde.i);
        const y = yOf(data[peakSolde.i].solde);
        return (
          <g>
            <circle cx={x} cy={y} r={4.5} fill="white" stroke="#f43f5e" strokeWidth={2} />
            <rect x={x - 22} y={y - 24} width={44} height={15} rx={5} fill="#f43f5e" />
            <text x={x} y={y - 14} textAnchor="middle" fontSize={8.5} fill="white" fontWeight="700">
              {fmtK(data[peakSolde.i].solde)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

/* ── Mini bar chart ─────────────────────────────────────────── */
function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-14 w-full">
      {values.map((v, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm min-w-0"
          style={{ backgroundColor: color, transformOrigin: 'bottom' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: (v / max) }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

/* ── Alert row (message-list style) ────────────────────────── */
function AlertRow({ title, sub, badge, urgent, href }: {
  title: string; sub: string; badge: string; urgent?: boolean; href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
        <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 truncate">{title}</p>
        <p className="text-[10px] text-slate-400 truncate">{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${urgent ? 'bg-rose-100 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          {badge}
        </span>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${urgent ? 'border-rose-200 text-rose-500 group-hover:bg-rose-50' : 'border-slate-200 text-slate-500 group-hover:bg-slate-100'}`}>
          Voir
        </span>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */

export default function StatsDashboard() {
  const [kpis, setKpis]       = useState<DashboardKPIs | null>(null);
  const [revenus, setRevenus] = useState<RevenuPoint[]>([]);
  const [alertes, setAlertes] = useState<AlertesResponse | null>(null);
  const [mois, setMois]       = useState(12);

  const [loadingKpis,    setLoadingKpis]    = useState(true);
  const [loadingRevenus, setLoadingRevenus] = useState(true);
  const [loadingAlertes, setLoadingAlertes] = useState(true);
  const [errorKpis,      setErrorKpis]      = useState(false);
  const [errorRevenus,   setErrorRevenus]   = useState(false);
  const [errorAlertes,   setErrorAlertes]   = useState(false);
  const [isRefreshing,   setIsRefreshing]   = useState(false);

  const fetchKpis = useCallback(async () => {
    setLoadingKpis(true); setErrorKpis(false);
    try   { const r = await statsService.getDashboard(); setKpis(r.data); }
    catch { setErrorKpis(true); }
    finally { setLoadingKpis(false); }
  }, []);

  const fetchRevenus = useCallback(async (m: number) => {
    setLoadingRevenus(true); setErrorRevenus(false);
    try   { const r = await statsService.getRevenus(m); setRevenus(r.data); }
    catch { setErrorRevenus(true); }
    finally { setLoadingRevenus(false); }
  }, []);

  const fetchAlertes = useCallback(async () => {
    setLoadingAlertes(true); setErrorAlertes(false);
    try   { const r = await statsService.getAlertes(); setAlertes(r.data); }
    catch { setErrorAlertes(true); }
    finally { setLoadingAlertes(false); }
  }, []);

  useEffect(() => {
    void fetchKpis(); void fetchRevenus(mois); void fetchAlertes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void fetchRevenus(mois); }, [mois, fetchRevenus]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchKpis(); void fetchRevenus(mois); void fetchAlertes();
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois]);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchKpis(), fetchRevenus(mois), fetchAlertes()]);
    setIsRefreshing(false);
  }, [fetchKpis, fetchRevenus, fetchAlertes, mois]);

  const periodeLabel = kpis?.periode ? fmtMonthFull(kpis.periode) : '…';
  const miniBarVals  = revenus.slice(-10).map(d => d.loyersEncaisses);
  const totalAlertes = alertes
    ? alertes.totaux.loyersEnRetard + alertes.totaux.contratsExpirants + alertes.totaux.ticketsUrgents
    : 0;

  /* ── render ───────────────────────────────────── */

  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════
          HERO BANNER — coral → pink gradient
      ════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 px-6 py-7 shadow-lg">
        {/* decorative blob */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-white">
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">Analytics</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
              Tableau de bord
            </h1>
            <p className="text-white/70 text-sm mt-1 font-medium">{periodeLabel}</p>
          </div>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 bg-white rounded-xl shadow-md hover:bg-pink-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ROW 1 — 2 wave cards + 3 small KPI cards
      ════════════════════════════════════════════ */}
      {loadingKpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 sm:h-32" />)}
        </div>
      ) : errorKpis ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-red-100">
          <AlertCircle className="h-5 w-5 mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-400">Erreur de chargement des KPIs</p>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

          {/* Wave card 1 — purple */}
          <WaveCard
            label="Loyers encaissés"
            value={`${fmtK(kpis.financier.loyersEncaisses)}`}
            sub="FCFA ce mois"
            gradient="bg-gradient-to-br from-blue-700 to-blue-500"
          />

          {/* Wave card 2 — cyan */}
          <WaveCard
            label="Solde net"
            value={`${fmtK(kpis.financier.soldeNet)}`}
            sub="FCFA ce mois"
            gradient={
              kpis.financier.soldeNet >= 0
                ? 'bg-gradient-to-br from-cyan-400 to-teal-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            }
          />

          {/* Small card — Loyers attendus */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Attendus</p>
            <p className="text-xl font-black text-slate-800 mt-1 leading-none break-words">{fmtK(kpis.financier.loyersAttendus)}</p>
            <p className="text-[10px] text-slate-400 mt-1">FCFA</p>
          </div>

          {/* Small card — Taux recouvrement */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Recouvrement</p>
            <p className={`text-xl font-black mt-1 leading-none ${
              kpis.financier.tauxRecouvrement >= 80 ? 'text-emerald-500'
              : kpis.financier.tauxRecouvrement >= 50 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {kpis.financier.tauxRecouvrement.toFixed(1)}%
            </p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  kpis.financier.tauxRecouvrement >= 80 ? 'bg-emerald-500'
                  : kpis.financier.tauxRecouvrement >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: `${kpis.financier.tauxRecouvrement}%` }}
              />
            </div>
          </div>

          {/* Small card — Dépenses */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Dépenses</p>
            <p className="text-xl font-black text-orange-500 mt-1 leading-none break-words">{fmtK(kpis.financier.depensesDuMois)}</p>
            <p className="text-[10px] text-slate-400 mt-1">FCFA</p>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════
          ROW 2 — Line chart  +  Alertes panel
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Revenus &amp; Dépenses</p>
              <p className="text-xs text-slate-400">FCFA · {mois} derniers mois</p>
            </div>
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
              {(['Quotidien', 'Hebdo', 'Mensuel'] as const).map((label, idx) => {
                const vals = [1, 6, 12] as const;
                const m = vals[idx];
                return (
                  <button
                    key={label}
                    onClick={() => setMois(m === 1 ? 12 : m)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      (m === 1 ? 12 : m) === mois || (m === 12 && mois === 12)
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-cyan-500 inline-block" />Loyers enc.</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-rose-400 inline-block" />Solde net</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-blue-400 inline-block" />Dépenses</span>
          </div>

          {loadingRevenus ? (
            <Skeleton className="h-40 w-full" />
          ) : errorRevenus ? (
            <div className="h-40 flex items-center justify-center text-red-400 text-sm flex-col gap-2">
              <AlertCircle className="h-5 w-5" />Erreur de chargement
            </div>
          ) : (
            <RevenueChart data={revenus} />
          )}

          <div className="flex justify-end mt-3">
            <button className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              Stats
            </button>
          </div>
        </div>

        {/* Alertes panel — message-list style */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <p className="text-sm font-bold text-slate-800">Alertes</p>
              <p className="text-xs text-slate-400">Actions requises</p>
            </div>
            {alertes && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                totalAlertes > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {totalAlertes > 0 ? totalAlertes : 'OK'}
              </span>
            )}
          </div>

          {loadingAlertes ? (
            <div className="space-y-2 flex-1">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : errorAlertes ? (
            <div className="flex-1 flex items-center justify-center text-red-400 text-sm flex-col gap-2">
              <AlertCircle className="h-5 w-5" />Erreur de chargement
            </div>
          ) : alertes ? (
            <div className="flex-1 overflow-y-auto min-h-0">
              {totalAlertes === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-emerald-500 gap-2">
                  <CheckCircle2 className="h-9 w-9" />
                  <p className="text-sm font-bold">Aucune alerte</p>
                  <p className="text-xs text-slate-400">Tout est en ordre</p>
                </div>
              ) : (
                <>
                  {alertes.loyersEnRetard.map(l => (
                    <AlertRow
                      key={l.id}
                      title={l.locataire}
                      sub={`${l.bien} · ${fmtK(l.montant)} FCFA`}
                      badge={`${l.joursRetard}j retard`}
                      urgent
                      href={`/dashboard/gerant/payments?locataireId=${l.id}`}
                    />
                  ))}
                  {alertes.contratsExpirants.map(c => (
                    <AlertRow
                      key={c.id}
                      title={c.locataire}
                      sub={`${c.bien} · ${c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : 'Sans échéance'}`}
                      badge={`${c.joursRestants}j`}
                      urgent={c.joursRestants < 30}
                      href={`/dashboard/gerant/contracts/${c.id}`}
                    />
                  ))}
                  {alertes.ticketsUrgents.map(t => (
                    <AlertRow
                      key={t.id}
                      title={t.titre}
                      sub={`${t.bien} · ${t.signalePar}`}
                      badge={`${t.joursOuverts}j`}
                      urgent
                      href={`/dashboard/gerant/tickets/${t.id}`}
                    />
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ROW 3 — Ring gauge  +  Activity bars  +  Stats card
      ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Ring chart — occupation */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-800 mb-5">Taux d&apos;occupation</p>
          {loadingKpis ? (
            <Skeleton className="h-52" />
          ) : kpis ? (
            <>
              <RingGauge
                occupation={kpis.patrimoine.tauxOccupation}
                biensLoues={kpis.patrimoine.biensLoues}
                totalBiens={kpis.patrimoine.totalBiens}
                contratsActifs={kpis.activite.contratsActifs}
              />
              {/* Legend chips */}
              <div className="flex justify-center gap-4 mt-4 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />Occup.</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block" />Loués</span>
              </div>
              <button className="mt-4 w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                Confirmer
              </button>
            </>
          ) : null}
        </div>

        {/* Activity bar chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-slate-800">Activité</p>
            <div className="flex gap-2 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Actifs</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />Urgents</span>
            </div>
          </div>

          {loadingKpis ? (
            <Skeleton className="h-40" />
          ) : kpis ? (
            <>
              <div className="space-y-3.5">
                {[
                  { label: 'Contrats actifs',  value: kpis.activite.contratsActifs,   max: Math.max(kpis.activite.contratsActifs, 1),   color: 'bg-blue-500' },
                  { label: 'Locataires',        value: kpis.activite.totalLocataires,  max: Math.max(kpis.activite.totalLocataires, 1),  color: 'bg-blue-400' },
                  { label: 'Tickets ouverts',   value: kpis.activite.ticketsOuverts,   max: Math.max(kpis.activite.ticketsOuverts, 1),   color: 'bg-cyan-400' },
                  { label: 'Tickets urgents',   value: kpis.activite.ticketsUrgents,   max: Math.max(kpis.activite.ticketsOuverts, 1),   color: 'bg-rose-400' },
                ].map(({ label, value, max, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                      <span>{label}</span>
                      <span className="font-bold text-slate-700">{value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-5 w-full py-2 border-2 border-blue-200 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors">
                Rapport
              </button>
            </>
          ) : null}
        </div>

        {/* Stats card — large number + mini bar chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-bold text-slate-800">Revenus récents</p>
          <p className="text-xs text-slate-400 mb-2">{kpis?.periode ?? '…'}</p>

          {loadingKpis || loadingRevenus ? (
            <Skeleton className="flex-1 min-h-[160px]" />
          ) : kpis ? (
            <>
              <p className="text-4xl font-black text-blue-600 leading-none">
                {fmtK(kpis.financier.loyersEncaisses)}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">FCFA encaissés</p>

              {miniBarVals.length > 0 && (
                <MiniBarChart values={miniBarVals} color="#06b6d4" />
              )}

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                {kpis.financier.soldeNet >= 0
                  ? <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                }
                <span className={`text-xs font-bold ${kpis.financier.soldeNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {kpis.financier.soldeNet >= 0 ? '+' : ''}{fmtK(kpis.financier.soldeNet)} FCFA
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                  Confirmer
                </button>
                <button className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  Imprimer
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

    </div>
  );
}
