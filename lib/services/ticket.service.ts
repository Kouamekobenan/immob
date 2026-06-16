import { api } from '@/lib/api';
import type { Ticket, TicketStatus, UrgencyLevel } from '@/types/prisma';

export interface PaginatedTickets {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  statut?: TicketStatus;
  urgence?: UrgencyLevel;
}

export interface CreateTicketPayload {
  titre: string;
  description: string;
  urgence: UrgencyLevel;
  propertyId: string;
  locataireId: string;
}

export const ticketService = {
  async getAll(filters: TicketFilters = {}): Promise<PaginatedTickets> {
    const { data } = await api.get<PaginatedTickets>('/tickets', { params: filters });
    return data;
  },

  async getByProperty(propertyId: string, filters: TicketFilters = {}): Promise<PaginatedTickets> {
    const { data } = await api.get<PaginatedTickets>(`/tickets/property/${propertyId}`, { params: filters });
    return data;
  },

  async getByLocataire(locataireId: string, filters: TicketFilters = {}): Promise<PaginatedTickets> {
    const { data } = await api.get<PaginatedTickets>(`/tickets/locataire/${locataireId}`, { params: filters });
    return data;
  },

  async getByPrestataire(prestataireId: string, filters: TicketFilters = {}): Promise<PaginatedTickets> {
    const { data } = await api.get<PaginatedTickets>(`/tickets/prestataire/${prestataireId}`, { params: filters });
    return data;
  },

  async getById(id: string): Promise<Ticket> {
    const { data } = await api.get<Ticket>(`/tickets/${id}`);
    return data;
  },

  // multipart/form-data — photos is a File array (browser)
  // Omitting Content-Type lets axios/browser set multipart with boundary automatically
  async create(payload: CreateTicketPayload, photos: File[] = []): Promise<Ticket> {
    const form = new FormData();
    form.append('titre', payload.titre);
    form.append('description', payload.description);
    form.append('urgence', payload.urgence);
    form.append('propertyId', payload.propertyId);
    form.append('locataireId', payload.locataireId);
    photos.forEach((file) => form.append('photos', file));
    const { data } = await api.post<Ticket>('/tickets', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async assign(ticketId: string, prestataireId: string): Promise<Ticket> {
    const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/assign`, { prestataireId });
    return data;
  },

  // statut must follow strict state machine: OUVERT→ASSIGNE→EN_COURS→RESOLU→CLOTURE
  async updateStatus(ticketId: string, statut: TicketStatus): Promise<Ticket> {
    const { data } = await api.patch<Ticket>(`/tickets/${ticketId}/status`, { statut });
    return data;
  },

  async addPhotos(ticketId: string, photos: File[]): Promise<Ticket> {
    const form = new FormData();
    photos.forEach((file) => form.append('photos', file));
    const { data } = await api.post<Ticket>(`/tickets/${ticketId}/photos`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(ticketId: string): Promise<void> {
    await api.delete(`/tickets/${ticketId}`);
  },
};
