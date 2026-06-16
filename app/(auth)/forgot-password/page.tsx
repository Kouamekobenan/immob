'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/auth-service';
import { parseApiError } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-300">

        {/* Logo */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            Im
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Immob Platform</h1>
          <p className="text-sm text-slate-500 mt-1">Réinitialisation du mot de passe</p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {sent ? (
              /* Success state */
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">E-mail envoyé</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Si un compte est associé à <span className="font-semibold text-slate-700">{email}</span>,
                      vous recevrez un lien de réinitialisation dans quelques instants.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => { setSent(false); setEmail(''); }}
                >
                  Envoyer un autre lien
                </Button>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {error && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Back to login */}
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
