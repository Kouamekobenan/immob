import { api } from '@/lib/api';
import type { DashboardKPIs, RevenuPoint, AlertesResponse } from '@/types/stats';

export const statsService = {
  getDashboard: () => api.get<DashboardKPIs>('/stats/dashboard'),
  getRevenus: (mois = 12) => api.get<RevenuPoint[]>('/stats/revenus', { params: { mois } }),
  getAlertes: () => api.get<AlertesResponse>('/stats/alertes'),
};
