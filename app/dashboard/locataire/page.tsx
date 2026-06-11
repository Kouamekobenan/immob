'use client';

import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard, Wrench, Building2, CheckCircle2,
  AlertTriangle, ArrowRight, FileText, MapPin, Calendar, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } } },
};

export default function LocataireDashboard() {
  const { currentUser, contracts, properties, payments, tickets } = useAppStore();
  if (!currentUser) return null;

  const activeContract = contracts.find(c => c.locataireId === currentUser.id && c.estActif);
  const prop = activeContract ? properties.find(p => p.id === activeContract.propertyId) : null;
  const myPayments = payments
    .filter(p => p.locataireId === currentUser.id)
    .sort((a, b) => b.periode.localeCompare(a.periode));

  const currentDate = new Date();
  const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
  const currentPayment = myPayments.find(p => p.periode === currentPeriod);

  const openTickets = tickets.filter(t => t.locataireId === currentUser.id && t.statut !== 'RESOLU' && t.statut !== 'CLOTURE');
  const paidCount = myPayments.filter(p => p.statut === 'PAYE').length;

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Bonjour, {currentUser.prenom} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Voici l&apos;état de votre espace locataire pour le mois de{' '}
          <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>.
        </p>
      </motion.div>

      {/* Top row: Loyer + Mon logement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Loyer du mois */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Loyer du mois — {currentPeriod}</p>
                  {activeContract ? (
                    <p className="text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
                      {formatCurrency(activeContract.loyerTotal)}
                    </p>
                  ) : (
                    <p className="text-xl font-bold text-slate-400 mt-1">Aucun bail actif</p>
                  )}
                </div>
                {activeContract && (
                  <div className={`p-3 rounded-xl shrink-0 ${currentPayment?.statut === 'PAYE' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {currentPayment?.statut === 'PAYE'
                      ? <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      : <AlertTriangle className="h-6 w-6 text-amber-600" />
                    }
                  </div>
                )}
              </div>

              {activeContract && (
                <>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className={`text-xs font-semibold px-3 py-1 border ${
                      currentPayment?.statut === 'PAYE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {currentPayment?.statut === 'PAYE' ? '✓ Payé ce mois' : '⏳ En attente de paiement'}
                    </Badge>
                    {paidCount > 0 && (
                      <span className="text-[11px] text-slate-400">{paidCount} paiement{paidCount > 1 ? 's' : ''} effectué{paidCount > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {currentPayment?.datePaiement && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      Réglé le {formatDate(currentPayment.datePaiement)}
                      {currentPayment.referenceId && (
                        <span className="ml-1.5 font-mono text-slate-500">· {currentPayment.referenceId}</span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>

            <Separator />

            <div className="px-6 py-4 bg-slate-50/50 flex flex-wrap gap-3">
              {currentPayment?.statut !== 'PAYE' && activeContract ? (
                <Link href="/dashboard/locataire/payments/pay">
                  <Button size="sm" className="gap-1.5 font-semibold">
                    <CreditCard className="h-4 w-4" />
                    Régler mon loyer
                  </Button>
                </Link>
              ) : null}
              <Link href="/dashboard/locataire/payments/pay">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Receipt className="h-4 w-4" />
                  Historique des paiements
                </Button>
              </Link>
              {currentPayment?.recuUrl && (
                <Button variant="outline" size="sm" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                  <FileText className="h-4 w-4" />
                  Télécharger la quittance
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Mon logement */}
        <motion.div variants={stagger.item}>
          <Card className="h-full">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Mon logement</p>
              </div>

              {prop ? (
                <>
                  <div>
                    <Badge className="text-[9px] font-bold bg-blue-50 text-blue-700 border-blue-200 border mb-2">
                      {prop.type}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{prop.titre}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {prop.adresse}, {prop.ville}
                    </p>
                  </div>

                  <Separator />

                  <ul className="space-y-2 text-xs">
                    {[
                      { label: 'Début du bail', value: activeContract ? formatDate(activeContract.dateDebut) : '—', icon: Calendar },
                      { label: 'Loyer de base', value: formatCurrency(prop.loyerDeBase) },
                      { label: 'Charges', value: formatCurrency(prop.charges) },
                      { label: 'Total mensuel', value: formatCurrency(prop.loyerDeBase + prop.charges), bold: true },
                    ].map(({ label, value, icon: Icon, bold }) => (
                      <li key={label} className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          {Icon && <Icon className="h-3 w-3" />}
                          {label}
                        </span>
                        <span className={`${bold ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-600'}`}>{value}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/dashboard/locataire/contract">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1">
                      <FileText className="h-3.5 w-3.5" />
                      Voir le contrat complet
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">Aucun logement lié à ce compte.</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row: Tickets + Paiements récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Signaler une panne */}
        <motion.div variants={stagger.item}>
          <Card className="overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-bold text-slate-700">Mes tickets de maintenance</p>
                {openTickets.length > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[9px] font-bold ml-auto">
                    {openTickets.length} en cours
                  </Badge>
                )}
              </div>

              {openTickets.length === 0 ? (
                <div className="py-6 text-center flex flex-col items-center gap-2 text-slate-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="text-xs font-medium">Aucune panne en cours</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {openTickets.slice(0, 3).map(t => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                      <p className="text-xs font-semibold text-slate-700 truncate flex-1">{t.titre}</p>
                      <Badge className={`text-[9px] font-bold border shrink-0 ${
                        t.urgence === 'CRITIQUE' ? 'bg-red-50 text-red-700 border-red-200' :
                        t.urgence === 'MOYEN'    ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                   'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {t.urgence}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Separator />
            <div className="px-5 py-3 bg-slate-50/50 flex gap-2">
              <Link href="/dashboard/locataire/tickets">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Voir mes tickets <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/dashboard/locataire/tickets?action=new">
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />
                  Signaler une panne
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Historique paiements récents */}
        <motion.div variants={stagger.item}>
          <Card className="overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-500" />
                <p className="text-sm font-bold text-slate-700">Derniers paiements</p>
              </div>
              {myPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Aucun paiement enregistré</p>
              ) : (
                <ul className="divide-y divide-slate-100 -mx-5">
                  {myPayments.slice(0, 4).map(pay => (
                    <li key={pay.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{pay.periode}</p>
                        {pay.referenceId && (
                          <p className="text-[10px] text-slate-400 font-mono">{pay.referenceId}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-extrabold text-slate-700">{formatCurrency(pay.montant)}</span>
                        <Badge className={`text-[9px] font-bold border ${
                          pay.statut === 'PAYE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {pay.statut === 'PAYE' ? '✓ Payé' : 'En attente'}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
