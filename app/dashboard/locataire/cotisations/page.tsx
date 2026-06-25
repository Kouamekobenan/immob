'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import {
  Coins, Loader2, AlertCircle, ChevronDown, Banknote,
  CheckCircle, Clock, TrendingUp, RefreshCw, Info,
} from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { formatFCFA } from '@/lib/utils';
import { cotisationsService } from '@/lib/services/cotisations.service';
import type {
  MonGroupeResponse, MonBilanResponse, ContributionResponse, PaymentStatus,
} from '@/types/cotisations';
import { motion } from 'framer-motion';

// ── Helpers ──────────────────────────────────────────────────────────────────

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } },
};

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function formatPeriode(p: string): string {
  const [mm, yyyy] = p.split('-');
  return `${MOIS[parseInt(mm) - 1]} ${yyyy}`;
}

const statutCfg: Record<PaymentStatus, { label: string; cls: string; dot: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-slate-100 text-slate-600 border-slate-200',   dot: 'bg-slate-400' },
  PARTIEL:    { label: 'Partiel',    cls: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-400' },
  PAYE:       { label: 'Soldé ✓',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJETE:     { label: 'Rejeté',    cls: 'bg-red-50  text-red-700  border-red-200',         dot: 'bg-red-400' },
};

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const trancheSchema = z.object({
  montant:      z.number().positive('Montant requis et positif'),
  referenceId:  z.string().optional(),
  datePaiement: z.string().optional(),
});
type TrancheForm = z.infer<typeof trancheSchema>;

const payerToutSchema = z.object({
  referenceId:  z.string().optional(),
  datePaiement: z.string().optional(),
});
type PayerToutForm = z.infer<typeof payerToutSchema>;

// ── Page Component ────────────────────────────────────────────────────────────

export default function LocataireCotisationsPage() {
  const [selectedPeriode, setSelectedPeriode] = useState(cotisationsService.getCurrentPeriode());
  const periodes = cotisationsService.generatePeriodes(14);

  // ── Data states ──
  const [monGroupes, setMonGroupes] = useState<MonGroupeResponse[]>([]);
  const [bilan,      setBilan]      = useState<MonBilanResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [pageError,  setPageError]  = useState('');

  // ── Modal states ──
  const [payerToutContrib,   setPayerToutContrib]   = useState<ContributionResponse | null>(null);
  const [trancheContrib,     setTrancheContrib]     = useState<ContributionResponse | null>(null);
  const [isPayingTout,       setIsPayingTout]       = useState(false);
  const [payerToutError,     setPayerToutError]     = useState('');
  const [isAddingTranche,    setIsAddingTranche]    = useState(false);
  const [addTrancheError,    setAddTrancheError]    = useState('');

  // ── Forms ──
  const payerToutForm = useForm<PayerToutForm>({ resolver: zodResolver(payerToutSchema) });
  const trancheForm   = useForm<TrancheForm>({ resolver: zodResolver(trancheSchema) });

  // ── Load ─────────────────────────────────────────────────────────────────

  // Called from event handlers (refresh button, retry) — setState here is fine
  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [groupes, bilanData] = await Promise.all([
        cotisationsService.getMonGroupes(),
        cotisationsService.getMonBilan(selectedPeriode !== cotisationsService.getCurrentPeriode() ? selectedPeriode : undefined),
      ]);
      setMonGroupes(groupes);
      setBilan(bilanData);
    } catch (err) {
      setPageError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedPeriode]);

  // Inline async effect — setState only inside .then()/.catch() (asynchronous, not flagged)
  useEffect(() => {
    let cancelled = false;
    const periodeArg = selectedPeriode !== cotisationsService.getCurrentPeriode() ? selectedPeriode : undefined;
    Promise.all([
      cotisationsService.getMonGroupes(),
      cotisationsService.getMonBilan(periodeArg),
    ]).then(([groupes, bilanData]) => {
      if (!cancelled) { setMonGroupes(groupes); setBilan(bilanData); setLoading(false); }
    }).catch(err => {
      if (!cancelled) { setPageError(parseApiError(err)); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedPeriode]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openPayerTout = (c: ContributionResponse) => {
    payerToutForm.reset({ datePaiement: new Date().toISOString().split('T')[0] });
    setPayerToutError('');
    setPayerToutContrib(c);
  };

  const openTranche = (c: ContributionResponse) => {
    trancheForm.reset({ datePaiement: new Date().toISOString().split('T')[0] });
    setAddTrancheError('');
    setTrancheContrib(c);
  };

  const onPayerToutSubmit = async (data: PayerToutForm) => {
    if (!payerToutContrib) return;
    setPayerToutError('');
    setIsPayingTout(true);
    try {
      const result = await cotisationsService.payerTout(payerToutContrib.id, {
        referenceId:  data.referenceId  || undefined,
        datePaiement: data.datePaiement ? new Date(data.datePaiement).toISOString() : undefined,
      });
      // Mise à jour locale des groupes
      setMonGroupes(prev => prev.map(mg => {
        if (mg.contributionCourante?.id === result.contribution.id) {
          return { ...mg, contributionCourante: result.contribution };
        }
        return mg;
      }));
      // Mise à jour bilan
      setBilan(prev => prev ? {
        ...prev,
        totalPaye:    prev.totalPaye    + result.tranche.montant,
        totalRestant: prev.totalRestant - result.tranche.montant,
        contributions: prev.contributions.map(c =>
          c.id === result.contribution.id ? { ...c, ...result.contribution } : c
        ),
      } : prev);
      setPayerToutContrib(null);
    } catch (err) {
      setPayerToutError(parseApiError(err));
    } finally {
      setIsPayingTout(false);
    }
  };

  const onTrancheSubmit = async (data: TrancheForm) => {
    if (!trancheContrib) return;
    if (data.montant > trancheContrib.montantRestant) {
      trancheForm.setError('montant', {
        message: `Le montant dépasse le reste dû (${formatFCFA(trancheContrib.montantRestant)})`,
      });
      return;
    }
    setAddTrancheError('');
    setIsAddingTranche(true);
    try {
      const result = await cotisationsService.addTranche(trancheContrib.id, {
        montant:      data.montant,
        referenceId:  data.referenceId  || undefined,
        datePaiement: data.datePaiement ? new Date(data.datePaiement).toISOString() : undefined,
      });
      setMonGroupes(prev => prev.map(mg => {
        if (mg.contributionCourante?.id === result.contribution.id) {
          return { ...mg, contributionCourante: result.contribution };
        }
        return mg;
      }));
      setBilan(prev => prev ? {
        ...prev,
        totalPaye:    prev.totalPaye    + result.tranche.montant,
        totalRestant: prev.totalRestant - result.tranche.montant,
        contributions: prev.contributions.map(c =>
          c.id === result.contribution.id ? { ...c, ...result.contribution } : c
        ),
      } : prev);
      setTrancheContrib(null);
    } catch (err) {
      setAddTrancheError(parseApiError(err));
    } finally {
      setIsAddingTranche(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">

      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-slate-500" />
            Mes cotisations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultez vos groupes et payez vos charges communes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="relative">
            <select
              value={selectedPeriode}
              onChange={e => { setLoading(true); setPageError(''); setSelectedPeriode(e.target.value); }}
              className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 appearance-none cursor-pointer"
            >
              {periodes.map(p => (
                <option key={p} value={p}>{formatPeriode(p)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
            title="Actualiser"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Error */}
      {pageError && (
        <motion.div variants={stagger.item}>
          <Card className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-600 font-medium">{pageError}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>Réessayer</Button>
          </Card>
        </motion.div>
      )}

      {/* Bilan global */}
      {!loading && !pageError && bilan && (
        <motion.div variants={stagger.item}>
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Bilan global
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {([
                { label: 'Total attendu', value: bilan.totalAttendu,  cls: 'text-slate-700' },
                { label: 'Total payé',    value: bilan.totalPaye,     cls: 'text-emerald-600' },
                { label: 'Reste dû',      value: bilan.totalRestant,  cls: 'text-amber-600' },
              ] as const).map(({ label, value, cls }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
                  <p className={`text-sm font-extrabold leading-tight ${cls}`}>{formatFCFA(value)}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Mes groupes du mois */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : !pageError && (
        <>
          <motion.div variants={stagger.item}>
            <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">
              Mes groupes — {formatPeriode(selectedPeriode)}
            </h2>
          </motion.div>

          {monGroupes.length === 0 ? (
            <motion.div variants={stagger.item}>
              <Card className="p-12 text-center border-dashed">
                <Coins className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">Aucun groupe de cotisation</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                  Vous n&apos;avez pas encore été ajouté à un groupe. Contactez votre gestionnaire.
                </p>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {monGroupes.map(mg => {
                const { groupe, membre, contributionCourante: cc } = mg;

                // Fallback : si l'API ne renvoie pas contributionCourante (décalage de période),
                // on cherche la contribution EN_ATTENTE/PARTIEL la plus récente dans le bilan
                const bilanFallback = !cc
                  ? (bilan?.contributions.find(
                      c => c.groupeId === groupe.id &&
                           (c.statut === 'EN_ATTENTE' || c.statut === 'PARTIEL')
                    ) ?? null)
                  : null;

                const ecc      = cc ?? bilanFallback; // effective contribution
                const stCfg    = ecc ? statutCfg[ecc.statut] : null;
                const isPayable = !!ecc && (ecc.statut === 'EN_ATTENTE' || ecc.statut === 'PARTIEL');
                const isSolde   = ecc?.statut === 'PAYE';
                const progPct   = ecc && ecc.montant > 0
                  ? Math.round((ecc.montantPaye / ecc.montant) * 100) : 0;

                return (
                  <motion.div key={groupe.id} variants={stagger.item}>
                    <Card className="p-5 flex flex-col gap-4 border-slate-200 hover:shadow-md transition-shadow">
                      {/* Group name & status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 leading-snug line-clamp-2">{groupe.nom}</p>
                          {membre.estTresorier && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md inline-block mt-1">
                              Trésorier
                            </span>
                          )}
                        </div>
                        {stCfg ? (
                          <Badge className={`text-[9px] font-bold border shrink-0 ${stCfg.cls}`}>{stCfg.label}</Badge>
                        ) : (
                          <Badge className="text-[9px] font-bold border shrink-0 bg-slate-100 text-slate-400 border-slate-200">
                            Pas d&apos;avis
                          </Badge>
                        )}
                      </div>

                      {/* Contribution detail */}
                      {ecc ? (
                        <div className="space-y-2">
                          {bilanFallback && (
                            <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                              Paiement en attente — {formatPeriode(bilanFallback.periode)}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Progression</span>
                            <span className="font-bold text-slate-700">{formatFCFA(ecc.montantPaye)} / {formatFCFA(ecc.montant)}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isSolde ? 'bg-emerald-500' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(progPct, 100)}%` }}
                            />
                          </div>
                          {ecc.montantRestant > 0 && (
                            <p className="text-xs text-slate-400">
                              Reste : <span className="font-semibold text-amber-700">{formatFCFA(ecc.montantRestant)}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-500">
                            Votre gestionnaire n&apos;a pas encore généré d&apos;avis de contribution.
                          </p>
                        </div>
                      )}
                      {/* Amount */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Mensualité</span>
                        <span className="text-sm font-extrabold text-blue-600">{formatFCFA(groupe.montantParMembre)}</span>
                      </div>
                      {/* Actions */}
                      {isPayable && ecc && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openPayerTout(ecc)}
                            className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Payer tout
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() => openTranche(ecc)}
                            className="flex-1 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold text-xs"
                          >
                            <Banknote className="h-3.5 w-3.5" />
                            Par tranche
                          </Button>
                        </div>
                      )}
                      {isSolde && (
                        <div className="flex items-center gap-1.5 justify-center text-emerald-600 text-xs font-semibold py-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Cotisation soldée
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Historique des contributions (bilan détaillé) — toujours affiché */}
          <motion.div variants={stagger.item}>
            <Card className="overflow-hidden mt-2">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Historique de mes cotisations
                </h2>
              </div>
              {bilan && bilan.contributions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                        <th className="px-5 py-3.5">Groupe</th>
                        <th className="px-5 py-3.5">Période</th>
                        <th className="px-5 py-3.5">Statut</th>
                        <th className="px-5 py-3.5">Montant</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {bilan.contributions.map(c => {
                        const scfg        = statutCfg[c.statut];
                        const canPayBilan = c.statut === 'EN_ATTENTE' || c.statut === 'PARTIEL';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-800">
                                {monGroupes.find(mg => mg.groupe.id === c.groupeId)?.groupe.nom ?? c.nom ?? '—'}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">{formatPeriode(c.periode)}</td>
                            <td className="px-5 py-3.5">
                              <Badge className={`text-[9px] font-bold border ${scfg.cls}`}>{scfg.label}</Badge>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-slate-800">{formatFCFA(c.montantPaye)}</span>
                              <span className="text-slate-400"> / {formatFCFA(c.montant)}</span>
                              {c.montantRestant > 0 && (
                                <p className="text-[10px] text-amber-600 font-medium">
                                  Reste : {formatFCFA(c.montantRestant)}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {canPayBilan && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => openPayerTout(c)}
                                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Tout payer
                                  </Button>
                                  <Button
                                    size="sm" variant="outline"
                                    onClick={() => openTranche(c)}
                                    className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold text-xs"
                                  >
                                    <Banknote className="h-3 w-3" />
                                    Tranche
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Aucune contribution enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Votre gestionnaire n&apos;a pas encore généré d&apos;avis de contribution pour cette période.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
      {/* ─── PAYER TOUT ─── */}
      <Modal
        isOpen={!!payerToutContrib}
        onClose={() => setPayerToutContrib(null)}
        title="Payer la totalité restante"
      >
        {payerToutContrib && (
          <form onSubmit={payerToutForm.handleSubmit(onPayerToutSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Groupe</span>
                <span className="font-bold text-slate-800">
                  {monGroupes.find(mg => mg.contributionCourante?.id === payerToutContrib.id)?.groupe.nom
                    ?? monGroupes.find(mg => mg.groupe.id === payerToutContrib.groupeId)?.groupe.nom
                    ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Période</span>
                <span className="font-semibold text-slate-700">{formatPeriode(payerToutContrib.periode)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                <span className="font-bold text-slate-600">Montant à payer</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatFCFA(payerToutContrib.montantRestant)}</span>
              </div>
            </div>

            <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                Le solde restant ({formatFCFA(payerToutContrib.montantRestant)}) sera enregistré en une seule tranche.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pt-ref">Référence mobile money <span className="text-slate-400 font-normal">(opt.)</span></Label>
                <Input id="pt-ref" placeholder="WAVE-2026-001" {...payerToutForm.register('referenceId')} disabled={isPayingTout} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pt-date">Date de paiement</Label>
                <Input id="pt-date" type="date" {...payerToutForm.register('datePaiement')} disabled={isPayingTout} />
              </div>
            </div>
            {payerToutError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{payerToutError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setPayerToutContrib(null)} disabled={isPayingTout}>Annuler</Button>
              <Button type="submit" disabled={isPayingTout} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isPayingTout && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPayingTout ? 'Paiement...' : `Payer ${formatFCFA(payerToutContrib.montantRestant)}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {/* ─── PAYER PAR TRANCHE ─── */}
      <Modal
        isOpen={!!trancheContrib}
        onClose={() => setTrancheContrib(null)}
        title="Payer une tranche"
      >
        {trancheContrib && (
          <form onSubmit={trancheForm.handleSubmit(onTrancheSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total dû</span>
                <span className="font-bold text-slate-800">{formatFCFA(trancheContrib.montant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Déjà payé</span>
                <span className="font-semibold text-emerald-700">{formatFCFA(trancheContrib.montantPaye)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                <span className="font-bold text-slate-600">Reste dû</span>
                <span className="font-extrabold text-amber-700">{formatFCFA(trancheContrib.montantRestant)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-montant">Montant de la tranche (FCFA) *</Label>
              <Input
                id="tr-montant" type="number" min="1" max={trancheContrib.montantRestant}
                placeholder={`Max : ${formatFCFA(trancheContrib.montantRestant)}`}
                {...trancheForm.register('montant', { valueAsNumber: true })}
                disabled={isAddingTranche}
                className={trancheForm.formState.errors.montant ? 'border-red-400' : ''}
              />
              {trancheForm.formState.errors.montant && (
                <p className="text-xs text-red-500">{trancheForm.formState.errors.montant.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tr-ref">Référence <span className="text-slate-400 font-normal">(opt.)</span></Label>
                <Input id="tr-ref" placeholder="WAVE-001" {...trancheForm.register('referenceId')} disabled={isAddingTranche} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tr-date">Date de paiement</Label>
                <Input id="tr-date" type="date" {...trancheForm.register('datePaiement')} disabled={isAddingTranche} />
              </div>
            </div>
            {addTrancheError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{addTrancheError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setTrancheContrib(null)} disabled={isAddingTranche}>Annuler</Button>
              <Button type="submit" disabled={isAddingTranche} className="gap-1.5">
                {isAddingTranche && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAddingTranche ? 'Enregistrement...' : 'Enregistrer la tranche'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
}
