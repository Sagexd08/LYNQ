
import React, { lazy, ComponentType, ReactNode, Suspense } from 'react';


type LazyComponentProps = Record<string, any>;


const DefaultLoadingFallback = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 min-h-[100px]',
    md: 'h-8 w-8 min-h-[200px]', 
    lg: 'h-12 w-12 min-h-[300px]'
  };
  
  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} border-b-2 border-white`} />
    </div>
  );
};


export const LazyProfileDashboard = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/dashboard/ProfileDashboard')
);

export const LazyPersonalDetails = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/dashboard/PersonalDetails')
);

export const LazyTransaction = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/dashboard/Transaction')
);


export const LazyFilters = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/marketplace/Filters')
);

export const LazyCoinCard = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/marketplace/CoinCard')
);

export const LazyAssetTable = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/marketplace/AssetTable')
);

export const LazySummaryHeader = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/marketplace/SummaryHeader')
);

export const LazyTradeInterface = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/marketplace/TradeInterface')
);


export const LazySmallLoanCard = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/card/SmallLoanCard')
);

export const LazyBigLoanCard = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/card/BigLoanCard')
);

export const LazyLoanRequestForm = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/card/LoanRequestForm')
);

export const LazyLoanEligibilityMeter = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/card/LoanEligibilityMeter')
);


export const LazyWalletConnectionModal = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/wallet/WalletConnectionModal')
);


export const LazyFaucetModule = lazy((): Promise<{ default: ComponentType<any> }> => 
  import('./components/landing/FaucetModule')
);


export function withSuspense<T extends LazyComponentProps>(
  Component: ComponentType<T>,
  options: {
    fallback?: ReactNode;
    errorBoundary?: boolean;
    loadingSize?: 'sm' | 'md' | 'lg';
  } = {}
) {
  const { 
    fallback, 
    errorBoundary = false, 
    loadingSize = 'md' 
  } = options;

  return function WrappedComponent(props: T) {
    const loadingFallback = fallback || <DefaultLoadingFallback size={loadingSize} />;

    const SuspenseWrapper = (
      <Suspense fallback={loadingFallback}>
        <Component {...props} />
      </Suspense>
    );

    if (errorBoundary) {
      return (
        <ErrorBoundary>
          {SuspenseWrapper}
        </ErrorBoundary>
      );
    }

    return SuspenseWrapper;
  };
}


class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Lazy component error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px] text-red-400">
          <div className="text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <p>Something went wrong loading this component</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


export const preloadComponent = (importFn: () => Promise<{ default: ComponentType<any> }>): void => {
  importFn().catch(console.error);
};


export const LazyComponents = {
  
  ProfileDashboard: LazyProfileDashboard,
  PersonalDetails: LazyPersonalDetails,
  Transaction: LazyTransaction,
  
  
  Filters: LazyFilters,
  CoinCard: LazyCoinCard,
  AssetTable: LazyAssetTable,
  SummaryHeader: LazySummaryHeader,
  TradeInterface: LazyTradeInterface,
  
  
  SmallLoanCard: LazySmallLoanCard,
  BigLoanCard: LazyBigLoanCard,
  LoanRequestForm: LazyLoanRequestForm,
  LoanEligibilityMeter: LazyLoanEligibilityMeter,
  
  
  WalletConnectionModal: LazyWalletConnectionModal,
  
  
  FaucetModule: LazyFaucetModule,
} as const;
