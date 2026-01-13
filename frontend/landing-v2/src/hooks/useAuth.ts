import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { authApi } from '@/lib/api/auth';
import { WalletChallengeRequest, WalletVerifyRequest, Profile } from '@/lib/api/types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuth() {
  const queryClient = useQueryClient();
  const { profile, setProfile, clearAuth } = useAuthStore();

  // Get current profile
  const { data: currentProfile, isLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authApi.getProfile(),
    enabled: authApi.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when profile changes
  useEffect(() => {
    if (currentProfile) {
      setProfile(currentProfile);
    }
  }, [currentProfile, setProfile]);

  // Wallet challenge mutation
  const challengeMutation = useMutation({
    mutationFn: (request: WalletChallengeRequest) =>
      authApi.getChallenge(request),
  });

  // Verify signature mutation
  const verifyMutation = useMutation({
    mutationFn: (request: WalletVerifyRequest) =>
      authApi.verifySignature(request),
    onSuccess: (data) => {
      setProfile(data.profile);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Successfully connected wallet!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to verify signature');
    },
  });

  /**
   * Connect wallet and authenticate
   */
  const connectWallet = useCallback(async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast.error('Please install MetaMask to continue');
        return;
      }

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (!accounts || accounts.length === 0) {
        toast.error('No accounts found');
        return;
      }

      const walletAddress = accounts[0] as string;

      // Get challenge
      const challenge = await challengeMutation.mutateAsync({
        walletAddress,
      });

      // Store nonce temporarily
      const nonce = challenge.nonce;

      // Sign message
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(challenge.message);

      // Verify signature
      await verifyMutation.mutateAsync({
        walletAddress,
        signature,
        nonce,
      });
    } catch (error: any) {
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        toast.error('User rejected the signature request');
      } else {
        toast.error(error?.message || 'Failed to connect wallet');
      }
    }
  }, [challengeMutation, verifyMutation]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    authApi.logout();
    clearAuth();
    queryClient.clear();
    toast.success('Disconnected');
  }, [clearAuth, queryClient]);

  return {
    profile: profile || currentProfile,
    isLoading,
    isAuthenticated: authApi.isAuthenticated(),
    connectWallet,
    disconnect,
    isConnecting: challengeMutation.isPending || verifyMutation.isPending,
  };
}
