import api from './client';
import {
  WalletChallengeRequest,
  WalletChallengeResponse,
  WalletVerifyRequest,
  WalletVerifyResponse,
  Profile,
} from './types';
import { apiClient } from './client';

export const authApi = {
  
  async getChallenge(
    request: WalletChallengeRequest
  ): Promise<WalletChallengeResponse> {
    const response = await api.post<WalletChallengeResponse>(
      '/auth/wallet/challenge',
      request
    );
    return response.data;
  },

  async verifySignature(
    request: WalletVerifyRequest
  ): Promise<WalletVerifyResponse> {
    const response = await api.post<WalletVerifyResponse>(
      '/auth/wallet/verify',
      request
    );

    apiClient.setAuthToken(response.data.accessToken);

    localStorage.setItem('lynq_profile', JSON.stringify(response.data.profile));
    
    return response.data;
  },

  async getProfile(): Promise<Profile> {
    const response = await api.get<Profile>('/auth/me');
    return response.data;
  },

  logout() {
    apiClient.setAuthToken(null);
    localStorage.removeItem('lynq_profile');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('lynq_access_token');
  },

  getStoredProfile(): Profile | null {
    const profileStr = localStorage.getItem('lynq_profile');
    if (!profileStr) return null;
    try {
      return JSON.parse(profileStr);
    } catch {
      return null;
    }
  },
};
