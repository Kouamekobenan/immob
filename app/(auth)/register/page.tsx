'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Loader2, Home, Briefcase } from 'lucide-react';
import { useAppStore } from '@/context/app-store-context';
import { parseApiError } from '@/lib/api';
import { motion } from 'framer-motion';

const schema = z.object({
  role: z.enum(['LOCATAIRE', 'GERANT']),
  prenom: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  nom: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Adresse e-mail invalide'),
  telephone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function redirectByRole(role: string) {
  return role === 'GERANT' ? '/dashboard/gerant' : '/dashboard/locataire';
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAppStore();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'LOCATAIRE' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setServerError('');
    setIsLoading(true);
    try {
      const user = await registerUser({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: data.password,
        telephone: data.telephone || undefined,
        role: data.role,
      });
      router.push(redirectByRole(user.role));
    } catch (err) {
      setServerError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-slate-50 p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            Im
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Créer un compte</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rejoignez la plateforme de gestion immobilière.
          </p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Inscription
            </CardTitle>
            <CardDescription>
              Renseignez vos informations pour créer votre espace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role toggle */}
              <div className="space-y-2">
                <Label>Type de compte</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'LOCATAIRE', label: 'Locataire', desc: 'Je loue un bien', Icon: Home },
                    { value: 'GERANT',    label: 'Gérant',    desc: 'Je gère des biens', Icon: Briefcase },
                  ] as const).map(({ value, label, desc, Icon }) => (
                    <label
                      key={value}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        selectedRole === value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input type="radio" value={value} {...register('role')} className="sr-only" />
                      <Icon className={`h-5 w-5 ${selectedRole === value ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${selectedRole === value ? 'text-blue-700' : 'text-slate-600'}`}>{label}</span>
                      <span className="text-[10px] text-slate-400 text-center leading-tight">{desc}</span>
                    </label>
                  ))}
                </div>
                {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" placeholder="Jean" {...register('prenom')} disabled={isLoading} />
                  {errors.prenom && <p className="text-xs text-red-600">{errors.prenom.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" placeholder="Dupont" {...register('nom')} disabled={isLoading} />
                  {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" placeholder="jean@example.com" {...register('email')} disabled={isLoading} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="telephone">
                  Téléphone <span className="text-slate-400 font-normal text-[11px]">(optionnel)</span>
                </Label>
                <Input id="telephone" type="tel" placeholder="+225 07 00 00 00 00" {...register('telephone')} disabled={isLoading} />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    {...register('password')}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Répéter le mot de passe"
                    {...register('confirmPassword')}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              {serverError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  {serverError}
                </p>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </Button>

              <p className="text-center text-xs text-slate-500 pt-1">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
