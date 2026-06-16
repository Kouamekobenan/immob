'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, Property, Contract, Ticket, Payment, AuditLog, Notification, Expense,
  Role, TicketStatus, PaymentStatus
} from '@/types/prisma';
import {
  mockUsers, mockProperties, mockContracts, mockPayments, mockTickets,
  mockAuditLogs
} from '@/lib/mock-data';
import { authService } from '@/lib/auth-service';
import { propertyService } from '@/lib/services/property.service';
import { contractService } from '@/lib/services/contract.service';
import { userService, type CreateUserPayload } from '@/lib/services/user.service';
import { ticketService, type CreateTicketPayload } from '@/lib/services/ticket.service';
import { expenseService, type CreateExpensePayload } from '@/lib/services/expense.service';
import { paymentService, type CreatePaymentPayload, type MethodePaiement } from '@/lib/services/payment.service';
import { notificationService } from '@/lib/services/notification.service';

interface AppStoreContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  users: User[];
  properties: Property[];
  contracts: Contract[];
  payments: Payment[];
  tickets: Ticket[];
  auditLogs: AuditLog[];
  notifications: Notification[];

  // Actions
  login: (email: string, password: string) => Promise<User>;
  register: (data: { nom: string; prenom: string; email: string; password: string; telephone?: string; role: 'LOCATAIRE' | 'GERANT' }) => Promise<User>;
  loginAsUser: (userId: string) => void;
  logout: () => Promise<void>;

  // User Management
  createUser: (payload: CreateUserPayload) => Promise<User>;
  updateUser: (user: User) => void;
  updateMyProfile: (payload: { nom?: string; prenom?: string; telephone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ message: string }>;
  changeUserRole: (userId: string, role: Role) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  // Properties
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  
  // Contracts
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'estActif'>) => Promise<void>;
  terminateContract: (contractId: string, dateFin?: string) => Promise<void>;
  deleteContract: (contractId: string) => Promise<void>;
  
  // Payments
  payPeriod: (paymentId: string, referenceId: string) => void;
  createPayment: (payload: CreatePaymentPayload) => Promise<void>;
  submitPayment: (payload: { contractId: string; locataireId: string; periode: string; montant: number; methodePaiement: MethodePaiement; referenceId?: string }) => Promise<Payment>;
  confirmPayment: (paymentId: string, datePaiement: string, referenceId?: string) => Promise<void>;
  rejectPayment: (paymentId: string) => Promise<void>;
  failPayment: (paymentId: string) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  
  // Tickets
  addTicket: (ticket: Omit<Ticket, 'id' | 'statut' | 'createdAt' | 'updatedAt'>, photos?: File[]) => Promise<void>;
  assignTicket: (ticketId: string, prestataireId: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  addTicketPhotos: (ticketId: string, photos: File[]) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (payload: CreateExpensePayload, file?: File) => Promise<void>;
  payExpense: (id: string, referenceId?: string, file?: File) => Promise<void>;
  cancelExpense: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  uploadExpenseJustificatif: (id: string, file: File) => Promise<void>;

  // Notifications
  unreadCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  reloadNotifications: () => Promise<void>;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataLoadingCount = React.useRef(0);

  // Load mock data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsers         = localStorage.getItem('immob_users');
      const storedProperties    = localStorage.getItem('immob_properties');
      const storedContracts     = localStorage.getItem('immob_contracts');
      const storedPayments      = localStorage.getItem('immob_payments');
      const storedTickets       = localStorage.getItem('immob_tickets');
      const storedExpenses      = localStorage.getItem('immob_expenses');
      const storedAuditLogs     = localStorage.getItem('immob_auditLogs');
      const storedNotifications = localStorage.getItem('immob_notifications');

      setUsers(storedUsers              ? JSON.parse(storedUsers)         : mockUsers);
      setProperties(storedProperties    ? JSON.parse(storedProperties)    : mockProperties);
      setContracts(storedContracts      ? JSON.parse(storedContracts)     : mockContracts);
      setPayments(storedPayments        ? JSON.parse(storedPayments)      : mockPayments);
      setTickets(storedTickets          ? JSON.parse(storedTickets)       : mockTickets);
      setExpenses(storedExpenses        ? JSON.parse(storedExpenses)      : []);
      setAuditLogs(storedAuditLogs      ? JSON.parse(storedAuditLogs)     : mockAuditLogs);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);

      setIsLoaded(true);
    }
  }, []);

  // Restore auth session from tokens
  useEffect(() => {
    authService.restoreSession()
      .then((apiUser) => {
        if (apiUser) {
          setCurrentUser({ ...apiUser, updatedAt: apiUser.createdAt });
        }
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  // Listen for 401 events from the API interceptor (refresh token expired / invalid)
  // auth:unauthorized is only dispatched when the refresh itself fails — always a genuine session end
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setCurrentUser(null);
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, []);

  // Load API data reactively when auth is confirmed (avoids race with login)
  useEffect(() => {
    if (!currentUser || isAuthLoading) return;
    loadPropertiesFromAPI(currentUser);
    loadContractsFromAPI(currentUser);
    loadUsersFromAPI(currentUser);
    loadTicketsFromAPI(currentUser);
    loadExpensesFromAPI(currentUser);
    loadPaymentsFromAPI(currentUser);
    fetchNotifications();
    fetchUnreadCount();
    const pollInterval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isAuthLoading]);

  // Save to LocalStorage
  const saveState = (
    newUsers: User[],
    newProperties: Property[],
    newContracts: Contract[],
    newPayments: Payment[],
    newTickets: Ticket[],
    newExpenses: Expense[],
    newLogs: AuditLog[],
    newNotifs: Notification[]
  ) => {
    localStorage.setItem('immob_users', JSON.stringify(newUsers));
    localStorage.setItem('immob_properties', JSON.stringify(newProperties));
    localStorage.setItem('immob_contracts', JSON.stringify(newContracts));
    localStorage.setItem('immob_payments', JSON.stringify(newPayments));
    localStorage.setItem('immob_tickets', JSON.stringify(newTickets));
    localStorage.setItem('immob_expenses', JSON.stringify(newExpenses));
    localStorage.setItem('immob_auditLogs', JSON.stringify(newLogs));
    localStorage.setItem('immob_notifications', JSON.stringify(newNotifs));
  };

  const updateAllStates = (
    u: User[] = users,
    p: Property[] = properties,
    c: Contract[] = contracts,
    pay: Payment[] = payments,
    t: Ticket[] = tickets,
    exp: Expense[] = expenses,
    l: AuditLog[] = auditLogs,
    n: Notification[] = notifications
  ) => {
    setUsers(u);
    setProperties(p);
    setContracts(c);
    setPayments(pay);
    setTickets(t);
    setExpenses(exp);
    setAuditLogs(l);
    setNotifications(n);
    saveState(u, p, c, pay, t, exp, l, n);
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

  // Notifications are now managed server-side — local trigger is a no-op
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const triggerNotification = (_userId: string, _titre: string, _message: string, _type: string) => {};

  // Load notifications from API
  const fetchNotifications = async () => {
    try {
      const result = await notificationService.getMyNotifications({ limit: 50 });
      setNotifications(result.data);
    } catch { /* keep existing */ }
  };

  const fetchUnreadCount = async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch { /* ignore */ }
  };

  // Load properties from API based on user role
  const loadPropertiesFromAPI = async (user: User) => {
    dataLoadingCount.current++;
    try {
      let result;
      switch (user.role) {
        case 'BAILLEUR':
          result = await propertyService.getByBailleur(user.id, { limit: 100 });
          break;
        case 'GERANT':
          result = await propertyService.getByGerant(user.id, { limit: 100 });
          break;
        default:
          result = await propertyService.getAll({ limit: 100 });
      }
      setProperties(result.data);
    } catch {
      // Fallback: keep existing mock/localStorage properties
    } finally {
      dataLoadingCount.current--;
    }
  };

  // Load expenses from API based on user role
  const loadExpensesFromAPI = async (user: User) => {
    if (user.role === 'LOCATAIRE' || user.role === 'PRESTATAIRE') return;
    dataLoadingCount.current++;
    try {
      let result;
      if (user.role === 'SUPER_ADMIN') {
        result = await expenseService.getAll({ limit: 100 });
      } else {
        result = await expenseService.getByPayeur(user.id, { limit: 100 });
      }
      setExpenses(result.data);
    } catch (err) {
      console.error('[loadExpensesFromAPI] échec :', err);
    } finally {
      dataLoadingCount.current--;
    }
  };

  // Load tickets from API based on user role
  const loadTicketsFromAPI = async (user: User) => {
    dataLoadingCount.current++;
    try {
      let result;
      if (user.role === 'LOCATAIRE') {
        result = await ticketService.getByLocataire(user.id, { limit: 100 });
      } else if (user.role === 'PRESTATAIRE') {
        result = await ticketService.getByPrestataire(user.id, { limit: 100 });
      } else {
        result = await ticketService.getAll({ limit: 100 });
      }
      setTickets(result.data);
    } catch (err) {
      console.error('[loadTicketsFromAPI] échec :', err);
    } finally {
      dataLoadingCount.current--;
    }
  };

  // Load users list from API
  const loadUsersFromAPI = async (_user: User) => {
    dataLoadingCount.current++;
    try {
      const result = await userService.getAll({ limit: 100 });
      setUsers(result.data);
    } catch (err) {
      console.error('[loadUsersFromAPI] échec :', err);
    } finally {
      dataLoadingCount.current--;
    }
  };

  // Load payments from API based on user role
  const loadPaymentsFromAPI = async (user: User) => {
    dataLoadingCount.current++;
    try {
      let result;
      if (user.role === 'LOCATAIRE') {
        result = await paymentService.getByLocataire(user.id, { limit: 100 });
      } else {
        result = await paymentService.getAll({ limit: 100 });
      }
      setPayments(result.data);
    } catch (err) {
      console.error('[loadPaymentsFromAPI] échec :', err);
    } finally {
      dataLoadingCount.current--;
    }
  };

  // Load contracts from API based on user role
  const loadContractsFromAPI = async (user: User) => {
    dataLoadingCount.current++;
    try {
      let result;
      if (user.role === 'LOCATAIRE') {
        result = await contractService.getByLocataire(user.id, { limit: 100 });
      } else {
        result = await contractService.getAll({ limit: 100 });
      }
      setContracts(result.data);
    } catch {
      // Fallback: keep existing mock/localStorage contracts
    } finally {
      dataLoadingCount.current--;
    }
  };

  // AUTH ACTIONS
  const login = async (email: string, password: string): Promise<User> => {
    const data = await authService.login(email, password);
    const user: User = { ...data.user, updatedAt: data.user.createdAt };
    setCurrentUser(user);
    logAction('USER_LOGIN', 'users', user.id, { email: user.email, status: 'SUCCESS' }, user.id);
    return user;
  };

  const register = async (data: { nom: string; prenom: string; email: string; password: string; telephone?: string; role: 'LOCATAIRE' | 'GERANT' }): Promise<User> => {
    const result = await authService.register(data);
    const user: User = { ...result.user, updatedAt: result.user.createdAt };
    setCurrentUser(user);
    logAction('USER_REGISTER', 'users', user.id, { email: user.email, role: user.role }, user.id);
    return user;
  };

  const loginAsUser = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
      logAction('USER_SIMULATE_SWITCH', 'users', foundUser.id, { role: foundUser.role, email: foundUser.email }, foundUser.id);
    }
  };

  const logout = async (): Promise<void> => {
    if (currentUser) {
      logAction('USER_LOGOUT', 'users', currentUser.id, { email: currentUser.email });
    }
    await authService.logout();
    setCurrentUser(null);
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
  const addProperty = async (propInput: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const payload = {
      titre:       propInput.titre,
      description: propInput.description ?? undefined,
      adresse:     propInput.adresse,
      ville:       propInput.ville,
      type:        propInput.type,
      loyerDeBase: propInput.loyerDeBase,
      charges:     propInput.charges,
      bailleurId:  propInput.bailleurId,
      gerantId:    propInput.gerantId ?? undefined,
    };
    const newProp = await propertyService.create(payload);
    const updatedProps = [...properties, newProp];
    logAction('PROPERTY_CREATE', 'properties', newProp.id, { titre: newProp.titre, baseRent: newProp.loyerDeBase });
    updateAllStates(users, updatedProps);
  };

  const updateProperty = async (updatedProp: Property): Promise<void> => {
    const payload = {
      titre:       updatedProp.titre,
      description: updatedProp.description ?? undefined,
      adresse:     updatedProp.adresse,
      ville:       updatedProp.ville,
      type:        updatedProp.type,
      loyerDeBase: updatedProp.loyerDeBase,
      charges:     updatedProp.charges,
    };
    const saved = await propertyService.update(updatedProp.id, payload);
    const updatedProps = properties.map(p => p.id === saved.id ? saved : p);
    logAction('PROPERTY_UPDATE', 'properties', saved.id, { titre: saved.titre });
    updateAllStates(users, updatedProps);
  };

  const deleteProperty = async (id: string): Promise<void> => {
    const propertyToDelete = properties.find(p => p.id === id);
    await propertyService.delete(id);
    const updatedProps = properties.filter(p => p.id !== id);
    logAction('PROPERTY_DELETE', 'properties', id, { titre: propertyToDelete?.titre });
    updateAllStates(users, updatedProps);
  };

  // CONTRACTS MANAGEMENT
  const addContract = async (contractInput: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'estActif'>): Promise<void> => {
    const payload = {
      dateDebut:   contractInput.dateDebut.split('T')[0],
      dateFin:     contractInput.dateFin ? contractInput.dateFin.split('T')[0] : undefined,
      loyerTotal:  contractInput.loyerTotal,
      propertyId:  contractInput.propertyId,
      locataireId: contractInput.locataireId,
    };
    const newContract = await contractService.create(payload);
    const updatedContracts = [...contracts, newContract];
    const updatedProps = properties.map(p =>
      p.id === newContract.propertyId ? { ...p, estOccupe: true, updatedAt: new Date().toISOString() } : p
    );
    logAction('CONTRACT_CREATE', 'contracts', newContract.id, {
      propertyId:  newContract.propertyId,
      locataireId: newContract.locataireId,
      loyer:       newContract.loyerTotal,
    });
    triggerNotification(
      newContract.locataireId,
      'Nouveau contrat signé',
      `Votre contrat de location pour le bien "${properties.find(p => p.id === newContract.propertyId)?.titre || 'Logement'}" a été validé.`,
      'LOYER_DISPONIBLE'
    );
    updateAllStates(users, updatedProps, updatedContracts);
  };

  const terminateContract = async (contractId: string, dateFin?: string): Promise<void> => {
    const updated = await contractService.terminate(contractId, dateFin);
    const updatedContracts = contracts.map(c => c.id === contractId ? updated : c);
    const updatedProps = properties.map(p =>
      p.id === updated.propertyId ? { ...p, estOccupe: false, updatedAt: new Date().toISOString() } : p
    );
    logAction('CONTRACT_TERMINATE', 'contracts', contractId, { propertyId: updated.propertyId });
    updateAllStates(users, updatedProps, updatedContracts);
  };

  const deleteContract = async (contractId: string): Promise<void> => {
    await contractService.delete(contractId);
    const updatedContracts = contracts.filter(c => c.id !== contractId);
    logAction('CONTRACT_DELETE', 'contracts', contractId, {});
    updateAllStates(users, properties, updatedContracts);
  };

  // USER PROFILE & ADMIN ACTIONS
  const updateMyProfile = async (payload: { nom?: string; prenom?: string; telephone?: string }): Promise<void> => {
    const updated = await userService.updateMe(payload);
    const merged = { ...currentUser!, ...updated };
    setCurrentUser(merged);
    const updatedUsers = users.map(u => u.id === updated.id ? merged : u);
    logAction('USER_PROFILE_UPDATE', 'users', updated.id, { nom: updated.nom, prenom: updated.prenom });
    updateAllStates(updatedUsers);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return userService.changePassword({ currentPassword, newPassword });
  };

  const changeUserRole = async (userId: string, role: Role): Promise<void> => {
    const updated = await userService.changeRole(userId, role);
    const updatedUsers = users.map(u => u.id === updated.id ? { ...u, ...updated } : u);
    logAction('USER_ROLE_CHANGE', 'users', userId, { newRole: role });
    updateAllStates(updatedUsers);
  };

  const createUser = async (payload: CreateUserPayload): Promise<User> => {
    const newUser = await userService.create(payload);
    const updatedUsers = [...users, newUser];
    logAction('USER_CREATE', 'users', newUser.id, { role: payload.role, email: payload.email });
    updateAllStates(updatedUsers);
    return newUser;
  };

  const deleteUser = async (userId: string): Promise<void> => {
    await userService.delete(userId);
    const updatedUsers = users.filter(u => u.id !== userId);
    logAction('USER_DELETE', 'users', userId, {});
    updateAllStates(updatedUsers);
  };

  // PAYMENTS — API actions
  const submitPayment = async (payload: { contractId: string; locataireId: string; periode: string; montant: number; methodePaiement: MethodePaiement; referenceId?: string }): Promise<Payment> => {
    const newPayment = await paymentService.create(payload);
    logAction('PAYMENT_SUBMITTED', 'payments', newPayment.id, {
      montant: newPayment.montant,
      periode: newPayment.periode,
      methode: payload.methodePaiement,
    });
    await loadPaymentsFromAPI(currentUser!);
    return newPayment;
  };

  const createPayment = async (payload: CreatePaymentPayload): Promise<void> => {
    const newPayment = await paymentService.create(payload);
    const updatedPayments = [...payments, newPayment];
    logAction('PAYMENT_CREATE', 'payments', newPayment.id, { montant: newPayment.montant, periode: newPayment.periode });
    triggerNotification(
      payload.locataireId ?? '',
      'Avis de loyer',
      `Un avis de loyer de ${payload.montant.toLocaleString('fr-FR')} FCFA pour la période ${payload.periode} a été émis.`,
      'LOYER_DISPONIBLE'
    );
    updateAllStates(users, properties, contracts, updatedPayments);
  };

  const confirmPayment = async (paymentId: string, datePaiement: string, referenceId?: string): Promise<void> => {
    const paymentToConfirm = payments.find(p => p.id === paymentId);
    const updated = await paymentService.confirm(paymentId, { datePaiement, referenceId });
    const updatedPayments = payments.map(p => p.id === paymentId ? updated : p);
    logAction('PAYMENT_CONFIRM', 'payments', paymentId, { montant: paymentToConfirm?.montant, referenceId });
    if (paymentToConfirm) {
      triggerNotification(
        paymentToConfirm.locataireId,
        'Quittance de loyer disponible',
        `Votre loyer pour la période ${paymentToConfirm.periode} a été validé et votre quittance est disponible.`,
        'PAIEMENT_VALIDE'
      );
      const contract = contracts.find(c => c.id === paymentToConfirm.contractId);
      const prop = properties.find(p => p.id === contract?.propertyId);
      if (prop) {
        triggerNotification(
          prop.bailleurId,
          'Nouveau revenu encaissé',
          `Le loyer de ${paymentToConfirm.montant.toLocaleString('fr-FR')} FCFA pour le bien "${prop.titre}" a été encaissé.`,
          'PAIEMENT_VALIDE'
        );
      }
    }
    updateAllStates(users, properties, contracts, updatedPayments);
  };

  const rejectPayment = async (paymentId: string): Promise<void> => {
    const updated = await paymentService.reject(paymentId);
    const updatedPayments = payments.map(p => p.id === paymentId ? updated : p);
    logAction('PAYMENT_REJECT', 'payments', paymentId, {});
    updateAllStates(users, properties, contracts, updatedPayments);
  };

  const failPayment = async (paymentId: string): Promise<void> => {
    const updated = await paymentService.markFailed(paymentId);
    const updatedPayments = payments.map(p => p.id === paymentId ? updated : p);
    logAction('PAYMENT_FAIL', 'payments', paymentId, {});
    updateAllStates(users, properties, contracts, updatedPayments);
  };

  const deletePayment = async (paymentId: string): Promise<void> => {
    await paymentService.delete(paymentId);
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    logAction('PAYMENT_DELETE', 'payments', paymentId, {});
    updateAllStates(users, properties, contracts, updatedPayments);
  };

  // PAYMENTS SIMULATION (locataire — pas d'endpoint backend dédié)
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

  // TICKETS & MAINTENANCE
  const addTicket = async (
    ticketInput: Omit<Ticket, 'id' | 'statut' | 'createdAt' | 'updatedAt'>,
    photos: File[] = []
  ): Promise<void> => {
    const payload: CreateTicketPayload = {
      titre:       ticketInput.titre,
      description: ticketInput.description,
      urgence:     ticketInput.urgence,
      propertyId:  ticketInput.propertyId,
      locataireId: ticketInput.locataireId,
    };
    const newTicket = await ticketService.create(payload, photos);
    const updatedTickets = [...tickets, newTicket];
    logAction('TICKET_CREATE', 'tickets', newTicket.id, { titre: newTicket.titre, urgence: newTicket.urgence });
    const associatedProp = properties.find(p => p.id === ticketInput.propertyId);
    if (associatedProp?.gerantId) {
      triggerNotification(
        associatedProp.gerantId,
        'Nouveau incident signalé',
        `Un incident de niveau ${ticketInput.urgence} a été signalé pour le bien "${associatedProp.titre}".`,
        'NOUVEAU_TICKET_ASSIGNE'
      );
    }
    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const assignTicket = async (ticketId: string, prestataireId: string): Promise<void> => {
    const ticketToAssign = tickets.find(t => t.id === ticketId);
    const updated = await ticketService.assign(ticketId, prestataireId);
    const updatedTickets = tickets.map(t => t.id === ticketId ? updated : t);
    logAction('TICKET_ASSIGN', 'tickets', ticketId, { prestataireId });
    if (ticketToAssign) {
      triggerNotification(
        prestataireId,
        'Nouvelle intervention assignée',
        `L'incident "${ticketToAssign.titre}" vous a été assigné. Niveau d'urgence : ${ticketToAssign.urgence}.`,
        'NOUVEAU_TICKET_ASSIGNE'
      );
      triggerNotification(
        ticketToAssign.locataireId,
        'Incident pris en charge',
        `Un technicien a été mandaté pour régler l'incident : "${ticketToAssign.titre}".`,
        'TICKET_STATUT_CHANGE'
      );
    }
    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus): Promise<void> => {
    const ticketToUpdate = tickets.find(t => t.id === ticketId);
    const updated = await ticketService.updateStatus(ticketId, status);
    const updatedTickets = tickets.map(t => t.id === ticketId ? updated : t);
    logAction('TICKET_STATUS_UPDATE', 'tickets', ticketId, {
      ancienStatut: ticketToUpdate?.statut,
      nouveauStatut: status,
    });
    if (ticketToUpdate) {
      let messageText = `Le statut de votre incident "${ticketToUpdate.titre}" a été modifié : ${status}.`;
      if (status === 'EN_COURS') {
        messageText = `Le prestataire est actuellement en cours d'intervention pour : "${ticketToUpdate.titre}".`;
      } else if (status === 'RESOLU') {
        messageText = `L'incident "${ticketToUpdate.titre}" a été déclaré résolu par le prestataire.`;
      }
      triggerNotification(ticketToUpdate.locataireId, 'Statut incident mis à jour', messageText, 'TICKET_STATUT_CHANGE');
      if (status === 'RESOLU') {
        const associatedProp = properties.find(p => p.id === ticketToUpdate.propertyId);
        if (associatedProp?.gerantId) {
          triggerNotification(
            associatedProp.gerantId,
            'Incident résolu',
            `Le prestataire a résolu l'incident "${ticketToUpdate.titre}" sur le bien "${associatedProp.titre}".`,
            'TICKET_STATUT_CHANGE'
          );
        }
      }
    }
    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const deleteTicket = async (ticketId: string): Promise<void> => {
    await ticketService.delete(ticketId);
    const updatedTickets = tickets.filter(t => t.id !== ticketId);
    logAction('TICKET_DELETE', 'tickets', ticketId, {});
    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  const addTicketPhotos = async (ticketId: string, photos: File[]): Promise<void> => {
    const updated = await ticketService.addPhotos(ticketId, photos);
    const updatedTickets = tickets.map(t => t.id === ticketId ? updated : t);
    updateAllStates(users, properties, contracts, payments, updatedTickets);
  };

  // EXPENSES
  const addExpense = async (payload: CreateExpensePayload, file?: File): Promise<void> => {
    const newExpense = await expenseService.create(payload);
    let finalExpense = newExpense;
    if (file) {
      finalExpense = await expenseService.uploadJustificatif(newExpense.id, file);
    }
    const updatedExpenses = [...expenses, finalExpense];
    logAction('EXPENSE_CREATE', 'expenses', finalExpense.id, { titre: finalExpense.titre, montant: finalExpense.montant });
    updateAllStates(users, properties, contracts, payments, tickets, updatedExpenses);
  };

  const payExpense = async (id: string, referenceId?: string, file?: File): Promise<void> => {
    if (file) {
      await expenseService.uploadJustificatif(id, file);
    }
    const updated = await expenseService.pay(id, { referenceId });
    const updatedExpenses = expenses.map(e => e.id === id ? updated : e);
    logAction('EXPENSE_PAY', 'expenses', id, { referenceId });
    updateAllStates(users, properties, contracts, payments, tickets, updatedExpenses);
  };

  const cancelExpense = async (id: string): Promise<void> => {
    const updated = await expenseService.cancel(id);
    const updatedExpenses = expenses.map(e => e.id === id ? updated : e);
    logAction('EXPENSE_CANCEL', 'expenses', id, {});
    updateAllStates(users, properties, contracts, payments, tickets, updatedExpenses);
  };

  const deleteExpense = async (id: string): Promise<void> => {
    await expenseService.delete(id);
    const updatedExpenses = expenses.filter(e => e.id !== id);
    logAction('EXPENSE_DELETE', 'expenses', id, {});
    updateAllStates(users, properties, contracts, payments, tickets, updatedExpenses);
  };

  const uploadExpenseJustificatif = async (id: string, file: File): Promise<void> => {
    const updated = await expenseService.uploadJustificatif(id, file);
    const updatedExpenses = expenses.map(e => e.id === id ? updated : e);
    updateAllStates(users, properties, contracts, payments, tickets, updatedExpenses);
  };

  // NOTIFICATION ACTIONS — API-backed
  const markNotificationAsRead = async (id: string): Promise<void> => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? updated : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = async (_userId: string): Promise<void> => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, estLu: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string): Promise<void> => {
    const notif = notifications.find(n => n.id === id);
    await notificationService.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.estLu) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const reloadNotifications = async (): Promise<void> => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // Prevent hydration flash
  if (!isLoaded) {
    return null;
  }

  return (
    <AppStoreContext.Provider value={{
      currentUser,
      isAuthLoading,
      users,
      properties,
      contracts,
      payments,
      tickets,
      expenses,
      auditLogs,
      notifications,
      login,
      register,
      loginAsUser,
      logout,
      createUser,
      updateUser,
      updateMyProfile,
      changePassword,
      changeUserRole,
      deleteUser,
      addProperty,
      updateProperty,
      deleteProperty,
      addContract,
      terminateContract,
      deleteContract,
      payPeriod,
      submitPayment,
      createPayment,
      confirmPayment,
      rejectPayment,
      failPayment,
      deletePayment,
      addTicket,
      assignTicket,
      updateTicketStatus,
      deleteTicket,
      addTicketPhotos,
      addExpense,
      payExpense,
      cancelExpense,
      deleteExpense,
      uploadExpenseJustificatif,
      unreadCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      reloadNotifications,
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
