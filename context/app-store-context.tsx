'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, Property, Contract, Ticket, Payment, AuditLog, Notification, 
  Role, TicketStatus, PaymentStatus, UrgencyLevel, NotificationType 
} from '@/types/prisma';
import { 
  mockUsers, mockProperties, mockContracts, mockPayments, mockTickets, 
  mockAuditLogs, mockNotifications 
} from '@/lib/mock-data';

interface AppStoreContextType {
  currentUser: User | null;
  users: User[];
  properties: Property[];
  contracts: Contract[];
  payments: Payment[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  
  // Actions
  login: (email: string) => User | null;
  loginAsUser: (userId: string) => void;
  logout: () => void;
  
  // User Management
  updateUser: (user: User) => void;
  
  // Properties
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  
  // Contracts
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'estActif'>) => void;
  terminateContract: (contractId: string) => void;
  
  // Payments
  payPeriod: (paymentId: string, referenceId: string) => void;
  validatePayment: (paymentId: string) => void;
  
  // Tickets
  addTicket: (ticket: Omit<Ticket, 'id' | 'statut' | 'createdAt' | 'updatedAt'>) => void;
  assignTicket: (ticketId: string, prestataireId: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  
  // Notifications
  addNotification: (userId: string, titre: string, message: string, type: NotificationType) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('immob_currentUser');
      const storedUsers = localStorage.getItem('immob_users');
      const storedProperties = localStorage.getItem('immob_properties');
      const storedContracts = localStorage.getItem('immob_contracts');
      const storedPayments = localStorage.getItem('immob_payments');
      const storedTickets = localStorage.getItem('immob_tickets');
      const storedAuditLogs = localStorage.getItem('immob_auditLogs');
      const storedNotifications = localStorage.getItem('immob_notifications');

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);
      setProperties(storedProperties ? JSON.parse(storedProperties) : mockProperties);
      setContracts(storedContracts ? JSON.parse(storedContracts) : mockContracts);
      setPayments(storedPayments ? JSON.parse(storedPayments) : mockPayments);
      setTickets(storedTickets ? JSON.parse(storedTickets) : mockTickets);
      setAuditLogs(storedAuditLogs ? JSON.parse(storedAuditLogs) : mockAuditLogs);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : mockNotifications);
      
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  const saveState = (
    newUsers: User[], 
    newProperties: Property[], 
    newContracts: Contract[], 
    newPayments: Payment[], 
    newTickets: Ticket[], 
    newLogs: AuditLog[], 
    newNotifs: Notification[]
  ) => {
    localStorage.setItem('immob_users', JSON.stringify(newUsers));
    localStorage.setItem('immob_properties', JSON.stringify(newProperties));
    localStorage.setItem('immob_contracts', JSON.stringify(newContracts));
    localStorage.setItem('immob_payments', JSON.stringify(newPayments));
    localStorage.setItem('immob_tickets', JSON.stringify(newTickets));
    localStorage.setItem('immob_auditLogs', JSON.stringify(newLogs));
    localStorage.setItem('immob_notifications', JSON.stringify(newNotifs));
  };

  const updateAllStates = (
    u: User[] = users, 
    p: Property[] = properties, 
    c: Contract[] = contracts, 
    pay: Payment[] = payments, 
    t: Ticket[] = tickets, 
    l: AuditLog[] = auditLogs, 
    n: Notification[] = notifications
  ) => {
    setUsers(u);
    setProperties(p);
    setContracts(c);
    setPayments(pay);
    setTickets(t);
    setAuditLogs(l);
    setNotifications(n);
    saveState(u, p, c, pay, t, l, n);
  };

  // Helper for audit logs
  const logAction = (action: string, table: string, recordId: string, details: Record<string, any>, userId = currentUser?.id) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      table,
      enregistrementId: recordId,
      details,
      ipAdresse: '127.0.0.1 (Simulation)',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      userId: userId || null,
      createdAt: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('immob_auditLogs', JSON.stringify(updatedLogs));
  };

  // Helper for notifications
  const triggerNotification = (userId: string, titre: string, message: string, type: NotificationType) => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      titre,
      message,
      type,
      estLu: false,
      userId,
      createdAt: new Date().toISOString()
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    localStorage.setItem('immob_notifications', JSON.stringify(updatedNotifs));
  };

  // AUTH ACTIONS
  const login = (email: string): User | null => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('immob_currentUser', JSON.stringify(foundUser));
      logAction('USER_LOGIN', 'users', foundUser.id, { email: foundUser.email, status: 'SUCCESS' }, foundUser.id);
      return foundUser;
    }
    return null;
  };

  const loginAsUser = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('immob_currentUser', JSON.stringify(foundUser));
      logAction('USER_SIMULATE_SWITCH', 'users', foundUser.id, { role: foundUser.role, email: foundUser.email }, foundUser.id);
    }
  };

  const logout = () => {
    if (currentUser) {
      logAction('USER_LOGOUT', 'users', currentUser.id, { email: currentUser.email });
    }
    setCurrentUser(null);
    localStorage.removeItem('immob_currentUser');
  };

  // USER MANAGEMENT
  const updateUser = (updatedUser: User) => {
    // Exclude password handling naturally as we don't have password field in User model
    const updatedUsers = users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
    
    // If the updated user is the current user, update their session
    if (currentUser && currentUser.id === updatedUser.id) {
      const mergedUser = { ...currentUser, ...updatedUser };
      setCurrentUser(mergedUser);
      localStorage.setItem('immob_currentUser', JSON.stringify(mergedUser));
    }
    
    logAction('USER_UPDATE', 'users', updatedUser.id, { 
      nom: updatedUser.nom, 
      prenom: updatedUser.prenom, 
      role: updatedUser.role 
    });
    
    updateAllStates(updatedUsers);
  };

  // PROPERTIES CRUD
  const addProperty = (propInput: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProp: Property = {
      ...propInput,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedProps = [...properties, newProp];
    
    logAction('PROPERTY_CREATE', 'properties', newProp.id, { titre: newProp.titre, baseRent: newProp.loyerDeBase });
    updateAllStates(users, updatedProps);
  };

  const updateProperty = (updatedProp: Property) => {
    const updatedProps = properties.map(p => p.id === updatedProp.id ? { ...updatedProp, updatedAt: new Date().toISOString() } : p);
    
    logAction('PROPERTY_UPDATE', 'properties', updatedProp.id, { titre: updatedProp.titre });
    updateAllStates(users, updatedProps);
  };

  const deleteProperty = (id: string) => {
    const propertyToDelete = properties.find(p => p.id === id);
    const updatedProps = properties.filter(p => p.id !== id);
    
    logAction('PROPERTY_DELETE', 'properties', id, { titre: propertyToDelete?.titre });
    updateAllStates(users, updatedProps);
  };

  // CONTRACTS MANAGEMENT
  const addContract = (contractInput: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'estActif'>) => {
    const newContract: Contract = {
      ...contractInput,
      id: `contract-${Date.now()}`,
      estActif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Mark associated property as occupied
    const updatedProps = properties.map(p => 
      p.id === contractInput.propertyId ? { ...p, estOccupe: true, updatedAt: new Date().toISOString() } : p
    );
    
    const updatedContracts = [...contracts, newContract];
    
    // Automatically generate a pending payment for the current month
    const currentDate = new Date();
    const currentPeriod = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
    const initialPayment: Payment = {
      id: `pay-${Date.now()}`,
      montant: contractInput.loyerTotal,
      datePaiement: null,
      periode: currentPeriod,
      statut: 'EN_ATTENTE',
      referenceId: null,
      recuUrl: null,
      contractId: newContract.id,
      locataireId: contractInput.locataireId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updatedPayments = [...payments, initialPayment];

    logAction('CONTRACT_CREATE', 'contracts', newContract.id, { 
      propertyId: contractInput.propertyId, 
      locataireId: contractInput.locataireId, 
      loyer: contractInput.loyerTotal 
    });
    
    // Trigger notification for Tenant
    triggerNotification(
      contractInput.locataireId,
      'Nouveau contrat signé',
      `Votre contrat de location pour le bien "${properties.find(p => p.id === contractInput.propertyId)?.titre || 'Logement'}" a été validé.`,
      'LOYER_DISPONIBLE'
    );

    updateAllStates(users, updatedProps, updatedContracts, updatedPayments);
  };

  const terminateContract = (contractId: string) => {
    const contractToTerm = contracts.find(c => c.id === contractId);
    if (!contractToTerm) return;

    const updatedContracts = contracts.map(c => 
      c.id === contractId ? { ...c, estActif: false, updatedAt: new Date().toISOString() } : c
    );
    
    // Mark associated property as vacant
    const updatedProps = properties.map(p => 
      p.id === contractToTerm.propertyId ? { ...p, estOccupe: false, updatedAt: new Date().toISOString() } : p
    );

    logAction('CONTRACT_TERMINATE', 'contracts', contractId, { propertyId: contractToTerm.propertyId });
    updateAllStates(users, updatedProps, updatedContracts);
  };

  // PAYMENTS SIMULATION
  const payPeriod = (paymentId: string, referenceId: string) => {
    const paymentToUpdate = payments.find(p => p.id === paymentId);
    if (!paymentToUpdate) return;

    const updatedPayments = payments.map(p => 
      p.id === paymentId ? { 
        ...p, 
        statut: 'PAYE' as PaymentStatus, // For simulation, tenant's payment marks it as paid directly, or places it EN_ATTENTE validation
        datePaiement: new Date().toISOString(),
        referenceId,
        updatedAt: new Date().toISOString()
      } : p
    );

    logAction('PAYMENT_SUBMITTED', 'payments', paymentId, { 
      montant: paymentToUpdate.montant, 
      referenceId, 
      periode: paymentToUpdate.periode 
    });

    // Notify Manager/Gerant
    const associatedProp = properties.find(p => 
      p.id === (contracts.find(c => c.id === paymentToUpdate.contractId)?.propertyId)
    );
    const gerantId = associatedProp?.gerantId || 'user-gerant';
    
    triggerNotification(
      gerantId,
      'Paiement reçu (À valider)',
      `Un paiement de ${paymentToUpdate.montant} € pour la période ${paymentToUpdate.periode} a été soumis.`,
      'PAIEMENT_VALIDE'
    );

    // Notify tenant that payment is registered
    triggerNotification(
      paymentToUpdate.locataireId,
      'Paiement effectué',
      `Votre paiement pour la période ${paymentToUpdate.periode} a été enregistré avec la référence ${referenceId}.`,
      'PAIEMENT_VALIDE'
    );

    updateAllStates(users, properties, contracts, updatedPayments);
  };

  const validatePayment = (paymentId: string) => {
    const paymentToValidate = payments.find(p => p.id === paymentId);
    if (!paymentToValidate) return;

    const mockReceiptUrl = `/receipts/quittance-${paymentToValidate.periode}-${paymentId.slice(-6)}.pdf`;
    
    const updatedPayments = payments.map(p => 
      p.id === paymentId ? { 
        ...p, 
        statut: 'PAYE' as PaymentStatus, 
        recuUrl: mockReceiptUrl,
        datePaiement: p.datePaiement || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } : p
    );

    logAction('PAYMENT_VALIDATE', 'payments', paymentId, { 
      montant: paymentToValidate.montant, 
      periode: paymentToValidate.periode 
    });

    // Notify Tenant
    triggerNotification(
      paymentToValidate.locataireId,
      'Quittance de loyer disponible',
      `Votre loyer pour la période ${paymentToValidate.periode} a été validé. Votre quittance est téléchargeable.`,
      'PAIEMENT_VALIDE'
    );

    // Notify Bailleur (Owner) of cash flow
    const associatedProp = properties.find(p => 
      p.id === (contracts.find(c => c.id === paymentToValidate.contractId)?.propertyId)
    );
    if (associatedProp) {
      triggerNotification(
        associatedProp.bailleurId,
        'Nouveau revenu encaissé',
        `Le loyer de ${paymentToValidate.montant} € pour le bien "${associatedProp.titre}" a été encaissé.`,
        'PAIEMENT_VALIDE'
      );
    }

    updateAllStates(users, properties, contracts, updatedPayments);
  };

  // TICKETS & MAINTENANCE
  const addTicket = (ticketInput: Omit<Ticket, 'id' | 'statut' | 'createdAt' | 'updatedAt'>) => {
    const newTicket: Ticket = {
      ...ticketInput,
      id: `ticket-${Date.now()}`,
      statut: 'OUVERT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedTickets = [...tickets, newTicket];
    
    logAction('TICKET_CREATE', 'tickets', newTicket.id, { titre: newTicket.titre, urgence: newTicket.urgence });
    
    // Notify Manager/Gerant
    const associatedProp = properties.find(p => p.id === ticketInput.propertyId);
    const gerantId = associatedProp?.gerantId || 'user-gerant';
    
    triggerNotification(
      gerantId,
      'Nouveau incident signalé',
      `Un incident de niveau ${ticketInput.urgence} a été signalé pour le bien "${associatedProp?.titre || 'Logement'}".`,
      'NOUVEAU_TICKET_ASSIGNE'
    );

    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const assignTicket = (ticketId: string, prestataireId: string) => {
    const ticketToAssign = tickets.find(t => t.id === ticketId);
    if (!ticketToAssign) return;

    const updatedTickets = tickets.map(t => 
      t.id === ticketId ? { 
        ...t, 
        statut: 'ASSIGNE' as TicketStatus, 
        prestataireId,
        updatedAt: new Date().toISOString()
      } : t
    );

    logAction('TICKET_ASSIGN', 'tickets', ticketId, { prestataireId });
    
    // Notify Prestataire
    triggerNotification(
      prestataireId,
      'Nouvelle intervention assignée',
      `L'incident "${ticketToAssign.titre}" vous a été assigné. Niveau d'urgence : ${ticketToAssign.urgence}.`,
      'NOUVEAU_TICKET_ASSIGNE'
    );

    // Notify Tenant
    triggerNotification(
      ticketToAssign.locataireId,
      'Incident pris en charge',
      `Un technicien a été mandaté pour régler l'incident : "${ticketToAssign.titre}".`,
      'TICKET_STATUT_CHANGE'
    );

    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus) => {
    const ticketToUpdate = tickets.find(t => t.id === ticketId);
    if (!ticketToUpdate) return;

    const updatedTickets = tickets.map(t => 
      t.id === ticketId ? { 
        ...t, 
        statut: status, 
        updatedAt: new Date().toISOString()
      } : t
    );

    logAction('TICKET_STATUS_UPDATE', 'tickets', ticketId, { ancienStatut: ticketToUpdate.statut, nouveauStatut: status });
    
    // Message context for notifications
    let messageText = `Le statut de votre incident "${ticketToUpdate.titre}" a été modifié : ${status}.`;
    if (status === 'EN_COURS') {
      messageText = `Le prestataire est actuellement en cours d'intervention pour : "${ticketToUpdate.titre}".`;
    } else if (status === 'RESOLU') {
      messageText = `L'incident "${ticketToUpdate.titre}" a été déclaré résolu par le prestataire.`;
    }

    // Notify Tenant
    triggerNotification(
      ticketToUpdate.locataireId,
      'Statut incident mis à jour',
      messageText,
      'TICKET_STATUT_CHANGE'
    );

    // Notify Manager/Gerant if resolved
    if (status === 'RESOLU') {
      const associatedProp = properties.find(p => p.id === ticketToUpdate.propertyId);
      const gerantId = associatedProp?.gerantId || 'user-gerant';
      triggerNotification(
        gerantId,
        'Incident résolu',
        `Le prestataire a résolu l'incident "${ticketToUpdate.titre}" sur le bien "${associatedProp?.titre}".`,
        'TICKET_STATUT_CHANGE'
      );
    }

    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  // NOTIFICATION ACTIONS
  const addNotification = (userId: string, titre: string, message: string, type: NotificationType) => {
    triggerNotification(userId, titre, message, type);
  };

  const markNotificationAsRead = (id: string) => {
    const updatedNotifs = notifications.map(n => n.id === id ? { ...n, estLu: true } : n);
    setNotifications(updatedNotifs);
    localStorage.setItem('immob_notifications', JSON.stringify(updatedNotifs));
  };

  const markAllNotificationsAsRead = (userId: string) => {
    const updatedNotifs = notifications.map(n => n.userId === userId ? { ...n, estLu: true } : n);
    setNotifications(updatedNotifs);
    localStorage.setItem('immob_notifications', JSON.stringify(updatedNotifs));
  };

  // Prevent hydration flash
  if (!isLoaded) {
    return null;
  }

  return (
    <AppStoreContext.Provider value={{
      currentUser,
      users,
      properties,
      contracts,
      payments,
      tickets,
      auditLogs,
      notifications,
      login,
      loginAsUser,
      logout,
      updateUser,
      addProperty,
      updateProperty,
      deleteProperty,
      addContract,
      terminateContract,
      payPeriod,
      validatePayment,
      addTicket,
      assignTicket,
      updateTicketStatus,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}
