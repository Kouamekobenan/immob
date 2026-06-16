'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Users, Edit, Search, Loader2, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { User, Role } from '@/types/prisma';
import { motion } from 'framer-motion';

const createSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
  role: z.enum(['SUPER_ADMIN', 'BAILLEUR', 'GERANT', 'LOCATAIRE', 'PRESTATAIRE']),
});
type CreateForm = z.infer<typeof createSchema>;

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const roleStyle: Record<Role, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-red-50 text-red-700 border-red-200' },
  BAILLEUR:    { label: 'Bailleur',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  GERANT:      { label: 'Gérant',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LOCATAIRE:   { label: 'Locataire',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PRESTATAIRE: { label: 'Prestataire', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function UsersManagement() {
  const { currentUser, users, changeUserRole, deleteUser, createUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('LOCATAIRE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const { register: formRegister, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'LOCATAIRE' },
  });

  const handleCreateSubmit = async (data: CreateForm) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await createUser({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        password: data.password,
        telephone: data.telephone || undefined,
        role: data.role as Role,
      });
      reset();
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
    const matchR = roleFilter === 'ALL' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const openEdit = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setFormError('');
    setIsOpen(true);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await changeUserRole(editingUser.id, selectedRole);
      setIsOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    if (!confirm(`Supprimer définitivement le compte de ${editingUser.prenom} ${editingUser.nom} ?`)) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await deleteUser(editingUser.id);
      setIsOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-500" />
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {users.length} compte{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''} sur la plateforme.
          </p>
        </div>
        <Button onClick={() => { setFormError(''); reset(); setIsCreateOpen(true); }} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Créer un utilisateur
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher nom, prénom, e-mail…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as Role | 'ALL')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              {(Object.keys(roleStyle) as Role[]).map(r => (
                <option key={r} value={r}>{roleStyle[r].label}</option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                  <th className="px-5 py-3.5">Utilisateur</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Téléphone</th>
                  <th className="px-5 py-3.5">Rôle</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => {
                    const rCfg = roleStyle[user.role];
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                              {user.prenom[0]}{user.nom[0]}
                            </div>
                            <span className="font-semibold text-slate-800">
                              {user.fullName ?? `${user.prenom} ${user.nom}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-medium">{user.email}</td>
                        <td className="px-5 py-3.5 text-slate-400">{user.telephone || '—'}</td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[10px] font-bold border ${rCfg.cls}`}>{rCfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(user)}
                            className="gap-1.5"
                            disabled={user.id === currentUser?.id}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Gérer
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Manage User Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Gérer l'utilisateur">
        {editingUser && (
          <div className="space-y-5">
            {/* User info — read-only */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0 shadow-inner">
                {editingUser.prenom[0]}{editingUser.nom[0]}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">
                  {editingUser.fullName ?? `${editingUser.prenom} ${editingUser.nom}`}
                </p>
                <p className="text-xs text-slate-500 truncate">{editingUser.email}</p>
                {editingUser.telephone && (
                  <p className="text-xs text-slate-400 truncate">{editingUser.telephone}</p>
                )}
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Rôle</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as Role)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer"
              >
                {(Object.keys(roleStyle) as Role[]).map(r => (
                  <option key={r} value={r}>{roleStyle[r].label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">Seul le rôle peut être modifié par un administrateur.</p>
            </div>

            {formError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                {formError}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Supprimer le compte
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button onClick={handleSaveRole} disabled={isSubmitting || selectedRole === editingUser.role} className="gap-2">
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer un utilisateur">
        <form onSubmit={handleSubmit(handleCreateSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cu-prenom">Prénom</Label>
              <Input id="cu-prenom" placeholder="Jean" {...formRegister('prenom')} disabled={isSubmitting} />
              {errors.prenom && <p className="text-xs text-red-600">{errors.prenom.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-nom">Nom</Label>
              <Input id="cu-nom" placeholder="Dupont" {...formRegister('nom')} disabled={isSubmitting} />
              {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Adresse e-mail</Label>
            <Input id="cu-email" type="email" placeholder="jean@example.com" {...formRegister('email')} disabled={isSubmitting} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-tel">Téléphone <span className="text-slate-400 font-normal text-[11px]">(optionnel)</span></Label>
            <Input id="cu-tel" type="tel" placeholder="+225 07 00 00 00 00" {...formRegister('telephone')} disabled={isSubmitting} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-pwd">Mot de passe</Label>
            <div className="relative">
              <Input
                id="cu-pwd"
                type={showPwd ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                {...formRegister('password')}
                className="pr-10"
                disabled={isSubmitting}
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

          <div className="space-y-1.5">
            <Label htmlFor="cu-role">Rôle</Label>
            <select
              id="cu-role"
              {...formRegister('role')}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer"
            >
              {(Object.keys(roleStyle) as Role[]).map(r => (
                <option key={r} value={r}>{roleStyle[r].label}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
