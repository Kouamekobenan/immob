'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, CreditCard, Printer, Building2, MapPin, Mail, Phone } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } } },
};

const payStatusConfig: Record<string, { label: string; cls: string }> = {
  PAYE:       { label: 'Payé',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function LocataireContract() {
  const { currentUser, contracts, properties, payments, users } = useAppStore();
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!currentUser) return null;

  const activeContract = contracts.find(c => c.locataireId === currentUser.id && c.estActif);
  const prop = activeContract ? properties.find(p => p.id === activeContract.propertyId) : null;
  const owner = prop ? users.find(u => u.id === prop.bailleurId) : null;
  const manager = prop?.gerantId ? users.find(u => u.id === prop.gerantId) : null;

  const myPayments = payments
    .filter(p => p.locataireId === currentUser.id)
    .sort((a, b) => b.periode.localeCompare(a.periode));

  const openReceipt = (payment: Payment) => {
    setActiveReceipt(payment);
    setIsReceiptOpen(true);
  };

  const receiptContract = activeReceipt ? contracts.find(c => c.id === activeReceipt.contractId) : null;
  const receiptProp = receiptContract ? properties.find(p => p.id === receiptContract.propertyId) : null;
  const receiptTenant = activeReceipt ? users.find(u => u.id === activeReceipt.locataireId) : null;
  const receiptManager = receiptProp?.gerantId ? users.find(u => u.id === receiptProp.gerantId) : null;
  const receiptBailleur = receiptProp ? users.find(u => u.id === receiptProp.bailleurId) : null;

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-7">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-slate-500" />
          Mon Contrat de Bail
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consultez les termes de votre bail et téléchargez vos quittances de loyer.
        </p>
      </motion.div>

      {activeContract && prop ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Contract details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={stagger.item}>
              <Card className="bg-white">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-slate-700">Spécifications du Contrat</CardTitle>
                  <CardDescription>Conditions convenues lors de la signature</CardDescription>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date d&apos;entrée</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatDate(activeContract.dateDebut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date de fin</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {activeContract.dateFin ? formatDate(activeContract.dateFin) : 'Indéterminée'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Loyer mensuel</p>
                      <p className="text-lg font-black text-blue-700">{formatCurrency(activeContract.loyerTotal)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Propriétaire Bailleur</p>
                      <p className="font-bold text-slate-800">{owner ? `${owner.prenom} ${owner.nom}` : '—'}</p>
                      {owner?.email && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />{owner.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gérant Mandataire</p>
                      <p className="font-bold text-slate-800">{manager ? `${manager.prenom} ${manager.nom}` : 'Non désigné'}</p>
                      {manager?.telephone && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />{manager.telephone}
                        </p>
                      )}
                      {manager?.email && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />{manager.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment history */}
            <motion.div variants={stagger.item} className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-400" />
                Historique des loyers
              </h2>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wide">
                        <th className="px-5 py-3.5">Période</th>
                        <th className="px-5 py-3.5">Montant</th>
                        <th className="px-5 py-3.5">Date de paiement</th>
                        <th className="px-5 py-3.5">Statut</th>
                        <th className="px-5 py-3.5 text-right">Justificatif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {myPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                            Aucun historique de paiement.
                          </td>
                        </tr>
                      ) : (
                        myPayments.map((pay, i) => {
                          const stCfg = payStatusConfig[pay.statut] ?? { label: pay.statut, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                          return (
                            <motion.tr
                              key={pay.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.04, duration: 0.18 }}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-5 py-3.5 font-bold text-slate-800">{pay.periode}</td>
                              <td className="px-5 py-3.5 font-semibold text-slate-700">{formatCurrency(pay.montant)}</td>
                              <td className="px-5 py-3.5 text-slate-500">
                                {pay.datePaiement ? formatDate(pay.datePaiement) : '—'}
                              </td>
                              <td className="px-5 py-3.5">
                                <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {pay.statut === 'PAYE' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReceipt(pay)}
                                    className="h-7 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Quittance
                                  </Button>
                                ) : (
                                  <span className="text-slate-300 italic">—</span>
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
          </div>

          {/* Right: Property info */}
          <motion.div variants={stagger.item} className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              Le Logement
            </h2>
            <Card className="bg-white">
              <CardContent className="p-5 space-y-4">
                <div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold mb-2">{prop.type}</Badge>
                  <h4 className="text-sm font-bold text-slate-800">{prop.titre}</h4>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    {prop.adresse}, {prop.ville}
                  </p>
                </div>

                {prop.description && (
                  <>
                    <Separator />
                    <p className="text-xs text-slate-500 leading-relaxed">{prop.description}</p>
                  </>
                )}

                <Separator />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loyer de base</span>
                    <span className="font-bold text-slate-700">{formatCurrency(prop.loyerDeBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Charges</span>
                    <span className="font-bold text-slate-700">{formatCurrency(prop.charges)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-600">Total mensuel</span>
                    <span className="font-black text-blue-700">{formatCurrency(prop.loyerDeBase + prop.charges)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        <motion.div variants={stagger.item}>
          <Card className="p-10 text-center text-slate-400 font-medium">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            Aucun contrat de bail actif.
          </Card>
        </motion.div>
      )}

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
                  <p className="font-bold text-slate-800">{receiptManager ? `${receiptManager.prenom} ${receiptManager.nom}` : '—'}</p>
                  <p className="text-slate-500">Pour le compte de :</p>
                  <p className="font-semibold text-slate-700">{receiptBailleur ? `${receiptBailleur.prenom} ${receiptBailleur.nom}` : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide">Locataire</p>
                  <p className="font-bold text-slate-800">{receiptTenant ? `${receiptTenant.prenom} ${receiptTenant.nom}` : '—'}</p>
                  <p className="text-slate-500">Logement :</p>
                  <p className="font-semibold text-slate-700">{receiptProp?.titre || '—'}</p>
                  <p className="text-slate-400 leading-tight text-[10px]">{receiptProp?.adresse}, {receiptProp?.ville}</p>
                </div>
              </div>

              {/* Body text */}
              <p className="text-xs leading-relaxed border-t border-b border-slate-100 py-4 italic font-serif">
                Je soussigné, {receiptManager ? `${receiptManager.prenom} ${receiptManager.nom}` : '—'}, gérant mandataire du bien situé au {receiptProp?.adresse}, {receiptProp?.ville}, certifie avoir reçu de la part du locataire {receiptTenant?.prenom} {receiptTenant?.nom}, la somme de <strong className="font-semibold text-slate-900">{formatCurrency(activeReceipt.montant)}</strong> au titre du loyer et des charges pour la période de <strong className="font-semibold text-slate-900">{activeReceipt.periode}</strong>.
              </p>

              {/* Breakdown */}
              <div className="space-y-1.5 font-sans text-[11px]">
                <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wide">Détail des règlements</p>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="flex bg-slate-50 border-b border-slate-200 p-2 font-bold text-slate-600">
                    <span className="flex-1">Désignation</span>
                    <span className="w-24 text-right">Montant</span>
                  </div>
                  {[
                    { label: 'Loyer de base', value: receiptProp?.loyerDeBase ?? 0 },
                    { label: 'Provisions pour charges', value: receiptProp?.charges ?? 0 },
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
              <div className="flex justify-between items-end pt-2 font-sans">
                <div className="text-[10px] text-slate-400">
                  <p>Référence :</p>
                  <code className="text-[9px] text-slate-500 font-mono">{activeReceipt.referenceId || 'N/A'}</code>
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
