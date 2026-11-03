import apiClient from './axios';
import { AuthState, StaffUser } from '../types';

export const auth = {
  /** Authenticate a staff member and establish a Django session. */
  login: async (username: string, password: string): Promise<{ user: StaffUser; is_authenticated: boolean }> => {
    const response = await apiClient.post<{
      user: StaffUser;
      is_authenticated: boolean;
    }>('/auth/login', { username, password });
    return response.data;
  },

  /** End the staff Django session. */
  logout: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  /** Return the current authenticated staff user (or not-authenticated). */
  me: async (): Promise<AuthState> => {
    const response = await apiClient.get<AuthState>('/auth/me');
    return response.data;
  },
};
