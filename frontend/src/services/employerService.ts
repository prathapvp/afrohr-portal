import { api } from './api';
import type { EmployerProfile } from '../types';

export const employerService = {
  getMyProfile: () => api.get<EmployerProfile>('/employers/me'),
  updateMyProfile: (data: Partial<EmployerProfile>) =>
    api.put<EmployerProfile>('/employers/me', data),
  getProfile: (id: number) => api.get<EmployerProfile>(`/employers/${id}`),
};
