import { api } from '@/lib/api';
import type { Expense, ExpenseCategory, ExpenseStatus } from '@/types/prisma';

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  payeurId?: string;
  propertyId?: string;
  beneficiaireId?: string;
  categorie?: ExpenseCategory;
  statut?: ExpenseStatus;
  dateDebut?: string;
  dateFin?: string;
}

export interface CreateExpensePayload {
  titre: string;
  description?: string;
  montant: number;
  date: string;
  categorie: ExpenseCategory;
  beneficiaireNom: string;
  payeurId: string;
  beneficiaireId?: string;
  propertyId?: string;
  ticketId?: string;
}

export interface PayExpensePayload {
  referenceId?: string;
  justificatifUrl?: string;
}

export const expenseService = {
  async getAll(filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
    const { data } = await api.get<PaginatedExpenses>('/expenses', { params: filters });
    return data;
  },

  async getByProperty(propertyId: string, filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
    const { data } = await api.get<PaginatedExpenses>(`/expenses/property/${propertyId}`, { params: filters });
    return data;
  },

  async getByPayeur(payeurId: string, filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
    const { data } = await api.get<PaginatedExpenses>(`/expenses/payeur/${payeurId}`, { params: filters });
    return data;
  },

  async getByBeneficiaire(beneficiaireId: string, filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
    const { data } = await api.get<PaginatedExpenses>(`/expenses/beneficiaire/${beneficiaireId}`, { params: filters });
    return data;
  },

  async getById(id: string): Promise<Expense> {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return data;
  },

  async create(payload: CreateExpensePayload): Promise<Expense> {
    const { data } = await api.post<Expense>('/expenses', payload);
    return data;
  },

  async pay(id: string, payload: PayExpensePayload = {}): Promise<Expense> {
    const { data } = await api.patch<Expense>(`/expenses/${id}/pay`, payload);
    return data;
  },

  async cancel(id: string): Promise<Expense> {
    const { data } = await api.patch<Expense>(`/expenses/${id}/cancel`);
    return data;
  },

  // multipart/form-data — champ fichier nommé "file" (unique, différent de tickets qui utilise "photos")
  async uploadJustificatif(id: string, file: File): Promise<Expense> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<Expense>(`/expenses/${id}/justificatif`, form);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
