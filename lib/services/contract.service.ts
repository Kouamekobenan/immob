import { api } from '@/lib/api';
import type { Contract } from '@/types/prisma';

export interface PaginatedContracts {
  data: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  propertyId?: string;
  locataireId?: string;
  estActif?: boolean;
}

export interface CreateContractPayload {
  dateDebut: string;
  dateFin?: string;
  loyerTotal: number;
  propertyId: string;
  locataireId: string;
}

export interface UpdateContractPayload {
  dateDebut?: string;
  dateFin?: string | null;
  loyerTotal?: number;
}

export const contractService = {
  async getAll(filters: ContractFilters = {}): Promise<PaginatedContracts> {
    const { data } = await api.get<PaginatedContracts>('/contracts', { params: filters });
    return data;
  },

  async getByProperty(propertyId: string, filters: ContractFilters = {}): Promise<PaginatedContracts> {
    const { data } = await api.get<PaginatedContracts>(`/contracts/property/${propertyId}`, { params: filters });
    return data;
  },

  async getByLocataire(locataireId: string, filters: ContractFilters = {}): Promise<PaginatedContracts> {
    const { data } = await api.get<PaginatedContracts>(`/contracts/locataire/${locataireId}`, { params: filters });
    return data;
  },

  async getById(id: string): Promise<Contract> {
    const { data } = await api.get<Contract>(`/contracts/${id}`);
    return data;
  },

  async create(payload: CreateContractPayload): Promise<Contract> {
    const { data } = await api.post<Contract>('/contracts', payload);
    return data;
  },

  async update(id: string, payload: UpdateContractPayload): Promise<Contract> {
    const { data } = await api.patch<Contract>(`/contracts/${id}`, payload);
    return data;
  },

  async terminate(id: string, dateFin?: string): Promise<Contract> {
    const { data } = await api.patch<Contract>(`/contracts/${id}/terminate`, dateFin ? { dateFin } : {});
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`);
  },

  async getActiveByProperty(propertyId: string): Promise<Contract | null> {
    const result = await contractService.getByProperty(propertyId, { estActif: true, limit: 1 });
    return result.data[0] ?? null;
  },

  async getActiveByLocataire(locataireId: string): Promise<Contract | null> {
    const result = await contractService.getByLocataire(locataireId, { estActif: true, limit: 1 });
    return result.data[0] ?? null;
  },
};
