'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, ShieldAlert, Building2, Users, Wrench, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, users, currentUser } = useAppStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // If already logged in, redirect to the correct page
  useEffect(() => {
    if (currentUser) {
      redirectByRole(currentUser.role);
    }
  }, [currentUser]);

  const redirectByRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        router.push('/dashboard/super-admin');
        break;
      case 'BAILLEUR':
        router.push('/dashboard/bailleur');
        break;
      case 'GERANT':
        router.push('/dashboard/gerant');
        break;
      case 'LOCATAIRE':
        router.push('/dashboard/locataire');
        break;
      case 'PRESTATAIRE':
        router.push('/dashboard/prestataire');
        break;
      default:
        router.push('/login');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Veuillez entrer une adresse e-mail.');
      return;
    }

    const user = login(email);
    if (user) {
      redirectByRole(user.role);
    } else {
      setError('Utilisateur non trouvé. Utilisez un des e-mails prédéfinis ou cliquez sur un accès rapide ci-dessous.');
    }
  };

  const handleQuickLogin = (email: string) => {
    const user = login(email);
    if (user) {
      redirectByRole(user.role);
    }
  };

  // Assign icons for quick access display
  const getIconForRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <ShieldAlert className="h-5 w-5 text-red-600" />;
      case 'BAILLEUR':
        return <UserCheck className="h-5 w-5 text-indigo-600" />;
      case 'GERANT':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'LOCATAIRE':
        return <Users className="h-5 w-5 text-emerald-600" />;
      case 'PRESTATAIRE':
        return <Wrench className="h-5 w-5 text-amber-600" />;
      default:
        return <KeyRound className="h-5 w-5 text-slate-600" />;
    }
  };

  const getDescriptionForRole = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Gère les comptes et supervise les logs d\'audit de la plateforme.';
      case 'BAILLEUR':
        return 'Propriétaire des biens. Visualise les indicateurs financiers et les gérants.';
      case 'GERANT':
        return 'Administre les biens, signe les contrats, encaisse les loyers et gère la maintenance.';
      case 'LOCATAIRE':
        return 'Consulte son contrat, règle ses loyers en ligne et signale les pannes.';
      case 'PRESTATAIRE':
        return 'Reçoit les ordres d\'intervention et déclare les pannes résolues.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl space-y-8 animate-in fade-in duration-300">
        
        {/* Logo and Header text */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20 mx-auto mb-4">
            Im
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Immob Platform</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Plateforme unifiée de gestion immobilière pour bailleurs, gérants, locataires et prestataires.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          
          {/* Left Column: Form login */}
          <div className="md:col-span-2">
            <Card className="shadow-lg border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Connexion Unifiée</CardTitle>
                <CardDescription>Entrez votre e-mail pour accéder à votre espace.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Adresse E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="ex: gerant@immob.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full justify-center">
                    Connexion
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Demo Accounts Quick Access */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Accès de Démonstration (Simulateur)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sélectionnez un des comptes types configurés pour tester instantanément les interfaces et le flux de navigation.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.email)}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-blue-50/20 hover:border-blue-300 hover:shadow-sm text-left transition-all duration-200 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-slate-50 group-hover:bg-blue-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getIconForRole(u.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-800">
                        {u.prenom} {u.nom}
                      </h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 group-hover:bg-blue-100/50 text-slate-600 group-hover:text-blue-700 rounded-md border border-slate-200/30 uppercase tracking-wider shrink-0">
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{u.email}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal font-normal">
                      {getDescriptionForRole(u.role)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
