'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <Icon name="ExclamationTriangleIcon" size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-zinc-400 mb-6 max-w-md">
            The application encountered an unexpected error.
          </p>
          {this.state.error && (
            <div className="mb-6 p-4 max-w-2xl w-full text-left bg-red-950/40 border border-red-500/30 rounded-xl overflow-auto text-xs text-red-200 font-mono">
              <p className="font-bold text-red-400 mb-1">{this.state.error.message || 'Unknown error'}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-48 mt-2">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-all active:scale-95"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
