'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Coins, Plus, Loader2, AlertCircle, ArrowRight, Building2,
  Users2, Info,
} from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { formatFCFA } from '@/lib/utils';
import { cotisationsService } from '@/lib/services/cotisations.service';
import type { GroupeResponse, CotisationStatut } from '@/types/cotisations';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const groupeStatutConfig: Record<CotisationStatut, { label: string; cls: string }> = {
  ACTIF:   { label: 'Actif',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIF: { label: 'Inactif', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  ARCHIVE: { label: 'Archivé', cls: 'bg-slate-100 text-slate-600 border-slate-200'  },
};

const createSchema = z.object({
  nom:              z.string().min(3, 'Nom requis (min 3 caractères)'),
  description:      z.string().optional(),
  montantParMembre: z.number().positive('Montant requis et positif'),
  propertyId:       z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

export default function CotisationsPage() {
  const router = useRouter();
  const { currentUser, properties } = useAppStore();

  const [groupes, setGroupes]       = useState<GroupeResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pageError, setPageError]   = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating]     = useState(false);
  const [createError, setCreateError]   = useState('');

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  useEffect(() => {
    cotisationsService.getAllGroupes()
      .then(setGroupes)
      .catch(err => setPageError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (!currentUser) return null;

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError('');
    createForm.reset();
  };

  const onCreateSubmit = async (data: CreateForm) => {
    setCreateError('');
    setIsCreating(true);
    try {
      const groupe = await cotisationsService.createGroupe({
        nom:              data.nom,
        description:      data.description || undefined,
        montantParMembre: data.montantParMembre,
        propertyId:       data.propertyId  || undefined,
      });
      setGroupes(prev => [groupe, ...prev]);
      handleCloseCreate();
    } catch (err) {
      setCreateError(parseApiError(err));
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-slate-500" />
            Groupes de cotisation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les charges communes entre locataires d&apos;un même immeuble.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Nouveau groupe
        </Button>
      </motion.div>
      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : pageError ? (
        <motion.div variants={stagger.item}>
          <Card className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium">{pageError}</p>
            <Button variant="outline" className="mt-4" onClick={() => { setPageError(''); setLoading(true); cotisationsService.getAllGroupes().then(setGroupes).catch(e => setPageError(parseApiError(e))).finally(() => setLoading(false)); }}>
              Réessayer
            </Button>
          </Card>
        </motion.div>
      ) : groupes.length === 0 ? (
        <motion.div variants={stagger.item}>
          <Card className="p-12 text-center border-dashed">
            <Coins className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">Aucun groupe de cotisation</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Créez votre premier groupe pour gérer les charges communes entre locataires.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-5 gap-1.5">
              <Plus className="h-4 w-4" />
              Créer un groupe
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={stagger.item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groupes.map(g => {
            const stCfg = groupeStatutConfig[g.statut];
            const prop  = properties.find(p => p.id === g.propertyId);
            return (
              <motion.div key={g.id} variants={stagger.item}>
                <Card
                  className="p-5 hover:shadow-md transition-all cursor-pointer group border-slate-200 hover:border-blue-200"
                  onClick={() => router.push(`/dashboard/cotisations/${g.id}`)}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Coins className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge className={`text-[9px] font-bold border shrink-0 ${stCfg.cls}`}>{stCfg.label}</Badge>
                  </div>

                  {/* Name & description */}
                  <h3 className="font-bold text-slate-800 leading-snug mb-1 line-clamp-2">{g.nom}</h3>
                  {g.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-2">{g.description}</p>
                  )}

                  {/* Property badge */}
                  {prop && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{prop.titre}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Cotisation mensuelle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-blue-600">{formatFCFA(g.montantParMembre)}</span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ─── CREATE MODAL ─── */}
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} title="Nouveau groupe de cotisation">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cg-nom">Nom du groupe *</Label>
            <Input
              id="cg-nom"
              placeholder="ex: Charges Résidence Les Palmiers Bât A"
              {...createForm.register('nom')}
              disabled={isCreating}
              className={createForm.formState.errors.nom ? 'border-red-400' : ''}
            />
            {createForm.formState.errors.nom && (
              <p className="text-xs text-red-500">{createForm.formState.errors.nom.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cg-desc">
              Description <span className="text-slate-400 font-normal text-[11px]">(optionnel)</span>
            </Label>
            <Input
              id="cg-desc"
              placeholder="ex: Eau, électricité et entretien des parties communes"
              {...createForm.register('description')}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cg-montant">Montant mensuel par membre (FCFA) *</Label>
            <Input
              id="cg-montant"
              type="number" min="1"
              placeholder="5000"
              {...createForm.register('montantParMembre', { valueAsNumber: true })}
              disabled={isCreating}
              className={createForm.formState.errors.montantParMembre ? 'border-red-400' : ''}
            />
            {createForm.formState.errors.montantParMembre && (
              <p className="text-xs text-red-500">{createForm.formState.errors.montantParMembre.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cg-property">
              Bien associé <span className="text-slate-400 font-normal text-[11px]">(optionnel)</span>
            </Label>
            <select
              id="cg-property"
              {...createForm.register('propertyId')}
              disabled={isCreating}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 disabled:opacity-55"
            >
              <option value="">— Aucun bien associé —</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.titre} — {p.adresse}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Après création, ajoutez les membres du groupe puis générez les avis de contribution mensuelle.
            </p>
          </div>

          {createError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleCloseCreate} disabled={isCreating}>Annuler</Button>
            <Button type="submit" disabled={isCreating} className="gap-1.5">
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCreating ? 'Création...' : 'Créer le groupe'}
            </Button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}
