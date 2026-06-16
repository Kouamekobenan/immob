'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { parseApiError } from '@/lib/api';

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

  // If already authenticated, redirect immediately
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
  // Show nothing while checking existing session
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-300">

        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            Im
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Immob Platform</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connectez-vous à votre espace de gestion.
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Connexion
            </CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à la plateforme.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="jean.dupont@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  {error}
                </p>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>

              {/* Forgot password link */}
              <p className="text-center text-xs text-slate-500">
                <a href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                  Mot de passe oublié ?
                </a>
              </p>

              <p className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                Pas encore de compte ?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                  Créer un compte
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
