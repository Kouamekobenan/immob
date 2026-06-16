import axios from 'axios';
import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: 'SUPER_ADMIN' | 'BAILLEUR' | 'GERANT' | 'LOCATAIRE' | 'PRESTATAIRE';
  createdAt: string;
}

// Structure réelle retournée par POST /auth/login et POST /auth/register
interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

function saveTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const authService = {
  async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthResponse['tokens'] }> {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    const { user, tokens } = res.data;
    saveTokens(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  },

  async register(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    telephone?: string;
    role?: string;
  }): Promise<{ user: AuthUser; tokens: AuthResponse['tokens'] }> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    const { user, tokens } = res.data;
    saveTokens(tokens.accessToken, tokens.refreshToken);
    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<AuthUser>('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async restoreSession(): Promise<AuthUser | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    // Try using existing access token first
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      try {
        return await authService.me();
      } catch {
        // Access token expired — fall through to refresh
      }
    }

    // Refresh the tokens — refresh endpoint returns tokens at root level (no nested "tokens")
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/refresh`,
        null,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );
      saveTokens(data.accessToken, data.refreshToken);
      return await authService.me();
    } catch {
      clearTokens();
      return null;
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      !!sessionStorage.getItem('accessToken') ||
      !!localStorage.getItem('refreshToken')
    );
  },
  clearTokens,
};
