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
  /**
   * Get wallet challenge for signature
   */
  async getChallenge(
    request: WalletChallengeRequest
  ): Promise<WalletChallengeResponse> {
    const response = await api.post<WalletChallengeResponse>(
      '/auth/wallet/challenge',
      request
    );
    return response.data;
  },

  /**
   * Verify wallet signature and get access token
   */
  async verifySignature(
    request: WalletVerifyRequest
  ): Promise<WalletVerifyResponse> {
    const response = await api.post<WalletVerifyResponse>(
      '/auth/wallet/verify',
      request
    );
    
    // Store token
    apiClient.setAuthToken(response.data.accessToken);
    
    // Store profile
    localStorage.setItem('lynq_profile', JSON.stringify(response.data.profile));
    
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<Profile> {
    const response = await api.get<Profile>('/auth/me');
    return response.data;
  },

  /**
   * Logout - clear tokens
   */
  logout() {
    apiClient.setAuthToken(null);
    localStorage.removeItem('lynq_profile');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('lynq_access_token');
  },

  /**
   * Get stored profile
   */
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
