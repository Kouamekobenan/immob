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
import { Separator } from '@/components/ui/separator';
import { Building2, Plus, Edit, Trash2, User, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
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
  gerantId:    z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function BailleurProperties() {
  const { currentUser, properties, users, addProperty, updateProperty, deleteProperty } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.bailleurId === currentUser.id);
  const gerants = users.filter(u => u.role === 'GERANT');

  const openCreateModal = () => {
    setSelectedProp(null);
    reset({
      titre: '', description: '', adresse: '', ville: '',
      type: 'APPARTEMENT', loyerDeBase: 0, charges: 0, gerantId: '',
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
      gerantId:    prop.gerantId ?? '',
    });
    setIsOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    const gerantId = data.gerantId || null;
    if (selectedProp) {
      updateProperty({ ...selectedProp, ...data, description: data.description || null, gerantId });
    } else {
      addProperty({
        ...data,
        description: data.description || null,
        bailleurId:  currentUser.id,
        gerantId,
        estOccupe:   false,
      });
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette propriété ? Cette action est irréversible.')) {
      deleteProperty(id);
    }
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-500" />
            Mon Patrimoine Immobilier
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Déclarez vos biens, définissez les loyers et désignez vos gérants mandataires.
          </p>
        </div>
        <Button onClick={openCreateModal} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Ajouter un bien
        </Button>
      </motion.div>

      {/* Grid */}
      {myProperties.length === 0 ? (
        <motion.div variants={stagger.item}>
          <Card className="p-12 text-center text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-sm">Aucun bien enregistré</p>
            <p className="text-xs mt-1 mb-4">Commencez par déclarer votre premier logement.</p>
            <Button onClick={openCreateModal} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Déclarer un bien
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myProperties.map((prop) => {
            const manager = prop.gerantId ? users.find(u => u.id === prop.gerantId) : null;
            return (
              <motion.div key={prop.id} variants={stagger.item}>
                <Card className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="space-y-1">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-extrabold uppercase tracking-wider">
                          {prop.type}
                        </Badge>
                        <h3 className="text-base font-bold text-slate-800 leading-tight">{prop.titre}</h3>
                      </div>
                      <Badge className={`text-[10px] font-bold border shrink-0 gap-1 ${
                        prop.estOccupe
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {prop.estOccupe && <CheckCircle2 className="h-3 w-3" />}
                        {prop.estOccupe ? 'Occupé' : 'Vacant'}
                      </Badge>
                    </div>

                    {prop.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{prop.description}</p>
                    )}

                    <p className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {prop.adresse}, {prop.ville}
                    </p>

                    <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Loyer HC</p>
                        <p className="text-sm font-extrabold text-slate-700">{formatCurrency(prop.loyerDeBase)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Charges</p>
                        <p className="text-sm font-extrabold text-slate-700">{formatCurrency(prop.charges)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Total CC</p>
                        <p className="text-sm font-extrabold text-blue-700">{formatCurrency(prop.loyerDeBase + prop.charges)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manager info */}
                  <div className="bg-slate-50 border-t border-slate-100 px-6 py-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Gérant Mandaté</p>
                    {manager ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {manager.prenom} {manager.nom}
                        </div>
                        {manager.telephone && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {manager.telephone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{manager.email}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 italic font-medium">Aucun gérant assigné</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="bg-white border-t border-slate-100 px-6 py-3 flex items-center justify-end gap-2">
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
        title={selectedProp ? 'Modifier la propriété' : 'Déclarer un nouveau bien'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre de la propriété</Label>
            <Input
              id="titre"
              placeholder="ex: Appartement T3 Centre-Ville"
              {...register('titre')}
              className={errors.titre ? 'border-red-400' : ''}
            />
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
              <Input
                id="adresse"
                placeholder="12 Rue Principale"
                {...register('adresse')}
                className={errors.adresse ? 'border-red-400' : ''}
              />
              {errors.adresse && <p className="text-xs text-red-500">{errors.adresse.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                placeholder="Paris"
                {...register('ville')}
                className={errors.ville ? 'border-red-400' : ''}
              />
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
              <Label htmlFor="loyerDeBase">Loyer HC (€)</Label>
              <Input
                id="loyerDeBase"
                type="number"
                min="0"
                {...register('loyerDeBase', { valueAsNumber: true })}
                className={errors.loyerDeBase ? 'border-red-400' : ''}
              />
              {errors.loyerDeBase && <p className="text-xs text-red-500">{errors.loyerDeBase.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="charges">Charges (€)</Label>
              <Input
                id="charges"
                type="number"
                min="0"
                {...register('charges', { valueAsNumber: true })}
                className={errors.charges ? 'border-red-400' : ''}
              />
              {errors.charges && <p className="text-xs text-red-500">{errors.charges.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gerantId">
              Gérant mandataire <span className="text-slate-400 font-normal">(optionnel)</span>
            </Label>
            <select
              id="gerantId"
              {...register('gerantId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              <option value="">— Aucun gérant pour l&apos;instant —</option>
              {gerants.map(g => (
                <option key={g.id} value={g.id}>{g.prenom} {g.nom} ({g.email})</option>
              ))}
            </select>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit">{selectedProp ? 'Sauvegarder' : 'Enregistrer le bien'}</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
