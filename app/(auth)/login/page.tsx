'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/context/app-store-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { AuthShell } from '@/components/shared/auth-shell';

function redirectByRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':  return '/dashboard/super-admin';
    case 'BAILLEUR':     return '/dashboard/bailleur';
    case 'GERANT':       return '/dashboard/gerant';
    case 'LOCATAIRE':    return '/dashboard/locataire';
    case 'PRESTATAIRE':  return '/dashboard/prestataire';
    default:             return '/login';
  }
}

export default function LoginPage() {
  const { login, currentUser, isAuthLoading } = useAppStore();
  const router = useRouter();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      router.push(redirectByRole(currentUser.role));
    }
  }, [currentUser, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(redirectByRole(user.role));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">
          Bon retour !
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Connectez-vous à votre espace de gestion.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Adresse e-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jean.dupont@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10 text-sm bg-white border-slate-200"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Mot de passe
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10 pr-11 text-sm bg-white border-slate-200"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <div className="h-4 w-4 rounded-full bg-red-500 shrink-0 mt-0.5 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold leading-none">!</span>
            </div>
            <p className="text-xs text-red-700 font-medium leading-snug">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
          Créer un compte
        </Link>
      </p>
    </AuthShell>
  );
}
