export interface DashboardKPIs {
  periode: string;
  financier: {
    loyersAttendus: number;
    loyersEncaisses: number;
    tauxRecouvrement: number;
    depensesDuMois: number;
    soldeNet: number;
  };
  patrimoine: {
    totalBiens: number;
    biensLoues: number;
    biensDisponibles: number;
    tauxOccupation: number;
  };
  activite: {
    contratsActifs: number;
    totalLocataires: number;
    ticketsOuverts: number;
    ticketsUrgents: number;
  };
}

export interface RevenuPoint {
  periode: string;
  loyersEncaisses: number;
  depenses: number;
  solde: number;
}

export interface AlerteLoyer {
  id: string;
  locataire: string;
  bien: string;
  adresse: string;
  montant: number;
  periode: string;
  joursRetard: number;
}

export interface AlerteContrat {
  id: string;
  locataire: string;
  bien: string;
  adresse: string;
  dateFin: string | null;
  joursRestants: number;
}

export interface AlerteTicket {
  id: string;
  titre: string;
  bien: string;
  signalePar: string;
  statut: 'OUVERT' | 'ASSIGNE' | 'EN_COURS';
  createdAt: string;
  joursOuverts: number;
}

export interface AlertesResponse {
  loyersEnRetard: AlerteLoyer[];
  contratsExpirants: AlerteContrat[];
  ticketsUrgents: AlerteTicket[];
  totaux: {
    loyersEnRetard: number;
    contratsExpirants: number;
    ticketsUrgents: number;
  };
}
