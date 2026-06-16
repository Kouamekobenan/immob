'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md text-center space-y-8 animate-in fade-in duration-500">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-blue-500/25">
            Im
          </div>
        </div>

        {/* 404 visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <span className="text-8xl font-black text-slate-800 tracking-tighter leading-none select-none">4</span>
            <Building2 className="h-16 w-16 text-blue-400 shrink-0" strokeWidth={1.5} />
            <span className="text-8xl font-black text-slate-800 tracking-tighter leading-none select-none">4</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Page introuvable</p>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800">
            Cette page n&apos;existe pas
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            La page que vous recherchez a peut-être été déplacée, supprimée, ou vous avez saisi une adresse incorrecte.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200 w-24 mx-auto" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            Page d&apos;accueil
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Page précédente
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-slate-400">
          Immob Platform — Gestion Immobilière
        </p>
      </div>
    </div>
  );
}
