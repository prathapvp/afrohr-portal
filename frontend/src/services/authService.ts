import { api } from './api';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  login: (data: LoginRequest) => api.post<AuthUser>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthUser>('/auth/register', data),
};
