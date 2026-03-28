import { api } from './api';
import type { JobPosting, Page } from '../types';

export const jobService = {
  list: (params?: { keyword?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    return api.get<Page<JobPosting>>(`/jobs${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => api.get<JobPosting>(`/jobs/${id}`),
  create: (data: Partial<JobPosting>) => api.post<JobPosting>('/jobs', data),
  update: (id: number, data: Partial<JobPosting>) =>
    api.put<JobPosting>(`/jobs/${id}`, data),
  remove: (id: number) => api.delete<void>(`/jobs/${id}`),
};
