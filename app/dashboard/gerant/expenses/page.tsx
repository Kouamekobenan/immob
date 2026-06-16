'use client';

import { useState, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
  Wallet, Plus, Loader2, AlertCircle, CheckCircle,
  Upload, Eye, Trash2, Ban, Info,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { parseApiError } from '@/lib/api';
import type { Expense, ExpenseStatus, ExpenseCategory } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' as const } } },
};

const CATEGORIE_CONFIG: Record<ExpenseCategory, { label: string; cls: string }> = {
  PRESTATAIRE:      { label: 'Prestataire',       cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  PERSONNEL:        { label: 'Personnel',         cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  FOURNITURES:      { label: 'Fournitures',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  CHARGES_COMMUNES: { label: 'Charges communes',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  ASSURANCE:        { label: 'Assurance',         cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  TAXE_IMPOT:       { label: 'Taxe / Impôt',      cls: 'bg-red-50 text-red-700 border-red-200' },
  AUTRE:            { label: 'Autre',             cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const STATUT_CONFIG: Record<ExpenseStatus, { label: string; cls: string; strip: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200',      strip: 'bg-amber-400' },
  PAYEE:      { label: 'Payée',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', strip: 'bg-emerald-500' },
  ANNULEE:    { label: 'Annulée',    cls: 'bg-slate-100 text-slate-500 border-slate-200',      strip: 'bg-slate-300' },
};

function formatMontant(v: number) {
  return `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`;
}

const createSchema = z.object({
  titre:           z.string().min(3, 'Min. 3 caractères').max(150),
  description:     z.string().max(1000).optional(),
  montant:         z.coerce.number().positive('Doit être positif').max(100_000_000, 'Dépasse le plafond'),
  date:            z.string().min(1, 'Date requise'),
  categorie:       z.enum(['PRESTATAIRE', 'PERSONNEL', 'FOURNITURES', 'CHARGES_COMMUNES', 'ASSURANCE', 'TAXE_IMPOT', 'AUTRE']),
  beneficiaireNom: z.string().min(1, 'Bénéficiaire requis').max(150),
  beneficiaireId:  z.string().optional(),
  propertyId:      z.string().optional(),
  ticketId:        z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const paySchema = z.object({
  referenceId: z.string().max(100).optional(),
});
type PayForm = z.infer<typeof paySchema>;

export default function GerantExpenses() {
  const {
    currentUser, expenses, properties, users, tickets,
    addExpense, payExpense, cancelExpense, deleteExpense,
  } = useAppStore();

  const [statutFilter,    setStatutFilter]    = useState<ExpenseStatus | 'ALL'>('ALL');
  const [categorieFilter, setCategorieFilter] = useState<ExpenseCategory | 'ALL'>('ALL');

  const [isCreateOpen,  setIsCreateOpen]  = useState(false);
  const [isCreating,    setIsCreating]    = useState(false);
  const [createError,   setCreateError]   = useState('');
  const [createFile,    setCreateFile]    = useState<File | null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [isPaying,      setIsPaying]      = useState(false);
  const [payError,      setPayError]      = useState('');
  const [payFile,       setPayFile]       = useState<File | null>(null);
  const payFileRef = useRef<HTMLInputElement>(null);

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as Resolver<CreateForm>,
    defaultValues: { categorie: 'PRESTATAIRE', date: new Date().toISOString().split('T')[0] },
  });
  const payForm = useForm<PayForm>({ resolver: zodResolver(paySchema) });

  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const prestataires = users.filter(u => u.role === 'PRESTATAIRE');
  const myTickets = tickets.filter(t => myPropertyIds.includes(t.propertyId));

  const filteredExpenses = expenses
    .filter(e => (statutFilter === 'ALL' || e.statut === statutFilter) && (categorieFilter === 'ALL' || e.categorie === categorieFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPayees    = expenses.filter(e => e.statut === 'PAYEE').reduce((s, e) => s + e.montant, 0);
  const totalEnAttente = expenses.filter(e => e.statut === 'EN_ATTENTE').reduce((s, e) => s + e.montant, 0);
  const countAnnulees  = expenses.filter(e => e.statut === 'ANNULEE').length;

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError('');
    setCreateFile(null);
    createForm.reset({ categorie: 'PRESTATAIRE', date: new Date().toISOString().split('T')[0] });
    if (createFileRef.current) createFileRef.current.value = '';
  };

  const onCreateSubmit = async (data: CreateForm) => {
    setCreateError('');
    setIsCreating(true);
    try {
      await addExpense(
        {
          titre:           data.titre,
          description:     data.description || undefined,
          montant:         data.montant,
          date:            new Date(data.date).toISOString(),
          categorie:       data.categorie,
          beneficiaireNom: data.beneficiaireNom,
          payeurId:        currentUser.id,
          beneficiaireId:  data.beneficiaireId || undefined,
          propertyId:      data.propertyId || undefined,
          ticketId:        data.ticketId || undefined,
        },
        createFile ?? undefined,
      );
      handleCloseCreate();
    } catch (err) {
      setCreateError(parseApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenPay = (expense: Expense) => {
    setPayingExpense(expense);
    setPayError('');
    setPayFile(null);
    payForm.reset();
  };

  const handleClosePay = () => {
    setPayingExpense(null);
    setPayError('');
    setPayFile(null);
    if (payFileRef.current) payFileRef.current.value = '';
    payForm.reset();
  };

  const onPaySubmit = async (data: PayForm) => {
    if (!payingExpense) return;
    setPayError('');
    setIsPaying(true);
    try {
      await payExpense(payingExpense.id, data.referenceId || undefined, payFile ?? undefined);
      handleClosePay();
    } catch (err) {
      setPayError(parseApiError(err));
    } finally {
      setIsPaying(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try { await cancelExpense(id); } catch { /* noop */ } finally { setCancellingId(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deleteExpense(id); } catch { /* noop */ } finally { setDeletingId(null); }
  };

  const catEntries = Object.entries(CATEGORIE_CONFIG) as [ExpenseCategory, typeof CATEGORIE_CONFIG[ExpenseCategory]][];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-slate-500" />
            Dépenses & Comptabilité
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos dépenses opérationnelles et confirmez les paiements effectués.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Nouvelle dépense
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">Payées</p>
          <p className="text-lg font-extrabold text-emerald-700">{formatMontant(totalPayees)}</p>
          <p className="text-xs text-slate-400">{expenses.filter(e => e.statut === 'PAYEE').length} dépense{expenses.filter(e => e.statut === 'PAYEE').length !== 1 ? 's' : ''}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">En attente</p>
          <p className="text-lg font-extrabold text-amber-600">{formatMontant(totalEnAttente)}</p>
          <p className="text-xs text-slate-400">{expenses.filter(e => e.statut === 'EN_ATTENTE').length} en cours</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">Annulées</p>
          <p className="text-lg font-extrabold text-slate-500">{countAnnulees}</p>
          <p className="text-xs text-slate-400">dépense{countAnnulees !== 1 ? 's' : ''}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total enregistrées</p>
          <p className="text-lg font-extrabold text-slate-700">{expenses.length}</p>
          <p className="text-xs text-slate-400">toutes périodes</p>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtrer :</p>
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value as ExpenseStatus | 'ALL')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYEE">Payée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
            <select
              value={categorieFilter}
              onChange={e => setCategorieFilter(e.target.value as ExpenseCategory | 'ALL')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              <option value="ALL">Toutes les catégories</option>
              {catEntries.map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </select>
            <span className="text-xs text-slate-400 font-medium">
              {filteredExpenses.length} résultat{filteredExpenses.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* List */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <motion.div variants={stagger.item}>
            <Card className="p-10 text-center text-slate-400 font-medium">
              <Wallet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Aucune dépense sous ce filtre.
            </Card>
          </motion.div>
        ) : filteredExpenses.map(expense => {
          const stCfg  = STATUT_CONFIG[expense.statut];
          const catCfg = CATEGORIE_CONFIG[expense.categorie];
          const linkedProp = expense.propertyId ? properties.find(p => p.id === expense.propertyId) : null;
          const isCancelling = cancellingId === expense.id;
          const isDeleting   = deletingId   === expense.id;

          return (
            <motion.div key={expense.id} variants={stagger.item}>
              <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-sm transition-shadow">
                <div className={`w-full sm:w-1 h-1 sm:h-auto shrink-0 ${stCfg.strip}`} />
                <div className="flex-1 p-5">
                  {/* Header row */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">{expense.titre}</h3>
                        <Badge className={`text-[9px] font-bold border ${catCfg.cls}`}>{catCfg.label}</Badge>
                        <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {expense.beneficiaireNom}
                        {linkedProp && <span className="text-slate-400"> • {linkedProp.titre}</span>}
                        <span className="text-slate-400"> • {formatDate(expense.date)}</span>
                      </p>
                      {expense.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{expense.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-extrabold text-slate-800">{formatMontant(expense.montant)}</p>
                      {expense.referenceId && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Réf : {expense.referenceId}</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {expense.justificatifUrl ? (
                        <a
                          href={expense.justificatifUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir justificatif
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Aucun justificatif</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {expense.statut === 'EN_ATTENTE' && (
                        <>
                          <Button size="sm" onClick={() => handleOpenPay(expense)} className="gap-1.5 font-bold text-xs">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Payer
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => handleCancel(expense.id)} disabled={isCancelling}
                            className="gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50 font-semibold text-xs"
                          >
                            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                            Annuler
                          </Button>
                        </>
                      )}
                      {(expense.statut === 'EN_ATTENTE' || expense.statut === 'ANNULEE') && (
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleDelete(expense.id)} disabled={isDeleting}
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 font-semibold text-xs"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Supprimer
                        </Button>
                      )}
                      {expense.statut === 'PAYEE' && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Paiement confirmé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─── CREATE MODAL ─── */}
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} title="Enregistrer une nouvelle dépense">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">

          <div className="space-y-1.5">
            <Label htmlFor="c-titre">Intitulé *</Label>
            <Input id="c-titre" placeholder="ex: Réparation plomberie — Juin 2026"
              {...createForm.register('titre')} disabled={isCreating}
              className={createForm.formState.errors.titre ? 'border-red-400' : ''} />
            {createForm.formState.errors.titre && <p className="text-xs text-red-500">{createForm.formState.errors.titre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-montant">Montant (FCFA) *</Label>
              <Input id="c-montant" type="number" min="1" placeholder="45000"
                {...createForm.register('montant')} disabled={isCreating}
                className={createForm.formState.errors.montant ? 'border-red-400' : ''} />
              {createForm.formState.errors.montant && <p className="text-xs text-red-500">{createForm.formState.errors.montant.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-date">Date *</Label>
              <Input id="c-date" type="date"
                {...createForm.register('date')} disabled={isCreating}
                className={createForm.formState.errors.date ? 'border-red-400' : ''} />
              {createForm.formState.errors.date && <p className="text-xs text-red-500">{createForm.formState.errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-categorie">Catégorie *</Label>
            <select id="c-categorie" {...createForm.register('categorie')} disabled={isCreating}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700 disabled:opacity-55">
              {catEntries.map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c-benNom">Nom du bénéficiaire *</Label>
            <Input id="c-benNom" placeholder="ex: Diallo Plomberie SARL"
              {...createForm.register('beneficiaireNom')} disabled={isCreating}
              className={createForm.formState.errors.beneficiaireNom ? 'border-red-400' : ''} />
            {createForm.formState.errors.beneficiaireNom && <p className="text-xs text-red-500">{createForm.formState.errors.beneficiaireNom.message}</p>}
          </div>

          {prestataires.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="c-benId">Prestataire plateforme (optionnel)</Label>
              <select id="c-benId" {...createForm.register('beneficiaireId')} disabled={isCreating}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700 disabled:opacity-55">
                <option value="">— Aucun —</option>
                {prestataires.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
              </select>
            </div>
          )}

          {myProperties.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="c-prop">Bien concerné (optionnel)</Label>
              <select id="c-prop" {...createForm.register('propertyId')} disabled={isCreating}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700 disabled:opacity-55">
                <option value="">— Aucun —</option>
                {myProperties.map(p => <option key={p.id} value={p.id}>{p.titre} — {p.adresse}</option>)}
              </select>
            </div>
          )}

          {myTickets.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="c-ticket">Ticket lié (optionnel)</Label>
              <select id="c-ticket" {...createForm.register('ticketId')} disabled={isCreating}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700 disabled:opacity-55">
                <option value="">— Aucun —</option>
                {myTickets.map(t => <option key={t.id} value={t.id}>{t.titre} ({t.statut})</option>)}
              </select>
              <p className="text-[10px] text-slate-400">Un ticket ne peut être lié qu&apos;à une seule dépense.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="c-desc">Description (optionnel)</Label>
            <textarea id="c-desc" rows={2} placeholder="Détails supplémentaires..."
              {...createForm.register('description')} disabled={isCreating}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-55 resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label>Justificatif (optionnel)</Label>
            <label className={`w-full p-3 border border-dashed rounded-xl text-xs font-semibold text-slate-500 flex items-center gap-2 transition-colors ${isCreating ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 hover:border-slate-400 cursor-pointer'}`}>
              <Upload className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{createFile ? createFile.name : 'Joindre une facture ou un reçu'}</span>
              <input ref={createFileRef} type="file" accept="image/*,.pdf" className="hidden"
                disabled={isCreating} onChange={e => setCreateFile(e.target.files?.[0] ?? null)} />
            </label>
            {createFile && (
              <button type="button" onClick={() => { setCreateFile(null); if (createFileRef.current) createFileRef.current.value = ''; }}
                className="text-[10px] font-bold text-red-600 hover:underline">
                Supprimer le fichier
              </button>
            )}
          </div>

          {createError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{createError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleCloseCreate} disabled={isCreating}>Annuler</Button>
            <Button type="submit" disabled={isCreating} className="gap-1.5">
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCreating ? 'Enregistrement...' : 'Enregistrer la dépense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── PAY MODAL ─── */}
      <Modal isOpen={!!payingExpense} onClose={handleClosePay} title="Confirmer le paiement">
        <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-4">
          {payingExpense && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{payingExpense.titre}</span>
                <span className="font-extrabold text-slate-700">{formatMontant(payingExpense.montant)}</span>
              </div>
              <p className="text-slate-500">Bénéficiaire : <strong>{payingExpense.beneficiaireNom}</strong></p>
            </div>
          )}
          <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Le statut passera à <strong>PAYÉE</strong>. Cette action est irréversible.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-ref">Référence de paiement (optionnel)</Label>
            <Input id="p-ref" placeholder="ex: VIR-2026-06-0042"
              {...payForm.register('referenceId')} disabled={isPaying} />
          </div>

          <div className="space-y-1.5">
            <Label>Justificatif (optionnel)</Label>
            <label className={`w-full p-3 border border-dashed rounded-xl text-xs font-semibold text-slate-500 flex items-center gap-2 transition-colors ${isPaying ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50 hover:border-slate-400 cursor-pointer'}`}>
              <Upload className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{payFile ? payFile.name : 'Facture ou reçu de paiement'}</span>
              <input ref={payFileRef} type="file" accept="image/*,.pdf" className="hidden"
                disabled={isPaying} onChange={e => setPayFile(e.target.files?.[0] ?? null)} />
            </label>
            {payFile && (
              <button type="button" onClick={() => { setPayFile(null); if (payFileRef.current) payFileRef.current.value = ''; }}
                className="text-[10px] font-bold text-red-600 hover:underline">
                Supprimer le fichier
              </button>
            )}
          </div>

          {payError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{payError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleClosePay} disabled={isPaying}>Annuler</Button>
            <Button type="submit" disabled={isPaying} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPaying && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPaying ? 'Confirmation...' : 'Confirmer le paiement'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
