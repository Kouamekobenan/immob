import { api } from '@/lib/api';
import type { User, Role } from '@/types/prisma';

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}

export interface UpdateProfilePayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
}

export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  role: Role;
}
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  async getAll(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const { data } = await api.get<PaginatedUsers>('/users', { params: filters });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    return data;
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<User>('/users/me', payload);
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>('/users/me/password', payload);
    return data;
  },

  async changeRole(userId: string, role: Role): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/role`, { role });
    return data;
  },

  async delete(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },

  async getByRole(role: Role, filters: Omit<UserFilters, 'role'> = {}): Promise<PaginatedUsers> {
    return userService.getAll({ ...filters, role });
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<{ user: User; tokens: unknown }>('/auth/register', payload);
    return data.user;
  },
};
