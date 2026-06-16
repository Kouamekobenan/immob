'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth-service';
import { parseApiError } from '@/lib/api';
import { KeyRound, CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-300">

        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            Im
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Immob Platform</h1>
          <p className="text-sm text-slate-500 mt-1">Nouveau mot de passe</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-500" />
              Réinitialiser le mot de passe
            </CardTitle>
            <CardDescription>
              Choisissez un nouveau mot de passe sécurisé (minimum 8 caractères).
            </CardDescription>
          </CardHeader>

          <CardContent>
            {done ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Mot de passe mis à jour !</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => router.push('/login')}>
                  Se connecter
                </Button>
              </div>
            ) : !token ? (
              <div className="py-6 text-center space-y-4">
                <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  Lien invalide ou expiré. Veuillez refaire une demande.
                </p>
                <Link href="/forgot-password">
                  <Button variant="outline" className="w-full">Refaire une demande</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Répétez votre mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Mise à jour...' : 'Enregistrer le mot de passe'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
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
