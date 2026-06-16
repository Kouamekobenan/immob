'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseApiError } from '@/lib/api';
import { User, ShieldCheck, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN:  'Super Administrateur',
  BAILLEUR:     'Bailleur',
  GERANT:       'Gérant',
  LOCATAIRE:    'Locataire',
  PRESTATAIRE:  'Prestataire',
};

const profileSchema = z.object({
  nom:       z.string().min(2, 'Minimum 2 caractères').max(50, 'Maximum 50 caractères'),
  prenom:    z.string().min(2, 'Minimum 2 caractères').max(50, 'Maximum 50 caractères'),
  telephone: z.string().regex(/^\+?[0-9\s\-()?]{7,20}$/, 'Format invalide').optional().or(z.literal('')),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requis'),
  newPassword:     z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Requis'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { currentUser, updateMyProfile, changePassword } = useAppStore();

  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError]     = useState('');

  const [pwdSaving, setPwdSaving]   = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError]     = useState('');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom:       currentUser?.nom       ?? '',
      prenom:    currentUser?.prenom    ?? '',
      telephone: currentUser?.telephone ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  if (!currentUser) return null;

  const handleProfileSave = async (data: ProfileForm) => {
    setProfileError('');
    setProfileSuccess(false);
    setProfileSaving(true);
    try {
      const payload: { nom?: string; prenom?: string; telephone?: string } = {
        nom:    data.nom,
        prenom: data.prenom,
      };
      if (data.telephone) payload.telephone = data.telephone;
      await updateMyProfile(payload);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(parseApiError(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    setPwdError('');
    setPwdSuccess('');
    setPwdSaving(true);
    try {
      const res = await changePassword(data.currentPassword, data.newPassword);
      setPwdSuccess(res.message);
      passwordForm.reset();
    } catch (err) {
      setPwdError(parseApiError(err));
    } finally {
      setPwdSaving(false);
    }
  };

  const initials = `${currentUser.prenom?.[0] ?? '?'}${currentUser.nom?.[0] ?? ''}`.toUpperCase();

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center gap-3">
        <User className="h-6 w-6 text-slate-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mon Profil</h1>
          <p className="text-sm text-slate-500 mt-0.5">Consultez et modifiez vos informations personnelles.</p>
        </div>
      </motion.div>

      {/* Identity card */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0 shadow-inner">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-800 truncate">
                  {currentUser.fullName ?? `${currentUser.prenom} ${currentUser.nom}`}
                </p>
                <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 uppercase tracking-wide">
                  {roleLabels[currentUser.role] ?? currentUser.role}
                </span>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">E-mail</p>
                <p className="text-sm font-medium text-slate-700">{currentUser.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Immuable
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Rôle</p>
                <p className="text-sm font-medium text-slate-700">{roleLabels[currentUser.role] ?? currentUser.role}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Géré par l&apos;administration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit profile form */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardHeader>
            <CardTitle>Modifier mes informations</CardTitle>
            <CardDescription>Nom, prénom et numéro de téléphone.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    {...profileForm.register('prenom')}
                    className={profileForm.formState.errors.prenom ? 'border-red-400' : ''}
                  />
                  {profileForm.formState.errors.prenom && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.prenom.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    {...profileForm.register('nom')}
                    className={profileForm.formState.errors.nom ? 'border-red-400' : ''}
                  />
                  {profileForm.formState.errors.nom && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.nom.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telephone">
                  Téléphone <span className="text-slate-400 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="telephone"
                  {...profileForm.register('telephone')}
                  placeholder="+225 07 00 00 00 00"
                  className={profileForm.formState.errors.telephone ? 'border-red-400' : ''}
                />
                {profileForm.formState.errors.telephone && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.telephone.message}</p>
                )}
              </div>

              {profileError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Profil mis à jour avec succès.
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={profileSaving} className="gap-2">
                  {profileSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Sauvegarder
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change password form */}
      <motion.div variants={stagger.item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-500" />
              Changer mon mot de passe
            </CardTitle>
            <CardDescription>Votre mot de passe actuel est requis pour valider le changement.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  className={passwordForm.formState.errors.currentPassword ? 'border-red-400' : ''}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register('newPassword')}
                    className={passwordForm.formState.errors.newPassword ? 'border-red-400' : ''}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                    className={passwordForm.formState.errors.confirmPassword ? 'border-red-400' : ''}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {pwdError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                  {pwdError}
                </p>
              )}
              {pwdSuccess && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {pwdSuccess}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={pwdSaving} className="gap-2">
                  {pwdSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Changer le mot de passe
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
