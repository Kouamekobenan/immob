import { api } from '@/lib/api';
import type { Payment, PaymentStatus } from '@/types/prisma';

export type MethodePaiement = 'WAVE' | 'ORANGE_MONEY' | 'MTN' | 'VIREMENT' | 'ESPECES';

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  contractId?: string;
  locataireId?: string;
  statut?: PaymentStatus;
  periode?: string;
}

export interface CreatePaymentPayload {
  montant: number;
  periode: string;            // MM-YYYY ex: "06-2026"
  contractId: string;
  locataireId?: string;       // Requis pour le gérant, optionnel pour le locataire (inféré du token)
  methodePaiement?: MethodePaiement;
  referenceId?: string;
}

export interface ConfirmPaymentPayload {
  datePaiement: string;  // ISO 8601
  referenceId?: string;
  recuUrl?: string;
}

export const paymentService = {
  async getAll(filters: PaymentFilters = {}): Promise<PaginatedPayments> {
    const { data } = await api.get<PaginatedPayments>('/payments', { params: filters });
    return data;
  },

  async getByContract(contractId: string, filters: PaymentFilters = {}): Promise<PaginatedPayments> {
    const { data } = await api.get<PaginatedPayments>(`/payments/contract/${contractId}`, { params: filters });
    return data;
  },

  async getByLocataire(locataireId: string, filters: PaymentFilters = {}): Promise<PaginatedPayments> {
    const { data } = await api.get<PaginatedPayments>(`/payments/locataire/${locataireId}`, { params: filters });
    return data;
  },

  async getById(id: string): Promise<Payment> {
    const { data } = await api.get<Payment>(`/payments/${id}`);
    return data;
  },

  async create(payload: CreatePaymentPayload): Promise<Payment> {
    const { data } = await api.post<Payment>('/payments', payload);
    return data;
  },

  async confirm(id: string, payload: ConfirmPaymentPayload): Promise<Payment> {
    const { data } = await api.patch<Payment>(`/payments/${id}/confirm`, payload);
    return data;
  },

  async reject(id: string): Promise<Payment> {
    const { data } = await api.patch<Payment>(`/payments/${id}/reject`);
    return data;
  },

  async markFailed(id: string): Promise<Payment> {
    const { data } = await api.patch<Payment>(`/payments/${id}/fail`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  },

  getCurrentPeriode(): string {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  },

  getPeriode(date: Date): string {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  },
};
