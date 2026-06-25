import { api } from '@/lib/api';
import type {
  GroupeResponse, MembreResponse, ContributionResponse,
  TranchePaiementResponse, GroupeSummaryResponse, AddTrancheResultResponse,
  HistoriquePeriodeResponse, CotisationStatut, MonGroupeResponse, MonBilanResponse,
} from '@/types/cotisations';

export interface CreateGroupePayload {
  nom: string;
  description?: string;
  montantParMembre: number;
  propertyId?: string;
}

export interface UpdateGroupePayload {
  nom?: string;
  description?: string;
  montantParMembre?: number;
  statut?: CotisationStatut;
}

export interface ConfirmContributionPayload {
  referenceId?: string;
  recuUrl?: string;
  datePaiement?: string;
}

export interface AddTranchePayload {
  montant: number;
  referenceId?: string;
  recuUrl?: string;
  datePaiement?: string;
}

export interface PayerToutPayload {
  referenceId?: string;
  recuUrl?: string;
  datePaiement?: string;
}

export const cotisationsService = {
  // ── Groupes ────────────────────────────────────────────────────────────────
  async getAllGroupes(): Promise<GroupeResponse[]> {
    const { data } = await api.get<GroupeResponse[]>('/cotisations/groupes');
    return data;
  },

  async getGroupe(id: string): Promise<GroupeResponse> {
    const { data } = await api.get<GroupeResponse>(`/cotisations/groupes/${id}`);
    return data;
  },

  async createGroupe(payload: CreateGroupePayload): Promise<GroupeResponse> {
    const { data } = await api.post<GroupeResponse>('/cotisations/groupes', payload);
    return data;
  },

  async updateGroupe(id: string, payload: UpdateGroupePayload): Promise<GroupeResponse> {
    const { data } = await api.patch<GroupeResponse>(`/cotisations/groupes/${id}`, payload);
    return data;
  },

  async getGroupeSummary(id: string, periode?: string): Promise<GroupeSummaryResponse> {
    const { data } = await api.get<GroupeSummaryResponse>(`/cotisations/groupes/${id}/summary`, {
      params: periode ? { periode } : undefined,
    });
    return data;
  },

  // ── Membres ────────────────────────────────────────────────────────────────
  async getGroupeMembres(groupeId: string): Promise<MembreResponse[]> {
    const { data } = await api.get<MembreResponse[]>(`/cotisations/groupes/${groupeId}/membres`);
    return data;
  },

  async addMembre(groupeId: string, locataireId: string): Promise<MembreResponse> {
    const { data } = await api.post<MembreResponse>(`/cotisations/groupes/${groupeId}/membres`, { locataireId });
    return data;
  },

  async setTresorier(groupeId: string, membreId: string): Promise<void> {
    await api.patch(`/cotisations/groupes/${groupeId}/membres/${membreId}/tresorier`);
  },

  async removeMembre(groupeId: string, membreId: string): Promise<void> {
    await api.delete(`/cotisations/groupes/${groupeId}/membres/${membreId}`);
  },

  // ── Contributions ──────────────────────────────────────────────────────────
  async genererContributions(groupeId: string, periode?: string): Promise<ContributionResponse[]> {
    const { data } = await api.post<ContributionResponse[]>(
      `/cotisations/groupes/${groupeId}/contributions/generer`,
      periode ? { periode } : {},
    );
    return data;
  },

  async getContributions(groupeId: string, periode?: string): Promise<ContributionResponse[]> {
    const { data } = await api.get<ContributionResponse[]>(
      `/cotisations/groupes/${groupeId}/contributions`,
      { params: periode ? { periode } : undefined },
    );
    return data;
  },

  async confirmContribution(id: string, payload?: ConfirmContributionPayload): Promise<ContributionResponse> {
    const { data } = await api.patch<ContributionResponse>(`/cotisations/contributions/${id}/confirm`, payload ?? {});
    return data;
  },

  async rejectContribution(id: string, motif?: string): Promise<ContributionResponse> {
    const { data } = await api.patch<ContributionResponse>(
      `/cotisations/contributions/${id}/reject`,
      motif ? { motif } : {},
    );
    return data;
  },

  async getGroupeHistorique(groupeId: string): Promise<HistoriquePeriodeResponse[]> {
    const { data } = await api.get<HistoriquePeriodeResponse[]>(`/cotisations/groupes/${groupeId}/historique`);
    return data;
  },

  // ── Tranches ───────────────────────────────────────────────────────────────
  async addTranche(contributionId: string, payload: AddTranchePayload): Promise<AddTrancheResultResponse> {
    const { data } = await api.post<AddTrancheResultResponse>(
      `/cotisations/contributions/${contributionId}/tranches`,
      payload,
    );
    return data;
  },

  async getTranches(contributionId: string): Promise<TranchePaiementResponse[]> {
    const { data } = await api.get<TranchePaiementResponse[]>(`/cotisations/contributions/${contributionId}/tranches`);
    return data;
  },

  // ── Espace membre (locataire) ──────────────────────────────────────────────
  async getMonGroupes(periode?: string): Promise<MonGroupeResponse[]> {
    const { data } = await api.get<MonGroupeResponse[]>('/cotisations/mon-espace/groupes', {
      params: periode ? { periode } : undefined,
    });
    return data;
  },

  async getMonBilan(periode?: string): Promise<MonBilanResponse> {
    const { data } = await api.get<MonBilanResponse>('/cotisations/mon-espace/bilan', {
      params: periode ? { periode } : undefined,
    });
    return data;
  },

  async payerTout(contributionId: string, payload?: PayerToutPayload): Promise<AddTrancheResultResponse> {
    const { data } = await api.post<AddTrancheResultResponse>(
      `/cotisations/contributions/${contributionId}/payer-tout`,
      payload ?? {},
    );
    return data;
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  getCurrentPeriode(): string {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  },

  generatePeriodes(count = 14): string[] {
    const periodes: string[] = [];
    const now = new Date();
    for (let i = -2; i < count - 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periodes.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
    }
    return periodes;
  },
};
