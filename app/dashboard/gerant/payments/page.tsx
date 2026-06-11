'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CreditCard, CheckCircle, FileText, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Payment, PaymentStatus } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const payStatusConfig: Record<PaymentStatus, { label: string; cls: string }> = {
  PAYE:       { label: 'Encaissé',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ECHOUE:     { label: 'Échoué',    cls: 'bg-red-50 text-red-700 border-red-200' },
  REJETE:     { label: 'Rejeté',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function GerantPayments() {
  const { currentUser, payments, properties, contracts, users, validatePayment } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!currentUser) return null;

  const myProperties  = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const myContracts   = contracts.filter(c => myPropertyIds.includes(c.propertyId));
  const myContractIds = myContracts.map(c => c.id);
  const myPayments    = payments.filter(p => myContractIds.includes(p.contractId));

  const filteredPayments = myPayments
    .filter(p => statusFilter === 'ALL' || p.statut === statusFilter)
    .sort((a, b) => b.periode.localeCompare(a.periode));

  const openReceipt = (payment: Payment) => {
    setActiveReceipt(payment);
    setIsReceiptOpen(true);
  };

  const receiptContract = activeReceipt ? contracts.find(c => c.id === activeReceipt.contractId) : null;
  const receiptProp     = receiptContract ? properties.find(p => p.id === receiptContract.propertyId) : null;
  const receiptTenant   = activeReceipt ? users.find(u => u.id === activeReceipt.locataireId) : null;
  const receiptBailleur = receiptProp ? users.find(u => u.id === receiptProp.bailleurId) : null;

  const pendingCount  = myPayments.filter(p => p.statut === 'EN_ATTENTE').length;
  const encaisséTotal = myPayments.filter(p => p.statut === 'PAYE').reduce((s, p) => s + p.montant, 0);

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-slate-500" />
          Suivi &amp; Encaissement des Loyers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Validez les virements en attente et générez les quittances officielles.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'En attente', value: pendingCount,            cls: 'bg-amber-50 text-amber-600',   border: 'border-amber-100' },
          { label: 'Encaissé',   value: formatCurrency(encaisséTotal), cls: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total',      value: myPayments.length,       cls: 'bg-slate-50 text-slate-500',   border: 'border-slate-200' },
        ].map(({ label, value, cls, border }) => (
          <Card key={label} className={`p-4 border ${border}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5 leading-none">{value}</p>
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
              <option value="EN_ATTENTE">En attente de validation</option>
              <option value="PAYE">Encaissés</option>
              <option value="ECHOUE">Échoués</option>
            </select>
            <span className="text-xs text-slate-400">{filteredPayments.length} résultat{filteredPayments.length !== 1 ? 's' : ''}</span>
          </div>
        </Card>
      </motion.div>

      {/* Payments table */}
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
                ) : (
                  filteredPayments.map((pay, i) => {
                    const payContract = contracts.find(c => c.id === pay.contractId);
                    const prop   = payContract ? properties.find(p => p.id === payContract.propertyId) : null;
                    const tenant = users.find(u => u.id === pay.locataireId);
                    const stCfg  = payStatusConfig[pay.statut];
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
                        <td className="px-5 py-3.5 font-semibold text-slate-600">{pay.periode}</td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-800">{formatCurrency(pay.montant)}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                          {pay.referenceId || <span className="italic text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {pay.statut === 'EN_ATTENTE' ? (
                            <Button size="sm" onClick={() => validatePayment(pay.id)} className="gap-1 font-bold">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Valider
                            </Button>
                          ) : pay.statut === 'PAYE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReceipt(pay)}
                              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Quittance
                            </Button>
                          ) : (
                            <span className="text-slate-300">—</span>
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

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Quittance de Loyer Officielle">
        {activeReceipt && (
          <div className="space-y-5">
            <div className="border border-slate-200 p-6 rounded-lg bg-white font-serif text-slate-800 space-y-5" id="printable-receipt">
              {/* Header */}
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

              {/* Parties */}
              <div className="grid grid-cols-2 gap-5 text-[11px] font-sans">
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

              {/* Body */}
              <p className="text-xs leading-relaxed border-t border-b border-slate-100 py-4 italic">
                Je soussigné, {currentUser.prenom} {currentUser.nom}, gérant mandataire du bien situé au {receiptProp?.adresse}, {receiptProp?.ville}, certifie avoir reçu de la part du locataire {receiptTenant?.prenom} {receiptTenant?.nom}, la somme de <strong className="font-semibold text-slate-900">{formatCurrency(activeReceipt.montant)}</strong> pour la période de <strong className="font-semibold text-slate-900">{activeReceipt.periode}</strong>.
              </p>

              {/* Breakdown */}
              <div className="font-sans text-[11px]">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide mb-1.5">Détail</p>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="flex bg-slate-50 border-b border-slate-200 p-2 font-bold text-slate-600">
                    <span className="flex-1">Désignation</span><span className="w-24 text-right">Montant</span>
                  </div>
                  {[
                    { label: 'Loyer de base', value: receiptProp?.loyerDeBase ?? 0 },
                    { label: 'Provisions charges', value: receiptProp?.charges ?? 0 },
                  ].map(row => (
                    <div key={row.label} className="flex p-2 border-b border-slate-100">
                      <span className="flex-1">{row.label}</span>
                      <span className="w-24 text-right font-medium">{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div className="flex p-2 font-extrabold text-slate-800">
                    <span className="flex-1 uppercase text-[10px]">Total Encaissé</span>
                    <span className="w-24 text-right text-sm text-blue-800">{formatCurrency(activeReceipt.montant)}</span>
                  </div>
                </div>
              </div>

              {/* Signature */}
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
