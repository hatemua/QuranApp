import {apiFetch} from '@/api/client';
import type {
  AuthMeResponse,
  AuthSessionResponse,
  LoginRequest,
  RegisterRequest,
  UpdateMeRequest,
} from '@/types';

export const authApi = {
  register(input: RegisterRequest): Promise<AuthSessionResponse> {
    return apiFetch('/auth/register', {method: 'POST', body: input, skipAuth: true});
  },
  login(input: LoginRequest): Promise<AuthSessionResponse> {
    return apiFetch('/auth/login', {method: 'POST', body: input, skipAuth: true});
  },
  logout(): Promise<void> {
    return apiFetch('/auth/logout', {method: 'POST'});
  },
  me(): Promise<AuthMeResponse> {
    return apiFetch('/auth/me');
  },
  updateMe(input: UpdateMeRequest): Promise<AuthMeResponse> {
    return apiFetch('/auth/me', {method: 'PATCH', body: input});
  },
};
