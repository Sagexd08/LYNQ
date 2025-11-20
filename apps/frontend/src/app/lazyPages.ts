import { lazy } from 'react';

// Lazy load pages for code splitting
export const LandingPage = lazy(() => import('../pages/LandingPage'));
export const MarketplacePage = lazy(() => import('../pages/MarketplacePage'));
export const DashboardPage = lazy(() => import('../pages/DashboardPage'));
export const LoansPage = lazy(() => import('../pages/LoansPage'));
export const FlashLoanPage = lazy(() => import('../pages/FlashLoanPage'));
