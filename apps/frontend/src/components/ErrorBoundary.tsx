import { ReactNode, Component, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}


class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    
    this.setState({ errorInfo });

    
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    
    this.props.onError?.(error, errorInfo);

    
    
  }

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        errorId: null 
      });
    } else {
      window.location.reload();
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private renderErrorDetails(): ReactNode {
    if (!this.props.showDetails || !this.state.error) return null;

    return (
      <details className="mt-4 text-left">
        <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
          Technical Details
        </summary>
        <div className="mt-2 p-3 bg-gray-800 rounded text-xs font-mono text-red-300 overflow-auto max-h-32">
          <div className="mb-2">
            <strong>Error ID:</strong> {this.state.errorId}
          </div>
          <div className="mb-2">
            <strong>Message:</strong> {this.state.error.message}
          </div>
          {this.state.error.stack && (
            <div>
              <strong>Stack:</strong>
              <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      </details>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-center max-w-lg">
            <div className="mb-6">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-4">
                We're sorry, but something unexpected happened. You can try again or refresh the page.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-gray-500 mb-4">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again ({this.maxRetries - this.retryCount} left)
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Refresh Page
              </button>
            </div>

            {this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
