'use client';

import { useState } from 'react';
import { parseApiError } from '@/lib/api';
import { Loader2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Building2, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Property, PropertyType } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' as const } } },
};

const schema = z.object({
  titre:       z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  adresse:     z.string().min(1, 'Adresse requise'),
  ville:       z.string().min(1, 'Ville requise'),
  type:        z.enum(['APPARTEMENT', 'STUDIO', 'VILLA', 'MAGASIN', 'AUTRE']),
  loyerDeBase: z.number().min(0, 'Montant invalide'),
  charges:     z.number().min(0, 'Montant invalide'),
  bailleurId:  z.string().min(1, 'Bailleur requis'),
});
type FormValues = z.infer<typeof schema>;

export default function GerantProperties() {
  const { currentUser, properties, users, addProperty, updateProperty, deleteProperty } = useAppStore();
  const [isOpen, setIsOpen]             = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError]       = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.gerantId === currentUser.id);
  const bailleurs = users.filter(u => u.role === 'BAILLEUR');

  const openCreateModal = () => {
    setSelectedProp(null);
    reset({
      titre: '', description: '', adresse: '', ville: '',
      type: 'APPARTEMENT', loyerDeBase: 0, charges: 0,
      bailleurId: bailleurs[0]?.id || '',
    });
    setIsOpen(true);
  };

  const openEditModal = (prop: Property) => {
    setSelectedProp(prop);
    reset({
      titre:       prop.titre,
      description: prop.description ?? '',
      adresse:     prop.adresse,
      ville:       prop.ville,
      type:        prop.type,
      loyerDeBase: prop.loyerDeBase,
      charges:     prop.charges,
      bailleurId:  prop.bailleurId,
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      if (selectedProp) {
        await updateProperty({
          ...selectedProp,
          ...data,
          description: data.description || null,
          gerantId: currentUser.id,
        });
      } else {
        await addProperty({
          ...data,
          description: data.description || null,
          estOccupe: false,
          gerantId: currentUser.id,
        });
      }
      setIsOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette propriété ?')) return;
    try {
      await deleteProperty(id);
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-500" />
            Gestion des Propriétés
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Création, modification et suppression des logements sous votre mandat de gérance.
          </p>
        </div>
        <Button onClick={openCreateModal} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Ajouter un bien
        </Button>
      </motion.div>

      {/* Properties grid */}
      {myProperties.length === 0 ? (
        <motion.div variants={stagger.item}>
          <Card className="p-10 text-center text-slate-400 font-medium">
            <Building2 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            Aucun bien immobilier sous votre gérance.
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {myProperties.map((prop) => {
            const owner = users.find(u => u.id === prop.bailleurId);
            return (
              <motion.div key={prop.id} variants={stagger.item}>
                <Card className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="space-y-1">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold">{prop.type}</Badge>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">{prop.titre}</h3>
                      </div>
                      <Badge className={`text-[9px] font-bold border shrink-0 ${
                        prop.estOccupe
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {prop.estOccupe ? 'Occupé' : 'Vacant'}
                      </Badge>
                    </div>

                    {prop.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{prop.description}</p>
                    )}

                    <p className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-4">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {prop.adresse}, {prop.ville}
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Loyer de base</p>
                        <p className="text-sm font-extrabold text-slate-700">{formatCurrency(prop.loyerDeBase)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Charges</p>
                        <p className="text-sm font-extrabold text-slate-700">{formatCurrency(prop.charges)}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Bailleur : <span className="font-bold text-slate-700">{owner ? `${owner.prenom} ${owner.nom}` : '—'}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(prop)} className="gap-1">
                      <Edit className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(prop.id)} className="gap-1">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedProp ? 'Modifier le bien immobilier' : 'Ajouter une nouvelle propriété'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre de la propriété</Label>
            <Input id="titre" placeholder="ex: Appartement T2 Centre Ville" {...register('titre')} className={errors.titre ? 'border-red-400' : ''} />
            {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-slate-400 font-normal">(optionnelle)</span></Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Décrivez brièvement le logement..."
              {...register('description')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" placeholder="12 Rue Principale" {...register('adresse')} className={errors.adresse ? 'border-red-400' : ''} />
              {errors.adresse && <p className="text-xs text-red-500">{errors.adresse.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" placeholder="Paris" {...register('ville')} className={errors.ville ? 'border-red-400' : ''} />
              {errors.ville && <p className="text-xs text-red-500">{errors.ville.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
              >
                {(['APPARTEMENT', 'STUDIO', 'VILLA', 'MAGASIN', 'AUTRE'] as PropertyType[]).map(t => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loyerDeBase">Loyer (€)</Label>
              <Input id="loyerDeBase" type="number" min="0" {...register('loyerDeBase', { valueAsNumber: true })} className={errors.loyerDeBase ? 'border-red-400' : ''} />
              {errors.loyerDeBase && <p className="text-xs text-red-500">{errors.loyerDeBase.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="charges">Charges (€)</Label>
              <Input id="charges" type="number" min="0" {...register('charges', { valueAsNumber: true })} className={errors.charges ? 'border-red-400' : ''} />
              {errors.charges && <p className="text-xs text-red-500">{errors.charges.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bailleurId">Propriétaire (Bailleur)</Label>
            <select
              id="bailleurId"
              {...register('bailleurId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              {bailleurs.map(b => (
                <option key={b.id} value={b.id}>{b.prenom} {b.nom} ({b.email})</option>
              ))}
            </select>
            {errors.bailleurId && <p className="text-xs text-red-500">{errors.bailleurId.message}</p>}
          </div>

          <Separator />

          {formError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {selectedProp ? 'Sauvegarder' : 'Créer le bien'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
