import { api } from '@/lib/api';
import type { Notification, NotificationType } from '@/types/prisma';

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationFilters {
  estLu?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

export interface CreateNotificationPayload {
  titre: string;
  message: string;
  type: NotificationType;
  userId: string;
  expediteurId?: string;
}

export const notificationService = {
  async getMyNotifications(filters: NotificationFilters = {}): Promise<PaginatedNotifications> {
    const { data } = await api.get<PaginatedNotifications>('/notifications/me', { params: filters });
    return data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const { data } = await api.get<{ count: number }>('/notifications/me/unread-count');
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
    return data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>('/notifications/me/read-all');
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async create(payload: CreateNotificationPayload): Promise<Notification> {
    const { data } = await api.post<Notification>('/notifications', payload);
    return data;
  },
};
