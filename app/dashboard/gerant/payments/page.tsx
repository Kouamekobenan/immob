'use client';

import { useState } from 'react';
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
  CreditCard, CheckCircle, FileText, Printer, Plus, Loader2,
  AlertCircle, XCircle, Trash2, Info,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { parseApiError } from '@/lib/api';
import type { Payment, PaymentStatus } from '@/types/prisma';
import { paymentService } from '@/lib/services/payment.service';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const payStatusConfig: Record<PaymentStatus, { label: string; cls: string }> = {
  PAYE:       { label: 'Payé',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ECHOUE:     { label: 'Échoué',     cls: 'bg-red-50 text-red-700 border-red-200' },
  REJETE:     { label: 'Rejeté',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function formatPeriode(periode: string): string {
  const [mm, yyyy] = periode.split('-');
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${mois[parseInt(mm) - 1]} ${yyyy}`;
}

function formatMontant(v: number) {
  return `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`;
}

const createSchema = z.object({
  contractId: z.string().min(1, 'Contrat requis'),
  montant:    z.coerce.number().positive('Montant invalide').max(100_000_000, 'Dépasse le plafond'),
  periode:    z.string().regex(/^\d{2}-\d{4}$/, 'Format MM-YYYY (ex: 06-2026)'),
});
type CreateForm = z.infer<typeof createSchema>;

const confirmSchema = z.object({
  datePaiement: z.string().min(1, 'Date requise'),
  referenceId:  z.string().max(100).optional(),
});
type ConfirmForm = z.infer<typeof confirmSchema>;

export default function GerantPayments() {
  const {
    currentUser, payments, properties, contracts, users,
    createPayment, confirmPayment, rejectPayment, deletePayment,
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [activeReceipt, setActiveReceipt]   = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen]   = useState(false);

  const [isCreateOpen,  setIsCreateOpen]  = useState(false);
  const [isCreating,    setIsCreating]    = useState(false);
  const [createError,   setCreateError]   = useState('');

  const [confirmingPayment, setConfirmingPayment] = useState<Payment | null>(null);
  const [isConfirming,      setIsConfirming]      = useState(false);
  const [confirmError,      setConfirmError]      = useState('');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema) as Resolver<CreateForm>,
    defaultValues: { periode: paymentService.getCurrentPeriode() },
  });
  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { datePaiement: new Date().toISOString().split('T')[0] },
  });

  if (!currentUser) return null;

  const myProperties  = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const myContracts   = contracts.filter(c => myPropertyIds.includes(c.propertyId) && c.estActif);
  const myContractIds = [...contracts.filter(c => myPropertyIds.includes(c.propertyId)).map(c => c.id)];
  const myPayments    = payments.filter(p => myContractIds.includes(p.contractId));

  const filteredPayments = myPayments
    .filter(p => statusFilter === 'ALL' || p.statut === statusFilter)
    .sort((a, b) => b.periode.localeCompare(a.periode));

  const pendingCount  = myPayments.filter(p => p.statut === 'EN_ATTENTE').length;
  const encaisséTotal = myPayments.filter(p => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);

  const receiptContract = activeReceipt ? contracts.find(c => c.id === activeReceipt.contractId) : null;
  const receiptProp     = receiptContract ? properties.find(p => p.id === receiptContract.propertyId) : null;
  const receiptTenant   = activeReceipt ? users.find(u => u.id === activeReceipt.locataireId) : null;
  const receiptBailleur = receiptProp ? users.find(u => u.id === receiptProp.bailleurId) : null;

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setCreateError('');
    createForm.reset({ periode: paymentService.getCurrentPeriode() });
  };

  const onCreateSubmit = async (data: CreateForm) => {
    setCreateError('');
    setIsCreating(true);
    try {
      const contract = myContracts.find(c => c.id === data.contractId)!;
      await createPayment({
        montant:     data.montant,
        periode:     data.periode,
        contractId:  data.contractId,
        locataireId: contract.locataireId,
      });
      handleCloseCreate();
    } catch (err) {
      setCreateError(parseApiError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenConfirm = (payment: Payment) => {
    setConfirmingPayment(payment);
    setConfirmError('');
    confirmForm.reset({ datePaiement: new Date().toISOString().split('T')[0] });
  };

  const handleCloseConfirm = () => {
    setConfirmingPayment(null);
    setConfirmError('');
    confirmForm.reset();
  };

  const onConfirmSubmit = async (data: ConfirmForm) => {
    if (!confirmingPayment) return;
    setConfirmError('');
    setIsConfirming(true);
    try {
      await confirmPayment(
        confirmingPayment.id,
        new Date(data.datePaiement).toISOString(),
        data.referenceId || undefined,
      );
      handleCloseConfirm();
    } catch (err) {
      setConfirmError(parseApiError(err));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async (id: string) => {
    setRejectingId(id);
    try { await rejectPayment(id); } catch { /* noop */ } finally { setRejectingId(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await deletePayment(id); } catch { /* noop */ } finally { setDeletingId(null); }
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-slate-500" />
            Suivi &amp; Encaissement des Loyers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Générez les avis de loyer et confirmez les encaissements reçus.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Générer un avis
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {([
          { label: 'En attente', value: String(pendingCount),        cls: 'text-amber-600',   border: 'border-amber-100' },
          { label: 'Encaissé',   value: formatMontant(encaisséTotal), cls: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total',      value: String(myPayments.length),   cls: 'text-slate-500',   border: 'border-slate-200' },
        ] as const).map(({ label, value, cls, border }) => (
          <Card key={label} className={`p-4 border ${border}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-extrabold mt-0.5 leading-none ${cls}`}>{value}</p>
          </Card>
        ))}
      </motion.div>

      {/* Filter */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut :</p>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYE">Payé</option>
              <option value="REJETE">Rejeté</option>
              <option value="ECHOUE">Échoué</option>
            </select>
            <span className="text-xs text-slate-400">{filteredPayments.length} résultat{filteredPayments.length !== 1 ? 's' : ''}</span>
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
                  <th className="px-5 py-3.5">Locataire &amp; Logement</th>
                  <th className="px-5 py-3.5">Période</th>
                  <th className="px-5 py-3.5">Montant</th>
                  <th className="px-5 py-3.5">Référence</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Aucune transaction pour cette sélection.
                    </td>
                  </tr>
                ) : filteredPayments.map((pay, i) => {
                  const payContract  = contracts.find(c => c.id === pay.contractId);
                  const prop         = payContract ? properties.find(p => p.id === payContract.propertyId) : null;
                  const tenant       = users.find(u => u.id === pay.locataireId);
                  const stCfg        = payStatusConfig[pay.statut];
                  const isRejecting  = rejectingId === pay.id;
                  const isDeleting   = deletingId  === pay.id;
                  return (
                    <motion.tr
                      key={pay.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03, duration: 0.18 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">
                          {tenant ? `${tenant.prenom} ${tenant.nom}` : '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{prop?.titre || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{formatPeriode(pay.periode)}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-800">{formatMontant(pay.montant)}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {pay.referenceId || <span className="italic text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {pay.statut === 'EN_ATTENTE' && (
                            <>
                              <Button size="sm" onClick={() => handleOpenConfirm(pay)} className="gap-1 font-bold text-xs">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Confirmer
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleReject(pay.id)} disabled={isRejecting}
                                className="gap-1 text-amber-700 border-amber-200 hover:bg-amber-50 font-semibold text-xs"
                              >
                                {isRejecting
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <XCircle className="h-3.5 w-3.5" />}
                                Rejeter
                              </Button>
                            </>
                          )}
                          {pay.statut === 'PAYE' && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => { setActiveReceipt(pay); setIsReceiptOpen(true); }}
                              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Quittance
                            </Button>
                          )}
                          {(pay.statut === 'EN_ATTENTE' || pay.statut === 'ECHOUE') && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleDelete(pay.id)} disabled={isDeleting}
                              className="gap-1 text-red-600 border-red-200 hover:bg-red-50 font-semibold text-xs"
                            >
                              {isDeleting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {pay.statut === 'REJETE' && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* ─── CREATE MODAL ─── */}
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} title="Générer un avis de loyer">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cr-contract">Contrat actif *</Label>
            <select
              id="cr-contract"
              {...createForm.register('contractId')}
              disabled={isCreating}
              onChange={e => {
                createForm.setValue('contractId', e.target.value);
                const contract = myContracts.find(c => c.id === e.target.value);
                if (contract) createForm.setValue('montant', contract.loyerTotal);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700 disabled:opacity-55"
            >
              <option value="">— Sélectionner un contrat —</option>
              {myContracts.map(c => {
                const prop   = properties.find(p => p.id === c.propertyId);
                const tenant = users.find(u => u.id === c.locataireId);
                return (
                  <option key={c.id} value={c.id}>
                    {prop?.titre} — {tenant ? `${tenant.prenom} ${tenant.nom}` : '?'} ({c.loyerTotal.toLocaleString('fr-FR')} FCFA)
                  </option>
                );
              })}
            </select>
            {createForm.formState.errors.contractId && (
              <p className="text-xs text-red-500">{createForm.formState.errors.contractId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cr-montant">Montant (FCFA) *</Label>
              <Input
                id="cr-montant" type="number" min="1" placeholder="150000"
                {...createForm.register('montant')} disabled={isCreating}
                className={createForm.formState.errors.montant ? 'border-red-400' : ''}
              />
              {createForm.formState.errors.montant && (
                <p className="text-xs text-red-500">{createForm.formState.errors.montant.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cr-periode">Période *</Label>
              <Input
                id="cr-periode" placeholder="06-2026"
                {...createForm.register('periode')} disabled={isCreating}
                className={createForm.formState.errors.periode ? 'border-red-400' : ''}
              />
              {createForm.formState.errors.periode && (
                <p className="text-xs text-red-500">{createForm.formState.errors.periode.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">Le locataire sera notifié. Un seul avis par période et par contrat.</p>
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
              {isCreating ? 'Génération...' : "Générer l'avis"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── CONFIRM MODAL ─── */}
      <Modal isOpen={!!confirmingPayment} onClose={handleCloseConfirm} title="Confirmer l'encaissement">
        <form onSubmit={confirmForm.handleSubmit(onConfirmSubmit)} className="space-y-4">
          {confirmingPayment && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  {(() => {
                    const t = users.find(u => u.id === confirmingPayment.locataireId);
                    return t ? `${t.prenom} ${t.nom}` : '—';
                  })()}
                </span>
                <span className="font-extrabold text-slate-700">{formatMontant(confirmingPayment.montant)}</span>
              </div>
              <p className="text-slate-500">Période : <strong>{formatPeriode(confirmingPayment.periode)}</strong></p>
            </div>
          )}

          <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Le statut passera à <strong>PAYÉ</strong>. Cette action est irréversible.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-date">Date effective du paiement *</Label>
            <Input
              id="cf-date" type="date"
              {...confirmForm.register('datePaiement')} disabled={isConfirming}
              className={confirmForm.formState.errors.datePaiement ? 'border-red-400' : ''}
            />
            {confirmForm.formState.errors.datePaiement && (
              <p className="text-xs text-red-500">{confirmForm.formState.errors.datePaiement.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-ref">Référence de paiement (optionnel)</Label>
            <Input
              id="cf-ref" placeholder="ex: WAV-2026-0615-XXXX"
              {...confirmForm.register('referenceId')} disabled={isConfirming}
            />
          </div>

          {confirmError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{confirmError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleCloseConfirm} disabled={isConfirming}>Annuler</Button>
            <Button type="submit" disabled={isConfirming} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
              {isConfirming ? 'Confirmation...' : "Confirmer l'encaissement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── RECEIPT MODAL ─── */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Quittance de Loyer Officielle">
        {activeReceipt && (
          <div className="space-y-5">
            <div className="border border-slate-200 p-6 rounded-lg bg-white font-serif text-slate-800 space-y-5">
              <div className="flex justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">Quittance de Loyer</h3>
                  <p className="text-[10px] text-slate-500 font-sans font-bold mt-0.5">
                    N° R-{activeReceipt.periode}-{activeReceipt.id.slice(-5).toUpperCase()}
                  </p>
                </div>
                <div className="text-right font-sans">
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] font-black">Payé</Badge>
                  <p className="text-[9px] text-slate-400 mt-1">
                    Validé le {activeReceipt.datePaiement ? formatDate(activeReceipt.datePaiement) : '—'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[11px] font-sans">
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide">Gérant Mandataire</p>
                  <p className="font-bold text-slate-800">{currentUser.prenom} {currentUser.nom}</p>
                  <p className="text-slate-500">Pour le compte de :</p>
                  <p className="font-semibold text-slate-700">
                    {receiptBailleur ? `${receiptBailleur.prenom} ${receiptBailleur.nom}` : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide">Locataire</p>
                  <p className="font-bold text-slate-800">
                    {receiptTenant ? `${receiptTenant.prenom} ${receiptTenant.nom}` : '—'}
                  </p>
                  <p className="text-slate-500">Logement :</p>
                  <p className="font-semibold text-slate-700">{receiptProp?.titre || '—'}</p>
                  <p className="text-slate-400 text-[10px] leading-tight">{receiptProp?.adresse}, {receiptProp?.ville}</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed border-t border-b border-slate-100 py-4 italic">
                Je soussigné, {currentUser.prenom} {currentUser.nom}, gérant mandataire du bien situé au {receiptProp?.adresse}, {receiptProp?.ville}, certifie avoir reçu de {receiptTenant?.prenom} {receiptTenant?.nom} la somme de{' '}
                <strong className="font-semibold text-slate-900">{formatMontant(activeReceipt.montant)}</strong> pour la période de{' '}
                <strong className="font-semibold text-slate-900">{formatPeriode(activeReceipt.periode)}</strong>.
              </p>

              <div className="font-sans text-[11px]">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide mb-1.5">Détail</p>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="flex bg-slate-50 border-b border-slate-200 p-2 font-bold text-slate-600">
                    <span className="flex-1">Désignation</span>
                    <span className="w-32 text-right">Montant</span>
                  </div>
                  {[
                    { label: 'Loyer de base', value: receiptProp?.loyerDeBase ?? 0 },
                    { label: 'Provisions charges', value: receiptProp?.charges ?? 0 },
                  ].map(row => (
                    <div key={row.label} className="flex p-2 border-b border-slate-100">
                      <span className="flex-1">{row.label}</span>
                      <span className="w-32 text-right font-medium">{formatMontant(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex p-2 font-extrabold text-slate-800">
                    <span className="flex-1 uppercase text-[10px]">Total Encaissé</span>
                    <span className="w-32 text-right text-sm text-blue-800">{formatMontant(activeReceipt.montant)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end font-sans">
                <div className="text-[10px] text-slate-400">
                  <p>Référence :</p>
                  <code className="text-[9px] font-mono">{activeReceipt.referenceId || 'N/A'}</code>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Signature du Mandataire</p>
                  <span className="font-serif italic text-blue-800 font-extrabold text-sm border-b border-dashed border-blue-400">
                    Mandat Immob
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button onClick={() => setIsReceiptOpen(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
