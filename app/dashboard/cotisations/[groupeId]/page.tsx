'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Coins, Plus, Loader2, AlertCircle, ArrowLeft, Edit2,
  Crown, UserX, CheckCircle, XCircle, Clock, Info,
  RefreshCw, ChevronDown, ListOrdered, Banknote, TrendingUp,
} from 'lucide-react';
import { parseApiError } from '@/lib/api';
import { formatFCFA, formatDate } from '@/lib/utils';
import { cotisationsService } from '@/lib/services/cotisations.service';
import { userService } from '@/lib/services/user.service';
import type { User } from '@/types/prisma';
import type {
  GroupeResponse, MembreResponse, ContributionResponse,
  TranchePaiementResponse, GroupeSummaryResponse, HistoriquePeriodeResponse,
  CotisationStatut, PaymentStatus,
} from '@/types/cotisations';
import { motion } from 'framer-motion';

// ── Helpers ───────────────────────────────────────────────────────────────────

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } } },
};

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
function formatPeriode(p: string): string {
  const [mm, yyyy] = p.split('-');
  return `${MOIS[parseInt(mm) - 1]} ${yyyy}`;
}

const groupeStatutCfg: Record<CotisationStatut, { label: string; cls: string }> = {
  ACTIF:   { label: 'Actif',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INACTIF: { label: 'Inactif', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  ARCHIVE: { label: 'Archivé', cls: 'bg-slate-100 text-slate-600 border-slate-200'  },
};

const contribStatutCfg: Record<PaymentStatus, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50  text-amber-700  border-amber-200'   },
  PARTIEL:    { label: 'Partiel',    cls: 'bg-blue-50   text-blue-700   border-blue-200'    },
  PAYE:       { label: 'Soldé ✓',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJETE:     { label: 'Rejeté',    cls: 'bg-red-50    text-red-700    border-red-200'      },
};

// ── Zod Schemas ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  nom:              z.string().min(3, 'Nom requis (min 3 caractères)'),
  description:      z.string().optional(),
  montantParMembre: z.number().positive('Montant positif requis'),
  statut:           z.enum(['ACTIF', 'INACTIF', 'ARCHIVE']),
});
type EditForm = z.infer<typeof editSchema>;

const addMembreSchema = z.object({
  locataireId: z.string().min(1, 'Sélectionnez un locataire'),
});
type AddMembreForm = z.infer<typeof addMembreSchema>;

const trancheSchema = z.object({
  montant:      z.number().positive('Montant requis et positif'),
  referenceId:  z.string().optional(),
  datePaiement: z.string().optional(),
});
type TrancheForm = z.infer<typeof trancheSchema>;

const confirmSchema = z.object({
  referenceId:  z.string().optional(),
  datePaiement: z.string().optional(),
});
type ConfirmForm = z.infer<typeof confirmSchema>;

const rejectSchema = z.object({
  motif: z.string().max(500, '500 caractères maximum').optional(),
});
type RejectForm = z.infer<typeof rejectSchema>;

// ── Page Component ────────────────────────────────────────────────────────────

export default function GroupeDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const groupeId = params.groupeId as string;
  const { properties, users: storeUsers } = useAppStore();
  const storeUsersRef = useRef(storeUsers);
  storeUsersRef.current = storeUsers;
  const [pageUsers, setPageUsers] = useState<User[]>([]);

  // ── Data states ──
  const [groupe,          setGroupe]          = useState<GroupeResponse | null>(null);
  const [membres,         setMembres]         = useState<MembreResponse[]>([]);
  const [summary,         setSummary]         = useState<GroupeSummaryResponse | null>(null);
  const [selectedPeriode, setSelectedPeriode] = useState(cotisationsService.getCurrentPeriode());
  const [loading,         setLoading]         = useState(true);
  const [pageError,       setPageError]       = useState('');
  const [tranches,        setTranches]        = useState<TranchePaiementResponse[]>([]);
  const [tranchesLoading, setTranchesLoading] = useState(false);
  const [historique,      setHistorique]      = useState<HistoriquePeriodeResponse[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(false);

  // ── Modal states ──
  const [isEditOpen,        setIsEditOpen]        = useState(false);
  const [isAddMembreOpen,   setIsAddMembreOpen]   = useState(false);
  const [addingTranche,     setAddingTranche]     = useState<ContributionResponse | null>(null);
  const [viewingTranches,   setViewingTranches]   = useState<ContributionResponse | null>(null);
  const [confirmingContrib, setConfirmingContrib] = useState<ContributionResponse | null>(null);
  const [rejectingContrib,  setRejectingContrib]  = useState<ContributionResponse | null>(null);

  // ── Action loading states ──
  const [isEditing,              setIsEditing]              = useState(false);
  const [editError,              setEditError]              = useState('');
  const [isAddingMembre,         setIsAddingMembre]         = useState(false);
  const [addMembreError,         setAddMembreError]         = useState('');
  const [isAddingTranche,        setIsAddingTranche]        = useState(false);
  const [addTrancheError,        setAddTrancheError]        = useState('');
  const [isConfirmingContrib,    setIsConfirmingContrib]    = useState(false);
  const [confirmContribError,    setConfirmContribError]    = useState('');
  const [isGenerating,           setIsGenerating]           = useState(false);
  const [generateError,          setGenerateError]          = useState('');
  const [removingMembreId,       setRemovingMembreId]       = useState<string | null>(null);
  const [settingTresorierMembre, setSettingTresorierMembre] = useState<string | null>(null);
  const [isRejecting,            setIsRejecting]            = useState(false);
  const [rejectError,            setRejectError]            = useState('');
  const [membresError,           setMembresError]           = useState('');

  // ── Forms ──
  const editForm      = useForm<EditForm>({ resolver: zodResolver(editSchema) });
  const addMembreForm = useForm<AddMembreForm>({ resolver: zodResolver(addMembreSchema) });
  const trancheForm   = useForm<TrancheForm>({ resolver: zodResolver(trancheSchema) });
  const confirmForm   = useForm<ConfirmForm>({ resolver: zodResolver(confirmSchema) });
  const rejectForm    = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) });

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setPageError('');
    setMembresError('');
    try {
      let m: MembreResponse[] = [];
      try {
        m = await cotisationsService.getGroupeMembres(groupeId);
      } catch (membErr) {
        setMembresError(parseApiError(membErr));
      }

      const [g, s] = await Promise.all([
        cotisationsService.getGroupe(groupeId),
        cotisationsService.getGroupeSummary(groupeId, selectedPeriode).catch(() => null),
      ]);
      setGroupe(g);
      setMembres(m);
      setSummary(s);

      // Resolve users not in store (for the "add member" select only)
      const baseUsers  = storeUsersRef.current;
      const knownIds   = new Set(baseUsers.map(u => u.id));
      const missingIds = m.map(mb => mb.locataireId).filter(id => !knownIds.has(id));
      if (missingIds.length > 0) {
        const extra = await Promise.all(missingIds.map(id => userService.getById(id).catch(() => null)));
        setPageUsers([...baseUsers, ...extra.filter((u): u is User => u !== null)]);
      } else {
        setPageUsers(baseUsers);
      }
    } catch (err) {
      setPageError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [groupeId, selectedPeriode]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Historique: period-independent, loaded once per groupe
  useEffect(() => {
    setHistoriqueLoading(true);
    cotisationsService.getGroupeHistorique(groupeId)
      .then(setHistorique)
      .catch(() => {})
      .finally(() => setHistoriqueLoading(false));
  }, [groupeId]);

  // Merge store users when they finish loading
  useEffect(() => {
    setPageUsers(prev => {
      const storeIds = new Set(storeUsers.map(u => u.id));
      const extras   = prev.filter(u => !storeIds.has(u.id));
      return [...storeUsers, ...extras];
    });
  }, [storeUsers]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const membreLocataireIds  = membres.map(m => m.locataireId);
  const availableLocataires = pageUsers.filter(
    (u: User) => u.role === 'LOCATAIRE' && (membresError ? true : !membreLocataireIds.includes(u.id))
  );

  const periodes = cotisationsService.generatePeriodes(14);

  const collectePercent = summary && summary.totalAttendu > 0
    ? Math.round((summary.totalCollecte / summary.totalAttendu) * 100)
    : 0;

  const progressColor = collectePercent >= 80 ? 'bg-emerald-500'
    : collectePercent >= 50 ? 'bg-amber-400'
    : 'bg-red-400';

  const canGenerer = groupe?.statut === 'ACTIF';

  // ── Action handlers ──────────────────────────────────────────────────────

  const handleOpenEdit = () => {
    if (!groupe) return;
    editForm.reset({
      nom:              groupe.nom,
      description:      groupe.description ?? '',
      montantParMembre: groupe.montantParMembre,
      statut:           groupe.statut,
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const onEditSubmit = async (data: EditForm) => {
    setEditError('');
    setIsEditing(true);
    try {
      const updated = await cotisationsService.updateGroupe(groupeId, {
        nom:              data.nom,
        description:      data.description || undefined,
        montantParMembre: data.montantParMembre,
        statut:           data.statut,
      });
      setGroupe(updated);
      setIsEditOpen(false);
    } catch (err) {
      setEditError(parseApiError(err));
    } finally {
      setIsEditing(false);
    }
  };

  const onAddMembreSubmit = async (data: AddMembreForm) => {
    setAddMembreError('');
    setIsAddingMembre(true);
    try {
      const membre = await cotisationsService.addMembre(groupeId, data.locataireId);
      setMembres(prev => [...prev, membre]);
      setIsAddMembreOpen(false);
      addMembreForm.reset();
    } catch (err) {
      setAddMembreError(parseApiError(err));
    } finally {
      setIsAddingMembre(false);
    }
  };

  const handleRemoveMembre = async (membreId: string) => {
    setRemovingMembreId(membreId);
    try {
      await cotisationsService.removeMembre(groupeId, membreId);
      setMembres(prev => prev.filter(m => m.id !== membreId));
    } catch { /* noop */ }
    finally { setRemovingMembreId(null); }
  };

  const handleSetTresorier = async (membreId: string) => {
    setSettingTresorierMembre(membreId);
    try {
      await cotisationsService.setTresorier(groupeId, membreId);
      setMembres(prev => prev.map(m => ({ ...m, estTresorier: m.id === membreId })));
    } catch { /* noop */ }
    finally { setSettingTresorierMembre(null); }
  };

  const handleOpenReject = (c: ContributionResponse) => {
    rejectForm.reset();
    setRejectError('');
    setRejectingContrib(c);
  };

  const onRejectSubmit = async (data: RejectForm) => {
    if (!rejectingContrib) return;
    setRejectError('');
    setIsRejecting(true);
    try {
      const updated = await cotisationsService.rejectContribution(rejectingContrib.id, data.motif || undefined);
      setSummary(prev => prev ? {
        ...prev,
        contributions: prev.contributions.map(c => c.id === updated.id ? { ...c, ...updated } : c),
      } : prev);
      setRejectingContrib(null);
    } catch (err) {
      setRejectError(parseApiError(err));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleGenerer = async () => {
    setGenerateError('');
    setIsGenerating(true);
    try {
      await cotisationsService.genererContributions(groupeId, selectedPeriode);
      const [newSummary] = await Promise.all([
        cotisationsService.getGroupeSummary(groupeId, selectedPeriode),
        cotisationsService.getGroupeHistorique(groupeId).then(setHistorique).catch(() => {}),
      ]);
      setSummary(newSummary);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setGenerateError('Les contributions ont déjà été générées pour cette période.');
        cotisationsService.getGroupeSummary(groupeId, selectedPeriode).then(setSummary).catch(() => null);
      } else {
        setGenerateError(parseApiError(err));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenTranche = (c: ContributionResponse) => {
    trancheForm.reset({ datePaiement: new Date().toISOString().split('T')[0] });
    setAddTrancheError('');
    setAddingTranche(c);
  };

  const onTrancheSubmit = async (data: TrancheForm) => {
    if (!addingTranche) return;
    if (data.montant > addingTranche.montantRestant) {
      trancheForm.setError('montant', { message: `Le montant dépasse le reste dû (${formatFCFA(addingTranche.montantRestant)})` });
      return;
    }
    setAddTrancheError('');
    setIsAddingTranche(true);
    try {
      const result = await cotisationsService.addTranche(addingTranche.id, {
        montant:      data.montant,
        referenceId:  data.referenceId  || undefined,
        datePaiement: data.datePaiement ? new Date(data.datePaiement).toISOString() : undefined,
      });
      setSummary(prev => prev ? {
        ...prev,
        contributions: prev.contributions.map(c =>
          c.id === result.contribution.id ? { ...c, ...result.contribution } : c
        ),
        totalCollecte:          prev.totalCollecte   + result.tranche.montant,
        totalEnAttente:         prev.totalEnAttente  - result.tranche.montant,
        nombreMembresPayes:     result.contribution.statut === 'PAYE' ? prev.nombreMembresPayes + 1 : prev.nombreMembresPayes,
        nombreMembresEnAttente: result.contribution.statut === 'PAYE' ? prev.nombreMembresEnAttente - 1 : prev.nombreMembresEnAttente,
      } : prev);
      setAddingTranche(null);
    } catch (err) {
      setAddTrancheError(parseApiError(err));
    } finally {
      setIsAddingTranche(false);
    }
  };

  const handleViewTranches = async (c: ContributionResponse) => {
    setViewingTranches(c);
    setTranches([]);
    setTranchesLoading(true);
    try {
      setTranches(await cotisationsService.getTranches(c.id));
    } catch { setTranches([]); }
    finally { setTranchesLoading(false); }
  };

  const handleOpenConfirmContrib = (c: ContributionResponse) => {
    confirmForm.reset({ datePaiement: new Date().toISOString().split('T')[0] });
    setConfirmContribError('');
    setConfirmingContrib(c);
  };

  const onConfirmContribSubmit = async (data: ConfirmForm) => {
    if (!confirmingContrib) return;
    setConfirmContribError('');
    setIsConfirmingContrib(true);
    try {
      const updated = await cotisationsService.confirmContribution(confirmingContrib.id, {
        referenceId:  data.referenceId  || undefined,
        datePaiement: data.datePaiement ? new Date(data.datePaiement).toISOString() : undefined,
      });
      setSummary(prev => prev ? {
        ...prev,
        contributions:          prev.contributions.map(c => c.id === updated.id ? { ...c, ...updated } : c),
        totalCollecte:          prev.totalCollecte + confirmingContrib.montantRestant,
        totalEnAttente:         prev.totalEnAttente - confirmingContrib.montantRestant,
        nombreMembresPayes:     prev.nombreMembresPayes + 1,
        nombreMembresEnAttente: prev.nombreMembresEnAttente - 1,
      } : prev);
      setConfirmingContrib(null);
    } catch (err) {
      setConfirmContribError(parseApiError(err));
    } finally {
      setIsConfirmingContrib(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (pageError || !groupe) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-sm text-red-600 font-medium">{pageError || 'Groupe introuvable'}</p>
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-1.5" />Retour
      </Button>
    </div>
  );

  const stCfg        = groupeStatutCfg[groupe.statut];
  const prop         = properties.find(p => p.id === groupe.propertyId);
  const contributions = summary?.contributions ?? [];

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <button
          onClick={() => router.push('/dashboard/cotisations')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux groupes
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{groupe.nom}</h1>
                <Badge className={`text-[9px] font-bold border shrink-0 ${stCfg.cls}`}>{stCfg.label}</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-semibold text-blue-600">{formatFCFA(groupe.montantParMembre)}</span>
                {' '}par membre / mois
                {prop && <> · <span className="text-slate-400">{prop.titre}</span></>}
              </p>
              {groupe.description && <p className="text-xs text-slate-400 mt-1">{groupe.description}</p>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenEdit} className="self-start shrink-0 gap-1.5">
            <Edit2 className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </div>
      </motion.div>

      {/* ── Summary + Members ─────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Summary card */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Résumé — {formatPeriode(selectedPeriode)}
          </h2>
          {summary ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                {([
                  { label: 'Attendu',  value: summary.totalAttendu,   cls: 'text-slate-700' },
                  { label: 'Collecté', value: summary.totalCollecte,  cls: 'text-emerald-600' },
                  { label: 'Restant',  value: summary.totalEnAttente, cls: 'text-amber-600' },
                ] as const).map(({ label, value, cls }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
                    <p className={`text-sm font-extrabold leading-tight ${cls}`}>{formatFCFA(value)}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500 font-medium">Taux de collecte</span>
                  <span className="text-xs font-bold text-slate-700">{collectePercent}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                    style={{ width: `${Math.min(collectePercent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">
                    {summary.nombreMembresPayes} soldé{summary.nombreMembresPayes !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {summary.nombreMembresEnAttente} en attente
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Aucun résumé disponible pour cette période.</p>
          )}
        </Card>

        {/* Members card */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Membres ({membres.length})
            </h2>
          </div>

          {membresError && (
            <div className="flex items-start gap-2 mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>Impossible de charger les membres : {membresError}</span>
              <button onClick={loadAll} className="ml-auto text-amber-600 hover:text-amber-800 underline shrink-0">Réessayer</button>
            </div>
          )}

          <div className="flex-1 space-y-2 min-h-0">
            {!membresError && membres.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Aucun membre dans ce groupe.</p>
            ) : (
              membres.map(m => {
                const initials    = `${m.prenom?.[0] ?? '?'}${m.nom?.[0] ?? ''}`;
                const displayName = (m.prenom || m.nom)
                  ? `${m.prenom ?? ''} ${m.nom ?? ''}`.trim()
                  : m.locataireId.slice(0, 8) + '…';
                const isRemoving  = removingMembreId       === m.id;
                const isSetTresor = settingTresorierMembre === m.id;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                        {m.estTresorier && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Crown className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-600">Trésorier</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!m.estTresorier && (
                        <button
                          title="Désigner comme trésorier"
                          disabled={!!settingTresorierMembre}
                          onClick={() => handleSetTresorier(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-40"
                        >
                          {isSetTresor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      <button
                        title={m.estTresorier ? 'Désignez un autre trésorier d\'abord' : 'Retirer du groupe'}
                        disabled={m.estTresorier || !!removingMembreId}
                        onClick={() => !m.estTresorier && handleRemoveMembre(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Button
            variant="outline" size="sm"
            onClick={() => { setIsAddMembreOpen(true); addMembreForm.reset(); setAddMembreError(''); }}
            className="mt-4 gap-1.5 self-start"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un membre
          </Button>
        </Card>
      </motion.div>

      {/* ── Contributions table ───────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Contributions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Cliquez sur une ligne pour voir l&apos;historique des tranches.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={selectedPeriode}
                  onChange={e => setSelectedPeriode(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-slate-700 appearance-none cursor-pointer"
                >
                  {periodes.map(p => <option key={p} value={p}>{formatPeriode(p)}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
              <Button
                size="sm" onClick={handleGenerer}
                disabled={!canGenerer || isGenerating}
                className="gap-1.5"
                title={!canGenerer ? 'Le groupe doit être actif' : ''}
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Générer les avis
              </Button>
            </div>
          </div>

          {/* Generate message (info for 409, error otherwise) */}
          {generateError && (
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-800 font-medium">{generateError}</p>
              <button onClick={() => setGenerateError('')} className="ml-auto text-amber-400 hover:text-amber-600">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                  <th className="px-5 py-3.5">Membre</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Progression</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contributions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <ListOrdered className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">Aucune contribution pour {formatPeriode(selectedPeriode)}</p>
                      {canGenerer && (
                        <p className="text-xs mt-1">Cliquez sur &quot;Générer les avis&quot; pour créer les contributions.</p>
                      )}
                    </td>
                  </tr>
                ) : contributions.map((c, i) => {
                  const scfg        = contribStatutCfg[c.statut];
                  const hasTranches = c.statut === 'PARTIEL' || c.statut === 'PAYE';
                  const progPct     = c.montant > 0 ? Math.round((c.montantPaye / c.montant) * 100) : 0;
                  const isActionable = c.statut === 'EN_ATTENTE' || c.statut === 'PARTIEL';
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`transition-colors ${hasTranches ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                      onClick={() => hasTranches && handleViewTranches(c)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">
                          {[c.membrePrenom, c.membreNom].filter(Boolean).join(' ') || '—'}
                        </p>
                        {c.referenceId && (
                          <p className="text-[10px] font-mono text-slate-400">{c.referenceId}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={`text-[9px] font-bold border ${scfg.cls}`}>{scfg.label}</Badge>
                        {c.statut === 'REJETE' && c.motifRejet && (
                          <p className="text-[10px] text-red-500 mt-0.5 max-w-[160px] truncate" title={c.motifRejet}>
                            {c.motifRejet}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.statut === 'PAYE' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                              style={{ width: `${progPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">
                            {formatFCFA(c.montantPaye)} / {formatFCFA(c.montant)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isActionable && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleOpenTranche(c)}
                              className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold text-xs"
                            >
                              <Banknote className="h-3.5 w-3.5" />
                              +Tranche
                            </Button>
                          )}
                          {isActionable && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenConfirmContrib(c)}
                              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Confirmer
                            </Button>
                          )}
                          {isActionable && (
                            <button
                              title="Rejeter la contribution"
                              onClick={() => handleOpenReject(c)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {hasTranches && (
                            <button
                              title="Voir l'historique des tranches"
                              onClick={() => handleViewTranches(c)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* ── Historique des périodes ────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Historique des périodes
            </h2>
            {historiqueLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          {!historiqueLoading && historique.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400">Aucune période enregistrée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                    <th className="px-5 py-3">Période</th>
                    <th className="px-5 py-3">Collecte</th>
                    <th className="px-5 py-3 text-center">Soldés</th>
                    <th className="px-5 py-3 text-center">Partiels</th>
                    <th className="px-5 py-3 text-center">En attente</th>
                    <th className="px-5 py-3 text-center">Rejetés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {historique.map(h => {
                    const pct = h.totalAttendu > 0
                      ? Math.round((h.totalCollecte / h.totalAttendu) * 100)
                      : 0;
                    return (
                      <tr key={h.periode} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{formatPeriode(h.periode)}</p>
                          <p className="text-[10px] text-slate-400">{h.nombreMembres} membre{h.nombreMembres !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{pct}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatFCFA(h.totalCollecte)} / {formatFCFA(h.totalAttendu)}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-bold ${h.nombrePaye > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{h.nombrePaye}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-bold ${h.nombrePartiel > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{h.nombrePartiel}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-bold ${h.nombreEnAttente > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{h.nombreEnAttente}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-bold ${h.nombreRejete > 0 ? 'text-red-600' : 'text-slate-400'}`}>{h.nombreRejete}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── EDIT GROUPE ─── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modifier le groupe">
        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="eg-nom">Nom *</Label>
            <Input id="eg-nom" {...editForm.register('nom')} disabled={isEditing}
              className={editForm.formState.errors.nom ? 'border-red-400' : ''} />
            {editForm.formState.errors.nom && <p className="text-xs text-red-500">{editForm.formState.errors.nom.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eg-desc">Description</Label>
            <Input id="eg-desc" {...editForm.register('description')} disabled={isEditing} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg-montant">Montant/membre (FCFA) *</Label>
              <Input id="eg-montant" type="number" min="1"
                {...editForm.register('montantParMembre', { valueAsNumber: true })} disabled={isEditing}
                className={editForm.formState.errors.montantParMembre ? 'border-red-400' : ''} />
              {editForm.formState.errors.montantParMembre && <p className="text-xs text-red-500">{editForm.formState.errors.montantParMembre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg-statut">Statut *</Label>
              <select id="eg-statut" {...editForm.register('statut')} disabled={isEditing}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 h-10">
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </div>
          </div>
          {editError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{editError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)} disabled={isEditing}>Annuler</Button>
            <Button type="submit" disabled={isEditing} className="gap-1.5">
              {isEditing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── ADD MEMBRE ─── */}
      <Modal isOpen={isAddMembreOpen} onClose={() => setIsAddMembreOpen(false)} title="Ajouter un membre">
        <form onSubmit={addMembreForm.handleSubmit(onAddMembreSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="am-loc">Locataire *</Label>
            {pageUsers.filter(u => u.role === 'LOCATAIRE').length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-700">
                  Aucun locataire trouvé. Créez d&apos;abord un compte locataire via <strong>Locataires</strong>.
                </p>
              </div>
            ) : availableLocataires.length === 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700">Tous les locataires sont déjà membres de ce groupe.</p>
              </div>
            ) : (
              <select id="am-loc" {...addMembreForm.register('locataireId')} disabled={isAddingMembre}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700">
                <option value="">— Sélectionner un locataire —</option>
                {availableLocataires.map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom} · {u.email}</option>
                ))}
              </select>
            )}
            {addMembreForm.formState.errors.locataireId && (
              <p className="text-xs text-red-500">{addMembreForm.formState.errors.locataireId.message}</p>
            )}
          </div>
          {addMembreError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{addMembreError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAddMembreOpen(false)} disabled={isAddingMembre}>Annuler</Button>
            <Button
              type="submit"
              disabled={isAddingMembre || (availableLocataires.length === 0 && pageUsers.filter(u => u.role === 'LOCATAIRE').length === 0)}
              className="gap-1.5"
            >
              {isAddingMembre && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAddingMembre ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── ADD TRANCHE ─── */}
      <Modal isOpen={!!addingTranche} onClose={() => setAddingTranche(null)} title="Ajouter une tranche de paiement">
        {addingTranche && (
          <form onSubmit={trancheForm.handleSubmit(onTrancheSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Locataire</span>
                <span className="font-bold text-slate-800">
                  {[addingTranche.membrePrenom, addingTranche.membreNom].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total dû</span>
                <span className="font-bold text-slate-800">{formatFCFA(addingTranche.montant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Déjà payé</span>
                <span className="font-semibold text-emerald-700">{formatFCFA(addingTranche.montantPaye)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="font-bold text-slate-600">Reste dû</span>
                <span className="font-extrabold text-amber-700">{formatFCFA(addingTranche.montantRestant)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tr-montant">Montant de la tranche (FCFA) *</Label>
              <Input id="tr-montant" type="number" min="1" max={addingTranche.montantRestant}
                placeholder={`Max : ${formatFCFA(addingTranche.montantRestant)}`}
                {...trancheForm.register('montant', { valueAsNumber: true })} disabled={isAddingTranche}
                className={trancheForm.formState.errors.montant ? 'border-red-400' : ''} />
              {trancheForm.formState.errors.montant && <p className="text-xs text-red-500">{trancheForm.formState.errors.montant.message}</p>}
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
              <Button variant="outline" type="button" onClick={() => setAddingTranche(null)} disabled={isAddingTranche}>Annuler</Button>
              <Button type="submit" disabled={isAddingTranche} className="gap-1.5">
                {isAddingTranche && <Loader2 className="h-4 w-4 animate-spin" />}
                {isAddingTranche ? 'Enregistrement...' : 'Enregistrer la tranche'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── VIEW TRANCHES ─── */}
      <Modal isOpen={!!viewingTranches} onClose={() => setViewingTranches(null)} title="Historique des tranches">
        {viewingTranches && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Locataire</span>
                <span className="font-bold text-slate-800">
                  {[viewingTranches.membrePrenom, viewingTranches.membreNom].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Période</span>
                <span className="font-semibold text-slate-700">{formatPeriode(viewingTranches.periode)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="font-bold text-slate-700">
                  Payé : {formatFCFA(viewingTranches.montantPaye)} / {formatFCFA(viewingTranches.montant)}
                </span>
                <Badge className={`text-[9px] font-bold border ${contribStatutCfg[viewingTranches.statut].cls}`}>
                  {contribStatutCfg[viewingTranches.statut].label}
                </Badge>
              </div>
            </div>
            {tranchesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : tranches.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucune tranche enregistrée.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tranches.map(t => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{formatFCFA(t.montant)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(t.datePaiement)}</p>
                    </div>
                    {t.referenceId && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {t.referenceId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setViewingTranches(null)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── CONFIRM CONTRIBUTION ─── */}
      <Modal isOpen={!!confirmingContrib} onClose={() => setConfirmingContrib(null)} title="Confirmer le paiement complet">
        {confirmingContrib && (
          <form onSubmit={confirmForm.handleSubmit(onConfirmContribSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Locataire</span>
                <span className="font-bold text-slate-800">
                  {[confirmingContrib.membrePrenom, confirmingContrib.membreNom].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant total</span>
                <span className="font-extrabold text-emerald-700">{formatFCFA(confirmingContrib.montant)}</span>
              </div>
            </div>
            <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Le statut passera à <strong>Soldé</strong>. Cette action est irréversible.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cc-date">Date de paiement</Label>
                <Input id="cc-date" type="date" {...confirmForm.register('datePaiement')} disabled={isConfirmingContrib} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc-ref">Référence <span className="text-slate-400 font-normal">(opt.)</span></Label>
                <Input id="cc-ref" placeholder="WAVE-001" {...confirmForm.register('referenceId')} disabled={isConfirmingContrib} />
              </div>
            </div>
            {confirmContribError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{confirmContribError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setConfirmingContrib(null)} disabled={isConfirmingContrib}>Annuler</Button>
              <Button type="submit" disabled={isConfirmingContrib} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isConfirmingContrib && <Loader2 className="h-4 w-4 animate-spin" />}
                {isConfirmingContrib ? 'Confirmation...' : 'Confirmer le paiement'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── REJECT CONTRIBUTION ─── */}
      <Modal isOpen={!!rejectingContrib} onClose={() => setRejectingContrib(null)} title="Rejeter la contribution">
        {rejectingContrib && (
          <form onSubmit={rejectForm.handleSubmit(onRejectSubmit)} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Locataire</span>
                <span className="font-bold text-slate-800">
                  {[rejectingContrib.membrePrenom, rejectingContrib.membreNom].filter(Boolean).join(' ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant</span>
                <span className="font-bold text-slate-800">{formatFCFA(rejectingContrib.montant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Période</span>
                <span className="font-semibold text-slate-700">{formatPeriode(rejectingContrib.periode)}</span>
              </div>
            </div>
            <div className="flex gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                La contribution sera marquée <strong>Rejetée</strong>. Le locataire devra re-soumettre un paiement.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rj-motif">
                Motif du rejet <span className="text-slate-400 font-normal">(opt. — 500 caractères max)</span>
              </Label>
              <textarea
                id="rj-motif"
                rows={3}
                placeholder="Ex : Chèque sans provision, référence incorrecte…"
                {...rejectForm.register('motif')}
                disabled={isRejecting}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 resize-none disabled:opacity-60"
              />
              {rejectForm.formState.errors.motif && (
                <p className="text-xs text-red-500">{rejectForm.formState.errors.motif.message}</p>
              )}
            </div>
            {rejectError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />{rejectError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setRejectingContrib(null)} disabled={isRejecting}>Annuler</Button>
              <Button type="submit" disabled={isRejecting} className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
                {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRejecting ? 'Rejet...' : 'Rejeter la contribution'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </motion.div>
  );
}
