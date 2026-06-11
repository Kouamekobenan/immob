'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Shield, Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LocatairePay() {
  const { currentUser, contracts, payments, payPeriod } = useAppStore();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState<'wave' | 'orange'>('wave');

  if (!currentUser) return null;

  const activeContract = contracts.find(c => c.locataireId === currentUser.id && c.estActif);
  const myPayments = payments.filter(p => p.locataireId === currentUser.id);
  const currentDate = new Date();
  const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
  const pendingPayment = myPayments.find(p => p.periode === currentPeriod && p.statut === 'EN_ATTENTE');

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingPayment) return;
    setLoading(true);
    setTimeout(() => {
      const mockRef = paymentMethod === 'card'
        ? `ref_stripe_${Math.floor(1000000 + Math.random() * 9000000)}`
        : `ref_${operator}_${Math.floor(1000000 + Math.random() * 9000000)}`;
      payPeriod(pendingPayment.id, mockRef);
      setLoading(false);
      setSuccess(true);
    }, 1500);
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
          Simulez un paiement sécurisé pour acquitter l&apos;échéance du mois en cours.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
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
                <h2 className="text-xl font-black text-slate-800">Paiement effectué !</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Votre transaction a été validée. Un justificatif a été enregistré et votre gérant en a été notifié.
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
        ) : !pendingPayment ? (
          <motion.div
            key="nopayment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="text-center p-10 bg-white">
              <div className="space-y-3">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Aucun paiement en attente</h2>
                <p className="text-xs text-slate-500">
                  Votre loyer pour la période de <strong className="text-slate-700">{currentPeriod}</strong> a déjà été acquitté.
                </p>
                <div className="pt-2">
                  <Link href="/dashboard/locataire">
                    <Button>Retourner au Dashboard</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
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
                  {activeContract ? formatCurrency(activeContract.loyerTotal) : '0 €'}
                </p>
              </CardHeader>

              <CardContent className="p-6">
                {loading ? (
                  <div className="py-14 flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="text-xs font-bold text-slate-700">Sécurisation de la transaction...</p>
                    <p className="text-[10px] text-slate-400">Ne fermez pas cette page.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Method selector */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Moyen de paiement
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { key: 'card' as const, icon: CreditCard, label: 'Carte Bancaire (Stripe)' },
                          { key: 'mobile' as const, icon: Smartphone, label: 'Mobile Money' },
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
                        <motion.div
                          key="card"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.16 }}
                          className="space-y-4"
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor="cardNumber">Numéro de carte</Label>
                            <Input
                              id="cardNumber"
                              required
                              placeholder="4242 •••• •••• 4242"
                              value={cardNumber}
                              onChange={e => setCardNumber(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="expiry">Expiration</Label>
                              <Input
                                id="expiry"
                                required
                                placeholder="MM/AA"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                                className="text-center"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="cvv">CVC / CVV</Label>
                              <Input
                                id="cvv"
                                type="password"
                                required
                                maxLength={3}
                                placeholder="•••"
                                value={cvv}
                                onChange={e => setCvv(e.target.value)}
                                className="text-center"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="mobile"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.16 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            {([
                              { key: 'wave' as const, label: 'Wave', activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
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
                            <Input
                              id="phone"
                              type="tel"
                              required
                              placeholder="+221 77 000 00 00"
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Security notice */}
                    <div className="flex items-start gap-2.5 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        Vos transactions sont cryptées et conformes aux normes PCI-DSS. Aucun détail bancaire n&apos;est stocké par Immob.
                      </span>
                    </div>

                    <Separator />

                    <Button type="submit" className="w-full text-sm font-bold">
                      Simuler le règlement de {activeContract ? formatCurrency(activeContract.loyerTotal) : '0 €'}
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
