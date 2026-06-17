'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth-service';
import { parseApiError } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { AuthShell } from '@/components/shared/auth-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">E-mail envoyé !</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-xs mx-auto">
                Si un compte est associé à{' '}
                <span className="font-semibold text-slate-700">{email}</span>,
                vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setSent(false); setEmail(''); }}
            className="w-full h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-colors"
          >
            Envoyer un autre lien
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">
              Mot de passe oublié ?
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Entrez votre e-mail pour recevoir un lien de réinitialisation.
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
                <><Loader2 className="h-4 w-4 animate-spin" />Envoi en cours...</>
              ) : (
                <>Envoyer le lien<ArrowRight className="h-4 w-4" /></>
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
