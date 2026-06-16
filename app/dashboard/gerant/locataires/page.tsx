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
import {
  Users, Search, Plus, Eye, EyeOff, Loader2,
  Building2, FileText, CreditCard, Phone, Mail
} from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const payStatusConfig: Record<string, { label: string; cls: string }> = {
  PAYE:       { label: 'Payé',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJETE:     { label: 'Rejeté',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  ECHOUE:     { label: 'Échoué',     cls: 'bg-red-50 text-red-700 border-red-200' },
};

const createSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  nom: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 caractères'),
});
type CreateForm = z.infer<typeof createSchema>;

export default function GerantLocataires() {
  const { currentUser, users, properties, contracts, payments, createUser } = useAppStore();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.gerantId === currentUser.id);
  const myContracts = contracts.filter(c => myProperties.some(p => p.id === c.propertyId));

  const rows = myContracts.map(contract => {
    const locataire = users.find(u => u.id === contract.locataireId);
    const prop = myProperties.find(p => p.id === contract.propertyId);
    const lastPayment = payments
      .filter(p => p.locataireId === contract.locataireId && p.contractId === contract.id)
      .sort((a, b) => b.periode.localeCompare(a.periode))[0];
    return { contract, locataire, prop, lastPayment };
  }).filter(r => r.locataire);

  const filtered = rows.filter(({ locataire }) => {
    if (!locataire) return false;
    const q = search.toLowerCase();
    return !q || `${locataire.prenom} ${locataire.nom} ${locataire.email}`.toLowerCase().includes(q);
  });

  const onCreateSubmit = async (data: CreateForm) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await createUser({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        password: data.password,
        telephone: data.telephone || undefined,
        role: 'LOCATAIRE',
      });
      reset();
      setIsCreateOpen(false);
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
            Mes Locataires
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {rows.length} locataire{rows.length > 1 ? 's' : ''} sur vos {myProperties.length} bien{myProperties.length > 1 ? 's' : ''} gérés.
          </p>
        </div>
        <Button onClick={() => { setFormError(''); reset(); setIsCreateOpen(true); }} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Créer un locataire
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, prénom ou e-mail…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white"
            />
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
                  <th className="px-5 py-3.5">Locataire</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Bien</th>
                  <th className="px-5 py-3.5">Contrat</th>
                  <th className="px-5 py-3.5">Dernier paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                      {search ? 'Aucun locataire trouvé.' : 'Aucun locataire associé à vos biens.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(({ contract, locataire, prop, lastPayment }, i) => {
                    const payCfg = lastPayment
                      ? (payStatusConfig[lastPayment.statut] ?? { label: lastPayment.statut, cls: 'bg-slate-100 text-slate-600 border-slate-200' })
                      : null;
                    return (
                      <motion.tr
                        key={contract.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Locataire */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                              {locataire!.prenom[0]}{locataire!.nom[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{locataire!.prenom} {locataire!.nom}</p>
                              <Badge className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 border mt-0.5">LOCATAIRE</Badge>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <p className="text-xs text-slate-600 flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              {locataire!.email}
                            </p>
                            {locataire!.telephone && (
                              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Phone className="h-3 w-3 shrink-0" />
                                {locataire!.telephone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Bien */}
                        <td className="px-5 py-3.5">
                          {prop ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-slate-700">{prop.titre}</p>
                                <p className="text-[10px] text-slate-400">{prop.ville}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Contrat */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <div>
                              <Badge className={`text-[9px] font-bold border ${contract.estActif ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {contract.estActif ? 'Actif' : 'Terminé'}
                              </Badge>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(contract.dateDebut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Dernier paiement */}
                        <td className="px-5 py-3.5">
                          {lastPayment && payCfg ? (
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-600">{lastPayment.periode}</p>
                                <Badge className={`text-[9px] font-bold border mt-0.5 ${payCfg.cls}`}>
                                  {payCfg.label}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">Aucun</span>
                          )}
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

      {/* Create Locataire Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Créer un compte locataire">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <p className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            Un compte <strong>Locataire</strong> sera créé. Vous pourrez ensuite lui associer un contrat depuis la section <em>Contrats Locatifs</em>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-prenom">Prénom</Label>
              <Input id="c-prenom" placeholder="Jean" {...register('prenom')} disabled={isSubmitting} />
              {errors.prenom && <p className="text-xs text-red-600">{errors.prenom.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-nom">Nom</Label>
              <Input id="c-nom" placeholder="Dupont" {...register('nom')} disabled={isSubmitting} />
              {errors.nom && <p className="text-xs text-red-600">{errors.nom.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-email">Adresse e-mail</Label>
            <Input id="c-email" type="email" placeholder="jean@example.com" {...register('email')} disabled={isSubmitting} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-tel">
              Téléphone <span className="text-slate-400 font-normal text-[11px]">(optionnel)</span>
            </Label>
            <Input id="c-tel" type="tel" placeholder="+225 07 00 00 00 00" {...register('telephone')} disabled={isSubmitting} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-pwd">Mot de passe temporaire</Label>
            <div className="relative">
              <Input
                id="c-pwd"
                type={showPwd ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                {...register('password')}
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
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
