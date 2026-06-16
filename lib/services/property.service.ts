import { api } from '@/lib/api';
import type { Property, PropertyType } from '@/types/prisma';

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PropertyFilters {
  page?: number;
  limit?: number;
  search?: string;
  ville?: string;
  type?: PropertyType;
  estOccupe?: boolean;
  bailleurId?: string;
  gerantId?: string;
}

export interface CreatePropertyPayload {
  titre: string;
  description?: string | null;
  adresse: string;
  ville: string;
  type?: PropertyType;
  loyerDeBase: number;
  charges?: number;
  bailleurId: string;
  gerantId?: string | null;
}

export type UpdatePropertyPayload = Partial<
  Omit<CreatePropertyPayload, 'bailleurId' | 'gerantId'>
>;

export const propertyService = {
  async getAll(filters: PropertyFilters = {}): Promise<PaginatedProperties> {
    const { data } = await api.get<PaginatedProperties>('/properties', { params: filters });
    return data;
  },

  async getAvailable(filters: PropertyFilters = {}): Promise<PaginatedProperties> {
    const { data } = await api.get<PaginatedProperties>('/properties/available', { params: filters });
    return data;
  },

  async getOccupied(filters: PropertyFilters = {}): Promise<PaginatedProperties> {
    const { data } = await api.get<PaginatedProperties>('/properties/occupied', { params: filters });
    return data;
  },

  async getByBailleur(bailleurId: string, filters: PropertyFilters = {}): Promise<PaginatedProperties> {
    const { data } = await api.get<PaginatedProperties>(`/properties/bailleur/${bailleurId}`, { params: filters });
    return data;
  },

  async getByGerant(gerantId: string, filters: PropertyFilters = {}): Promise<PaginatedProperties> {
    const { data } = await api.get<PaginatedProperties>(`/properties/gerant/${gerantId}`, { params: filters });
    return data;
  },

  async getById(id: string): Promise<Property> {
    const { data } = await api.get<Property>(`/properties/${id}`);
    return data;
  },

  async create(payload: CreatePropertyPayload): Promise<Property> {
    const { data } = await api.post<Property>('/properties', payload);
    return data;
  },

  async update(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    const { data } = await api.patch<Property>(`/properties/${id}`, payload);
    return data;
  },

  async assignManager(propertyId: string, gerantId: string): Promise<Property> {
    const { data } = await api.patch<Property>(`/properties/${propertyId}/manager`, { gerantId });
    return data;
  },

  async removeManager(propertyId: string): Promise<Property> {
    const { data } = await api.delete<Property>(`/properties/${propertyId}/manager`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
  },
};
