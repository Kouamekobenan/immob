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
import { Users, Edit, Search } from 'lucide-react';
import { User, Role } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const schema = z.object({
  prenom:    z.string().min(1, 'Requis'),
  nom:       z.string().min(1, 'Requis'),
  email:     z.string().email('E-mail invalide'),
  telephone: z.string().optional(),
  role:      z.enum(['SUPER_ADMIN', 'BAILLEUR', 'GERANT', 'LOCATAIRE', 'PRESTATAIRE']),
});
type FormValues = z.infer<typeof schema>;

const roleStyle: Record<Role, { label: string; cls: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', cls: 'bg-red-50 text-red-700 border-red-200' },
  BAILLEUR:    { label: 'Bailleur',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  GERANT:      { label: 'Gérant',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LOCATAIRE:   { label: 'Locataire',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PRESTATAIRE: { label: 'Prestataire', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function UsersManagement() {
  const { users, updateUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchQ = !q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q);
    const matchR = roleFilter === 'ALL' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset({ prenom: user.prenom, nom: user.nom, email: user.email, telephone: user.telephone ?? '', role: user.role });
    setIsOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (!editingUser) return;
    updateUser({ ...editingUser, ...data, telephone: data.telephone || null });
    setIsOpen(false);
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
                            <span className="font-semibold text-slate-800">{user.prenom} {user.nom}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-medium">{user.email}</td>
                        <td className="px-5 py-3.5 text-slate-400">{user.telephone || '—'}</td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[10px] font-bold border ${rCfg.cls}`}>{rCfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(user)} className="gap-1.5">
                            <Edit className="h-3.5 w-3.5" />
                            Éditer
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

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier l'utilisateur">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" {...register('prenom')} className={errors.prenom ? 'border-red-400' : ''} />
              {errors.prenom && <p className="text-xs text-red-500">{errors.prenom.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" {...register('nom')} className={errors.nom ? 'border-red-400' : ''} />
              {errors.nom && <p className="text-xs text-red-500">{errors.nom.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} className={errors.email ? 'border-red-400' : ''} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telephone">Téléphone <span className="text-slate-400 font-normal">(optionnel)</span></Label>
            <Input id="telephone" {...register('telephone')} placeholder="+33 6 00 00 00 00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              {...register('role')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 cursor-pointer"
            >
              {(Object.keys(roleStyle) as Role[]).map(r => (
                <option key={r} value={r}>{roleStyle[r].label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
