'use client';

import { Building2, CheckCircle2, Shield, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: CheckCircle2, text: 'Suivi des loyers et paiements en temps réel' },
  { icon: Shield,       text: 'Sécurité et contrôle des accès par rôle' },
  { icon: BarChart3,    text: 'Tableaux de bord financiers détaillés' },
];

const stats = [
  { value: '500+', label: 'Biens gérés' },
  { value: '2 400', label: 'Locataires' },
  { value: '98 %', label: 'Satisfaction' },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-sans">
      {/* ── Left brand panel (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] shrink-0 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-10 w-36 h-36 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">Immob Platform</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2 className="text-[2.6rem] font-extrabold text-white leading-tight">
            La gestion<br />
            immobilière<br />
            <span className="text-blue-200">professionnelle.</span>
          </h2>
          <p className="text-blue-100 mt-5 text-[15px] leading-relaxed max-w-[300px]">
            Une plateforme complète pour gérer biens, contrats, paiements et maintenance.
          </p>

          <ul className="mt-9 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="h-5 w-5 text-blue-200 shrink-0 mt-0.5" />
                <span className="text-blue-50 text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats strip */}
          <div className="mt-10 pt-8 border-t border-white/20 grid grid-cols-3 gap-6">
            {stats.map(s => (
              <div key={s.label}>
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-blue-200 mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-blue-300 text-xs relative z-10">
          © 2024 Immob Platform — Tous droits réservés.
        </p>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 lg:bg-white">
        {/* Mobile header bar */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight">Immob Platform</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="w-full max-w-[420px]"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
