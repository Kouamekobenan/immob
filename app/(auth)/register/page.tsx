'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Home, Briefcase, ArrowRight, Phone, Mail, User } from 'lucide-react';
import { useAppStore } from '@/context/app-store-context';
import { parseApiError } from '@/lib/api';
import { AuthShell } from '@/components/shared/auth-shell';

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
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-[1.75rem] font-extrabold text-slate-900 tracking-tight leading-tight">
          Créer un compte
        </h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Rejoignez la plateforme de gestion immobilière.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Type de compte</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {([
              { value: 'LOCATAIRE', label: 'Locataire', desc: 'Je loue un bien', Icon: Home },
              { value: 'GERANT',    label: 'Gérant',    desc: 'Je gère des biens', Icon: Briefcase },
            ] as const).map(({ value, label, desc, Icon }) => (
              <label
                key={value}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                  selectedRole === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <input type="radio" value={value} {...register('role')} className="sr-only" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${selectedRole === value ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <Icon className={`h-4 w-4 ${selectedRole === value ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
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
            <Label htmlFor="prenom" className="text-sm font-medium text-slate-700">Prénom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input id="prenom" placeholder="Jean" {...register('prenom')} disabled={isLoading}
                className="h-10 pl-9 text-sm bg-white border-slate-200" />
            </div>
            {errors.prenom && <p className="text-xs text-red-600 leading-tight">{errors.prenom.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom" className="text-sm font-medium text-slate-700">Nom</Label>
            <Input id="nom" placeholder="Dupont" {...register('nom')} disabled={isLoading}
              className="h-10 text-sm bg-white border-slate-200" />
            {errors.nom && <p className="text-xs text-red-600 leading-tight">{errors.nom.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">Adresse e-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="email" type="email" placeholder="jean@example.com" {...register('email')}
              disabled={isLoading} className="h-10 pl-10 text-sm bg-white border-slate-200" />
          </div>
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="telephone" className="text-sm font-medium text-slate-700">
            Téléphone <span className="text-slate-400 font-normal">(optionnel)</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="telephone" type="tel" placeholder="+225 07 00 00 00 00" {...register('telephone')}
              disabled={isLoading} className="h-10 pl-10 text-sm bg-white border-slate-200" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">Mot de passe</Label>
          <div className="relative">
            <Input id="password" type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 caractères"
              {...register('password')} className="h-10 pr-11 text-sm bg-white border-slate-200" disabled={isLoading} />
            <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirmer le mot de passe</Label>
          <div className="relative">
            <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Répéter le mot de passe"
              {...register('confirmPassword')} className="h-10 pr-11 text-sm bg-white border-slate-200" disabled={isLoading} />
            <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3">
            <div className="h-4 w-4 rounded-full bg-red-500 shrink-0 mt-0.5 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold leading-none">!</span>
            </div>
            <p className="text-xs text-red-700 font-medium leading-snug">{serverError}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20">
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Création en cours...</>
          ) : (
            <>Créer mon compte<ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
