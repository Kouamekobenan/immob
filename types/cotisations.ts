export type CotisationStatut = "ACTIF" | "INACTIF" | "ARCHIVE";

export type PaymentStatus = "EN_ATTENTE" | "PARTIEL" | "PAYE" | "REJETE";

export interface GroupeResponse {
  id: string;
  nom: string;
  description: string | null;
  montantParMembre: number;
  statut: CotisationStatut;
  propertyId: string | null;
  createurId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembreResponse {
  id: string;
  groupeId: string;
  locataireId: string;
  nom: string | null;
  prenom: string | null;
  estTresorier: boolean;
  estActif: boolean;
  dateAdhesion: string;
}

export interface ContributionResponse {
  id: string;
  montant: number;
  montantPaye: number;
  montantRestant: number;
  periode: string;
  statut: PaymentStatus;
  datePaiement: string | null;
  referenceId: string | null;
  recuUrl: string | null;
  groupeId: string;
  membreId: string;
  membreNom: string | null;
  membrePrenom: string | null;
  groupeNom: string | null;
  motifRejet: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranchePaiementResponse {
  id: string;
  montant: number;
  datePaiement: string;
  referenceId: string | null;
  recuUrl: string | null;
  contributionId: string;
  createdAt: string;
}

export interface GroupeSummaryResponse {
  totalAttendu: number;
  totalCollecte: number;
  totalEnAttente: number;
  nombreMembresPayes: number;
  nombreMembresEnAttente: number;
  contributions: ContributionResponse[];
}

export interface AddTrancheResultResponse {
  tranche: TranchePaiementResponse;
  contribution: ContributionResponse;
}

export interface HistoriquePeriodeResponse {
  periode: string;
  totalAttendu: number;
  totalCollecte: number;
  totalEnAttente: number;
  nombreMembres: number;
  nombrePaye: number;
  nombrePartiel: number;
  nombreEnAttente: number;
  nombreRejete: number;
}

// ── Espace membre (locataire) ────────────────────────────────────────────────

export interface MonGroupeResponse {
  groupe: GroupeResponse;
  membre: MembreResponse;
  contributionCourante: ContributionResponse | null;
}

export interface MonBilanResponse {
  totalAttendu: number;
  totalPaye: number;
  totalRestant: number;
  contributions: ContributionResponse[];
}
