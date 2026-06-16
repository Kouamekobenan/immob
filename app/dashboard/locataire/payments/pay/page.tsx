'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { parseApiError } from '@/lib/api';
import { CreditCard, Shield, Smartphone, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { MethodePaiement } from '@/lib/services/payment.service';

export default function LocatairePay() {
  const { currentUser, contracts, payments, submitPayment } = useAppStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState<'wave' | 'orange'>('wave');

  if (!currentUser) return null;

  const activeContract = contracts.find(c => c.locataireId === currentUser.id && c.estActif);
  const myPayments     = payments.filter(p => p.locataireId === currentUser.id);
  const currentDate    = new Date();
  const currentPeriod  = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

  const paidPayment    = myPayments.find(p => p.periode === currentPeriod && p.statut === 'PAYE');
  const pendingPayment = myPayments.find(p => p.periode === currentPeriod && p.statut === 'EN_ATTENTE');
  const failedPayment  = myPayments.find(p => p.periode === currentPeriod && (p.statut === 'ECHOUE' || p.statut === 'REJETE'));

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeContract) return;
    setError('');
    setLoading(true);

    let methode: MethodePaiement;
    let referenceId: string | undefined;

    if (paymentMethod === 'card') {
      methode = 'VIREMENT';
    } else {
      methode = operator === 'wave' ? 'WAVE' : 'ORANGE_MONEY';
      referenceId = phoneNumber ? `${methode.toLowerCase()}_${Date.now()}` : undefined;
    }

    try {
      await submitPayment({
        contractId:      activeContract.id,
        locataireId:     currentUser.id,
        periode:         currentPeriod,
        montant:         activeContract.loyerTotal,
        methodePaiement: methode,
        referenceId,
      });
      setSuccess(true);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/locataire"
        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-slate-500" />
          Règlement du Loyer
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Soumettez votre paiement pour la période en cours.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* Déjà payé */}
        {success || paidPayment ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <Card className="text-center p-10 bg-white">
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.div>
                <h2 className="text-xl font-black text-slate-800">Loyer acquitté !</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Votre paiement pour la période <strong className="text-slate-700">{currentPeriod}</strong> a bien été enregistré.
                  Votre gérant va le valider prochainement.
                </p>
                <div className="pt-2 flex justify-center gap-4">
                  <Link href="/dashboard/locataire">
                    <Button variant="outline">Retour à l&apos;espace</Button>
                  </Link>
                  <Link href="/dashboard/locataire/contract">
                    <Button>Historique &amp; Quittances</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

        ) : pendingPayment ? (
          /* En attente de validation */
          <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="text-center p-10 bg-white">
              <div className="space-y-3">
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Paiement en cours de validation</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Votre loyer pour <strong className="text-slate-700">{currentPeriod}</strong> est en attente de confirmation
                  par votre gérant. Vous recevrez une notification dès validation.
                </p>
                <div className="mt-2 inline-block bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                  {formatCurrency(pendingPayment.montant)} · EN_ATTENTE
                </div>
                <div className="pt-3">
                  <Link href="/dashboard/locataire">
                    <Button variant="outline">Retour au Dashboard</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

        ) : !activeContract ? (
          /* Pas de contrat */
          <motion.div key="nocontract" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="text-center p-10 bg-white">
              <div className="space-y-3">
                <XCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <h2 className="text-base font-bold text-slate-800">Aucun contrat actif</h2>
                <p className="text-xs text-slate-500">Vous n&apos;avez pas de contrat de location actif pour le moment.</p>
                <Link href="/dashboard/locataire">
                  <Button variant="outline" className="mt-2">Retour</Button>
                </Link>
              </div>
            </Card>
          </motion.div>

        ) : (
          /* Formulaire de paiement */
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {failedPayment && (
              <div className="mb-4 flex items-start gap-2.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-3 py-2.5 rounded-xl">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                Votre dernier paiement ({failedPayment.statut === 'REJETE' ? 'rejeté' : 'échoué'}) pour cette période.
                Vous pouvez soumettre un nouveau paiement ci-dessous.
              </div>
            )}

            <Card className="bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Loyer Exigible
                  </CardTitle>
                  <CardDescription className="text-[11px] font-semibold mt-0.5">
                    Période de {currentPeriod}
                  </CardDescription>
                </div>
                <p className="text-xl font-black text-blue-700">
                  {formatCurrency(activeContract.loyerTotal)}
                </p>
              </CardHeader>

              <CardContent className="p-6">
                {loading ? (
                  <div className="py-14 flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-700">Envoi en cours...</p>
                    <p className="text-[10px] text-slate-400">Ne fermez pas cette page.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Méthode */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Moyen de paiement
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { key: 'card'   as const, icon: CreditCard,  label: 'Carte Bancaire' },
                          { key: 'mobile' as const, icon: Smartphone,  label: 'Mobile Money' },
                        ]).map(({ key, icon: Icon, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPaymentMethod(key)}
                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              paymentMethod === key
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMethod === 'card' ? (
                        <motion.div key="card" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.16 }} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="cardNumber">Numéro de carte</Label>
                            <Input id="cardNumber" required placeholder="4242 •••• •••• 4242" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="expiry">Expiration</Label>
                              <Input id="expiry" required placeholder="MM/AA" value={expiry} onChange={e => setExpiry(e.target.value)} className="text-center" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="cvv">CVC / CVV</Label>
                              <Input id="cvv" type="password" required maxLength={3} placeholder="•••" value={cvv} onChange={e => setCvv(e.target.value)} className="text-center" />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="mobile" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.16 }} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {([
                              { key: 'wave'   as const, label: 'Wave',         activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
                              { key: 'orange' as const, label: 'Orange Money', activeClass: 'border-orange-400 bg-orange-50 text-orange-700' },
                            ]).map(({ key, label, activeClass }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setOperator(key)}
                                className={`p-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  operator === key ? activeClass : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone">Numéro de téléphone</Label>
                            <Input id="phone" type="tel" required placeholder="+225 07 000 00 00" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-start gap-2.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Vos informations sont transmises de façon sécurisée. Votre gérant recevra une notification et validera votre paiement.
                      </span>
                    </div>

                    {error && (
                      <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                        {error}
                      </p>
                    )}

                    <Separator />

                    <Button type="submit" className="w-full text-sm font-bold">
                      Soumettre le règlement de {formatCurrency(activeContract.loyerTotal)}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
