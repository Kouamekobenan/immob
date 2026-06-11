import { User, Property, Contract, Ticket, Payment, AuditLog, Notification } from '@/types/prisma';

// MOCK USERS
export const mockUsers: User[] = [
  {
    id: 'user-super-admin',
    email: 'superadmin@immob.com',
    nom: 'Dupont',
    prenom: 'Jean-Pierre',
    telephone: '+33 6 12 34 56 78',
    role: 'SUPER_ADMIN',
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z'
  },
  {
    id: 'user-bailleur',
    email: 'bailleur@immob.com',
    nom: 'Martin',
    prenom: 'Alice',
    telephone: '+33 6 98 76 54 32',
    role: 'BAILLEUR',
    createdAt: '2025-01-02T09:00:00Z',
    updatedAt: '2026-06-01T11:00:00Z'
  },
  {
    id: 'user-gerant',
    email: 'gerant@immob.com',
    nom: 'Bernard',
    prenom: 'Marc',
    telephone: '+33 6 45 67 89 01',
    role: 'GERANT',
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 'user-locataire-1',
    email: 'locataire1@immob.com',
    nom: 'Lambert',
    prenom: 'Sophie',
    telephone: '+33 7 89 01 23 45',
    role: 'LOCATAIRE',
    createdAt: '2025-01-10T14:00:00Z',
    updatedAt: '2026-06-01T09:00:00Z'
  },
  {
    id: 'user-locataire-2',
    email: 'locataire2@immob.com',
    nom: 'Moreau',
    prenom: 'Pierre',
    telephone: '+33 7 12 34 56 78',
    role: 'LOCATAIRE',
    createdAt: '2025-02-15T15:00:00Z',
    updatedAt: '2026-06-01T09:30:00Z'
  },
  {
    id: 'user-prestataire-1',
    email: 'prestataire1@immob.com',
    nom: 'Diallo',
    prenom: 'Amadou',
    telephone: '+33 6 34 56 78 90',
    role: 'PRESTATAIRE',
    createdAt: '2025-01-05T08:30:00Z',
    updatedAt: '2026-05-20T16:00:00Z'
  },
  {
    id: 'user-prestataire-2',
    email: 'prestataire2@immob.com',
    nom: 'Dubois',
    prenom: 'Thomas',
    telephone: '+33 6 87 65 43 21',
    role: 'PRESTATAIRE',
    createdAt: '2025-03-10T09:00:00Z',
    updatedAt: '2026-05-22T14:30:00Z'
  }
];

// MOCK PROPERTIES
export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    titre: 'Villa Duplex Chic',
    description: 'Grande villa de standing avec piscine, 4 chambres et jardin arboré.',
    adresse: '12 Avenue des Champs-Élysées',
    ville: 'Paris',
    type: 'VILLA',
    loyerDeBase: 2500,
    charges: 300,
    estOccupe: true,
    bailleurId: 'user-bailleur',
    gerantId: 'user-gerant',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-10T12:00:00Z'
  },
  {
    id: 'prop-2',
    titre: 'Studio Cosy Centre-ville',
    description: 'Studio meublé et équipé au 3ème étage, idéal étudiant ou jeune professionnel.',
    adresse: '45 Rue de la République',
    ville: 'Lyon',
    type: 'STUDIO',
    loyerDeBase: 600,
    charges: 50,
    estOccupe: false,
    bailleurId: 'user-bailleur',
    gerantId: 'user-gerant',
    createdAt: '2025-01-05T10:30:00Z',
    updatedAt: '2025-01-05T10:30:00Z'
  },
  {
    id: 'prop-3',
    titre: 'Appartement T3 Lumineux',
    description: 'Bel appartement traversant avec balcon, cave et parking souterrain sécurisé.',
    adresse: '8 Boulevard de la Liberté',
    ville: 'Lille',
    type: 'APPARTEMENT',
    loyerDeBase: 1100,
    charges: 120,
    estOccupe: true,
    bailleurId: 'user-bailleur',
    gerantId: 'user-gerant',
    createdAt: '2025-01-06T09:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z'
  },
  {
    id: 'prop-4',
    titre: 'Magasin commercial Hyper-centre',
    description: 'Local commercial avec vitrine de 10 mètres, excellente visibilité piétonne.',
    adresse: '18 Rue du Commerce',
    ville: 'Bordeaux',
    type: 'MAGASIN',
    loyerDeBase: 3500,
    charges: 450,
    estOccupe: false,
    bailleurId: 'user-bailleur',
    gerantId: null,
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-08T11:00:00Z'
  }
];

// MOCK CONTRACTS
export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    dateDebut: '2025-01-10T00:00:00Z',
    dateFin: '2028-01-09T23:59:59Z',
    loyerTotal: 2800, // 2500 + 300
    estActif: true,
    propertyId: 'prop-1',
    locataireId: 'user-locataire-1',
    createdAt: '2025-01-10T12:00:00Z',
    updatedAt: '2025-01-10T12:00:00Z'
  },
  {
    id: 'contract-2',
    dateDebut: '2025-02-15T00:00:00Z',
    dateFin: '2026-02-14T23:59:59Z',
    loyerTotal: 1220, // 1100 + 120
    estActif: true,
    propertyId: 'prop-3',
    locataireId: 'user-locataire-2',
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T10:00:00Z'
  }
];

// MOCK PAYMENTS
export const mockPayments: Payment[] = [
  // Sophie Lambert (Contract 1, Montant 2800)
  {
    id: 'pay-1',
    montant: 2800,
    datePaiement: '2026-04-03T14:22:00Z',
    periode: '04-2026',
    statut: 'PAYE',
    referenceId: 'ref_stripe_1102931',
    recuUrl: '/receipts/recu-04-2026-c1.pdf',
    contractId: 'contract-1',
    locataireId: 'user-locataire-1',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-03T14:22:00Z'
  },
  {
    id: 'pay-2',
    montant: 2800,
    datePaiement: '2026-05-02T10:15:00Z',
    periode: '05-2026',
    statut: 'PAYE',
    referenceId: 'ref_wave_8719231',
    recuUrl: '/receipts/recu-05-2026-c1.pdf',
    contractId: 'contract-1',
    locataireId: 'user-locataire-1',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-02T10:15:00Z'
  },
  {
    id: 'pay-3',
    montant: 2800,
    datePaiement: null,
    periode: '06-2026',
    statut: 'EN_ATTENTE',
    referenceId: null,
    recuUrl: null,
    contractId: 'contract-1',
    locataireId: 'user-locataire-1',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },

  // Pierre Moreau (Contract 2, Montant 1220)
  {
    id: 'pay-4',
    montant: 1220,
    datePaiement: '2026-05-05T09:40:00Z',
    periode: '05-2026',
    statut: 'PAYE',
    referenceId: 'ref_stripe_7712399',
    recuUrl: '/receipts/recu-05-2026-c2.pdf',
    contractId: 'contract-2',
    locataireId: 'user-locataire-2',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-05T09:40:00Z'
  },
  {
    id: 'pay-5',
    montant: 1220,
    datePaiement: null,
    periode: '06-2026',
    statut: 'EN_ATTENTE',
    referenceId: null,
    recuUrl: null,
    contractId: 'contract-2',
    locataireId: 'user-locataire-2',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  }
];

// MOCK TICKETS
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    titre: 'Fuite sous évier cuisine',
    description: 'De l\'eau s\'écoule abondamment sous l\'évier de la cuisine lors de l\'utilisation du lave-vaisselle ou du robinet. Le meuble en bois commence à gonfler.',
    photos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&auto=format&fit=crop&q=60'
    ],
    urgence: 'MOYEN',
    statut: 'RESOLU',
    propertyId: 'prop-1',
    locataireId: 'user-locataire-1',
    prestataireId: 'user-prestataire-1',
    createdAt: '2026-05-10T14:30:00Z',
    updatedAt: '2026-05-12T16:45:00Z'
  },
  {
    id: 'ticket-2',
    titre: 'Panne totale de chauffage et eau chaude',
    description: 'La chaudière affiche un code erreur E04. La pression est à zéro et la relance manuelle ne fonctionne pas. Il fait 14 degrés dans l\'appartement.',
    photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=60'
    ],
    urgence: 'CRITIQUE',
    statut: 'OUVERT',
    propertyId: 'prop-3',
    locataireId: 'user-locataire-2',
    prestataireId: null,
    createdAt: '2026-06-03T18:20:00Z',
    updatedAt: '2026-06-03T18:20:00Z'
  },
  {
    id: 'ticket-3',
    titre: 'Serrure porte entrée défectueuse',
    description: 'La clé tourne dans le vide une fois sur deux. Risque de rester bloqué dehors à tout moment.',
    photos: [],
    urgence: 'FAIBLE',
    statut: 'EN_COURS',
    propertyId: 'prop-1',
    locataireId: 'user-locataire-1',
    prestataireId: 'user-prestataire-2',
    createdAt: '2026-06-02T08:00:00Z',
    updatedAt: '2026-06-02T11:00:00Z'
  }
];

// MOCK AUDIT LOGS
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'USER_LOGIN',
    table: 'users',
    enregistrementId: 'user-super-admin',
    details: { email: 'superadmin@immob.com', status: 'SUCCESS' },
    ipAdresse: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0',
    userId: 'user-super-admin',
    createdAt: '2026-06-04T08:15:00Z'
  },
  {
    id: 'log-2',
    action: 'PAYMENT_RECEIVED',
    table: 'payments',
    enregistrementId: 'pay-2',
    details: { montant: 2800, periode: '05-2026', reference: 'ref_wave_8719231' },
    ipAdresse: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    userId: 'user-locataire-1',
    createdAt: '2026-05-02T10:15:00Z'
  },
  {
    id: 'log-3',
    action: 'TICKET_CREATE',
    table: 'tickets',
    enregistrementId: 'ticket-2',
    details: { titre: 'Panne totale de chauffage et eau chaude', urgence: 'CRITIQUE' },
    ipAdresse: '192.168.1.115',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    userId: 'user-locataire-2',
    createdAt: '2026-06-03T18:20:00Z'
  },
  {
    id: 'log-4',
    action: 'TICKET_STATUS_UPDATE',
    table: 'tickets',
    enregistrementId: 'ticket-1',
    details: { ancienStatut: 'EN_COURS', nouveauStatut: 'RESOLU', prestataireId: 'user-prestataire-1' },
    ipAdresse: '192.168.1.77',
    userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:126.0)',
    userId: 'user-prestataire-1',
    createdAt: '2026-05-12T16:45:00Z'
  }
];

// MOCK NOTIFICATIONS
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    titre: 'Loyer payé avec succès',
    message: 'Votre paiement de 2800 € pour la période 05-2026 a été validé. La quittance est disponible.',
    type: 'PAIEMENT_VALIDE',
    estLu: true,
    userId: 'user-locataire-1',
    createdAt: '2026-05-02T10:15:00Z'
  },
  {
    id: 'notif-2',
    titre: 'Alerte : Loyer impayé',
    message: 'Le loyer du mois de Juin 2026 est en attente de paiement depuis le 01/06.',
    type: 'RAPPEL_IMPAYE',
    estLu: false,
    userId: 'user-locataire-2',
    createdAt: '2026-06-02T07:00:00Z'
  },
  {
    id: 'notif-3',
    titre: 'Nouveau ticket de maintenance',
    message: 'Le locataire Pierre Moreau a signalé une panne critique de chauffage.',
    type: 'NOUVEAU_TICKET_ASSIGNE', // Notification d'alerte pour le gérant
    estLu: false,
    userId: 'user-gerant',
    createdAt: '2026-06-03T18:21:00Z'
  },
  {
    id: 'notif-4',
    titre: 'Intervention assignée',
    message: 'Une intervention sur la serrure de la Villa Duplex Chic vous a été attribuée.',
    type: 'NOUVEAU_TICKET_ASSIGNE',
    estLu: false,
    userId: 'user-prestataire-2',
    createdAt: '2026-06-02T11:00:00Z'
  }
];
