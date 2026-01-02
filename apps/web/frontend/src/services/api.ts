import axios, { AxiosInstance } from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';


const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});


apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
);





export interface RegisterRequest {
    email: string;
    password: string;
    walletAddress?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface WalletConnectRequest {
    walletAddress: string;
    signature: string;
    chainType?: string;
}

export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        walletAddresses: string[];
        reputationTier: string;
        reputationPoints: number;
    };
}

export const authApi = {
    register: (data: RegisterRequest) =>
        apiClient.post<AuthResponse>('/auth/register', data),

    login: (data: LoginRequest) =>
        apiClient.post<AuthResponse>('/auth/login', data),

    walletConnect: (data: WalletConnectRequest) =>
        apiClient.post<AuthResponse>('/auth/wallet-connect', data),
};





export interface User {
    id: string;
    email?: string;
    walletAddresses: string[];
    reputationTier: string;
    reputationPoints: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserRequest {
    email?: string;
    walletAddresses?: string[];
}

export const userApi = {
    getProfile: () =>
        apiClient.get<User>('/users/me'),

    getUser: (id: string) =>
        apiClient.get<User>(`/users/${id}`),

    updateProfile: (data: UpdateUserRequest) =>
        apiClient.patch<User>('/users/me', data),
};





export type LoanStatus = 'pending' | 'active' | 'repaid' | 'defaulted' | 'liquidated';

export interface Loan {
    id: string;
    userId: string;
    amount: string;
    collateralType: string;
    collateralAmount: string;
    interestRate: number;
    duration: number;
    status: LoanStatus;
    healthFactor?: number;
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
}

export interface CreateLoanRequest {
    amount: string;
    collateralType: string;
    collateralAmount: string;
    duration: number; 
}

export interface RepayLoanRequest {
    loanId: string;
    amount: string;
}

export interface RefinanceOffer {
    originalLoan: Loan;
    newInterestRate: number;
    newDuration: number;
    savings: string;
}

export const loanApi = {
    getLoans: () =>
        apiClient.get<Loan[]>('/loans'),

    getLoan: (id: string) =>
        apiClient.get<Loan>(`/loans/${id}`),

    createLoan: (data: CreateLoanRequest) =>
        apiClient.post<Loan>('/loans', data),

    repayLoan: (data: RepayLoanRequest) =>
        apiClient.post<Loan>('/loans/repay', data),

    getRefinanceOffers: (loanId: string) =>
        apiClient.get<RefinanceOffer[]>(`/loans/${loanId}/refinance`),

    acceptRefinance: (loanId: string, offerId: string) =>
        apiClient.post<Loan>(`/loans/${loanId}/refinance/${offerId}`),
};





export interface FlashLoanQuote {
    amount: string;
    fee: string;
    feePercentage: number;
    estimatedGas: string;
    available: boolean;
}

export interface FlashLoanEligibility {
    isEligible: boolean;
    maxAmount: string;
    trustScore: number;
    reasons: string[];
}

export interface ExecuteFlashLoanRequest {
    asset: string;
    amount: string;
    targetContract: string;
    callData: string;
}

export interface FlashLoanResult {
    success: boolean;
    txHash: string;
    gasUsed: string;
    feeCharged: string;
}

export const flashLoanApi = {
    getQuote: (asset: string, amount: string) =>
        apiClient.get<FlashLoanQuote>('/flashloan/quote', {
            params: { asset, amount },
        }),

    checkEligibility: () =>
        apiClient.get<FlashLoanEligibility>('/flashloan/eligibility'),

    execute: (data: ExecuteFlashLoanRequest) =>
        apiClient.post<FlashLoanResult>('/flashloan/execute', data),

    getHistory: () =>
        apiClient.get('/flashloan/history'),
};





export interface HealthStatus {
    status: string;
    database: string;
    timestamp: string;
}

export const healthApi = {
    check: () =>
        apiClient.get<HealthStatus>('/health'),
};





export interface ChainHealth {
    chain: string;
    healthy: boolean;
    blockNumber: number;
    latency: number;
}

export const blockchainApi = {
    getChainsHealth: () =>
        apiClient.get<ChainHealth[]>('/blockchain/health'),
};

export default apiClient;
