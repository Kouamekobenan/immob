'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth-service';
import { parseApiError } from '@/lib/api';
import { CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthShell } from '@/components/shared/auth-shell';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {done ? (
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Mot de passe mis à jour !</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
          >
            Se connecter <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : !token ? (
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Lien invalide</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
            </div>
          </div>
          <Link href="/forgot-password">
            <button className="w-full h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-colors">
              Refaire une demande
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Choisissez un mot de passe sécurisé d'au moins 8 caractères.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 pr-11 text-sm bg-white border-slate-200"
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

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-sm font-medium text-slate-700">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="h-11 text-sm bg-white border-slate-200"
                disabled={loading}
              />
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
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Mise à jour...</>
              ) : (
                <>Enregistrer le mot de passe<ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
