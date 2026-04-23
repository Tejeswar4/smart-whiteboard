// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
          <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500 accent-glow">
                <AlertTriangle size={48} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-zinc-400">
                An unexpected error occurred. We've logged the incident and are working on it.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs font-mono text-zinc-500 text-left overflow-auto max-h-32 custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 w-full py-3 bg-brand-accent hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-glow"
            >
              <RefreshCcw size={18} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
