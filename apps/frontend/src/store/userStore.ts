import create from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  reputationTier: string;
  reputationPoints: number;
  kycVerified: boolean;
}

export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  authToken: string | null;

  // Actions
  setProfile: (profile: UserProfile) => void;
  setAuthToken: (token: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  authToken: localStorage.getItem('authToken'),

  setProfile: (profile) => set({ profile, error: null }),
  
  setAuthToken: (token) => {
    localStorage.setItem('authToken', token);
    set({ authToken: token });
  },

  clearUser: () => {
    localStorage.removeItem('authToken');
    set({ profile: null, authToken: null, error: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
}));
