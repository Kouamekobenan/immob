'use client';

import { useState, useEffect } from 'react';
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
import { FileText, Plus, CheckCircle2, XCircle, Calendar, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const schema = z.object({
  propertyId:  z.string().min(1, 'Bien requis'),
  locataireId: z.string().min(1, 'Locataire requis'),
  dateDebut:   z.string().min(1, 'Date requise'),
  dateFin:     z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function GerantContracts() {
  const { currentUser, contracts, properties, users, addContract, terminateContract, deleteContract } = useAppStore();
  const [isOpen, setIsOpen]             = useState(false);
  const [loyerTotal, setLoyerTotal]     = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError]       = useState('');

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const watchedPropertyId = watch('propertyId');

  useEffect(() => {
    if (watchedPropertyId) {
      const p = properties.find(x => x.id === watchedPropertyId);
      if (p) setLoyerTotal(p.loyerDeBase + p.charges);
    }
  }, [watchedPropertyId, properties]);

  if (!currentUser) return null;

  const myProperties  = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const myContracts   = contracts.filter(c => myPropertyIds.includes(c.propertyId));
  const vacantProps   = myProperties.filter(p => !p.estOccupe);
  const locataires    = users.filter(u => u.role === 'LOCATAIRE');

  const openCreateModal = () => {
    if (vacantProps.length === 0) {
      alert('Aucun bien vacant disponible sous votre gérance.');
      return;
    }
    const firstVacant = vacantProps[0];
    setLoyerTotal(firstVacant.loyerDeBase + firstVacant.charges);
    reset({
      propertyId:  firstVacant.id,
      locataireId: locataires[0]?.id || '',
      dateDebut:   new Date().toISOString().split('T')[0],
      dateFin:     '',
    });
    setIsOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await addContract({
        propertyId:  data.propertyId,
        locataireId: data.locataireId,
        dateDebut:   data.dateDebut,
        dateFin:     data.dateFin || null,
        loyerTotal,
      });
      setIsOpen(false);
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminate = async (id: string) => {
    if (!confirm('Voulez-vous vraiment résilier ce contrat ? Le logement redeviendra vacant.')) return;
    try {
      await terminateContract(id);
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce contrat résilié ?')) return;
    try {
      await deleteContract(id);
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
            <FileText className="h-6 w-6 text-slate-500" />
            Gestion des Contrats de Location
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Signez des baux, reliez des biens vacants à des locataires et suivez la validité des contrats.
          </p>
        </div>
        <Button onClick={openCreateModal} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </motion.div>

      {/* Contracts table */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                  <th className="px-5 py-3.5">Bien Immobilier</th>
                  <th className="px-5 py-3.5">Locataire</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Loyer mensuel</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {myContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Aucun contrat de location enregistré sous votre gérance.
                    </td>
                  </tr>
                ) : (
                  myContracts.map((contract, i) => {
                    const prop      = properties.find(p => p.id === contract.propertyId);
                    const locataire = users.find(u => u.id === contract.locataireId);
                    return (
                      <motion.tr
                        key={contract.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04, duration: 0.18 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          {prop ? (
                            <div>
                              <p className="font-semibold text-slate-800">{prop.titre}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{prop.adresse}, {prop.ville}</p>
                            </div>
                          ) : <span className="text-slate-400 italic text-xs">Bien inconnu</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {locataire ? (
                            <div>
                              <p className="font-bold text-slate-800">{locataire.prenom} {locataire.nom}</p>
                              <p className="text-[10px] text-slate-400">{locataire.email}</p>
                            </div>
                          ) : <span className="text-slate-400 italic text-xs">Inconnu</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              Début : {formatDate(contract.dateDebut)}
                            </p>
                            <p className="flex items-center gap-1 text-slate-400">
                              <Calendar className="h-3.5 w-3.5" />
                              Fin : {contract.dateFin ? formatDate(contract.dateFin) : 'Indéterminée'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-800">
                          {formatCurrency(contract.loyerTotal)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[9px] font-bold border gap-1 ${
                            contract.estActif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {contract.estActif
                              ? <><CheckCircle2 className="h-3 w-3" />Actif</>
                              : <><XCircle className="h-3 w-3" />Résilié</>}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {contract.estActif ? (
                              <Button variant="destructive" size="sm" onClick={() => handleTerminate(contract.id)}>
                                Résilier
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(contract.id)}
                                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                              </Button>
                            )}
                          </div>
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

      {/* New contract modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Établir un nouveau contrat de bail">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="propertyId">1. Bien vacant à louer</Label>
            <select
              id="propertyId"
              {...register('propertyId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              {vacantProps.map(p => (
                <option key={p.id} value={p.id}>
                  {p.titre} ({p.ville} · Loyer HC : {formatCurrency(p.loyerDeBase)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="locataireId">2. Locataire désigné</Label>
            <select
              id="locataireId"
              {...register('locataireId')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              {locataires.map(l => (
                <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebut">Date d&apos;entrée en vigueur</Label>
              <Input id="dateDebut" type="date" {...register('dateDebut')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFin">Date d&apos;échéance <span className="text-slate-400 font-normal">(optionnelle)</span></Label>
              <Input id="dateFin" type="date" {...register('dateFin')} />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Loyer Total Mensuel (Calculé)</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Loyer de base + charges du bien sélectionné.</p>
            <p className="text-lg font-black text-blue-800 mt-2">{formatCurrency(loyerTotal)} / mois</p>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Signer le contrat
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
