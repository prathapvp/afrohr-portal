import { api } from './api';
import type { CandidateProfile } from '../types';

export const candidateService = {
  getMyProfile: () => api.get<CandidateProfile>('/candidates/me'),
  updateMyProfile: (data: Partial<CandidateProfile>) =>
    api.put<CandidateProfile>('/candidates/me', data),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload<CandidateProfile>('/candidates/me/resume', form);
  },
  getProfile: (id: number) => api.get<CandidateProfile>(`/candidates/${id}`),
};
