// Types stricts alignés sur le schéma Prisma

export type Role = 'SUPER_ADMIN' | 'BAILLEUR' | 'GERANT' | 'LOCATAIRE' | 'PRESTATAIRE';

export type TicketStatus = 'OUVERT' | 'ASSIGNE' | 'EN_COURS' | 'RESOLU' | 'CLOTURE';

export type UrgencyLevel = 'FAIBLE' | 'MOYEN' | 'CRITIQUE';

export type PaymentStatus = 'EN_ATTENTE' | 'PAYE' | 'ECHOUE' | 'REJETE';

export type PropertyType = 'APPARTEMENT' | 'STUDIO' | 'VILLA' | 'MAGASIN' | 'AUTRE';

export type NotificationType = 
  | 'TICKET_STATUT_CHANGE' 
  | 'NOUVEAU_TICKET_ASSIGNE' 
  | 'LOYER_DISPONIBLE' 
  | 'PAIEMENT_VALIDE' 
  | 'RAPPEL_IMPAYE';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  titre: string;
  description?: string | null;
  adresse: string;
  ville: string;
  type: PropertyType;
  loyerDeBase: number;
  charges: number;
  estOccupe: boolean;
  bailleurId: string;
  gerantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  dateDebut: string;
  dateFin?: string | null;
  loyerTotal: number;
  estActif: boolean;
  propertyId: string;
  locataireId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  titre: string;
  description: string;
  photos: string[];
  urgence: UrgencyLevel;
  statut: TicketStatus;
  propertyId: string;
  locataireId: string;
  prestataireId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  montant: number;
  datePaiement?: string | null;
  periode: string; // Ex: "06-2026"
  statut: PaymentStatus;
  referenceId?: string | null;
  recuUrl?: string | null;
  contractId: string;
  locataireId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string; // ex: "TICKET_STATUS_UPDATE", "PAYMENT_RECEIVED", "USER_UPDATE"
  table: string;  // ex: "Ticket", "Payment", "User"
  enregistrementId: string;
  details: Record<string, any>;
  ipAdresse?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: NotificationType;
  estLu: boolean;
  userId: string;
  createdAt: string;
}
