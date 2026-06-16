import { api } from '@/lib/api';
import type { AuditLog } from '@/types/prisma';

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  dateDebut?: string;
  dateFin?: string;
}

export const auditLogService = {
  async getAll(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
    const params: Record<string, string | number> = {};
    if (filters.page)      params.page      = filters.page;
    if (filters.limit)     params.limit     = filters.limit;
    if (filters.action)    params.action    = filters.action;
    if (filters.userId)    params.userId    = filters.userId;
    if (filters.dateDebut) params.dateDebut = filters.dateDebut;
    if (filters.dateFin)   params.dateFin   = filters.dateFin;
    const { data } = await api.get<PaginatedAuditLogs>('/audit-logs', { params });
    return data;
  },
};
