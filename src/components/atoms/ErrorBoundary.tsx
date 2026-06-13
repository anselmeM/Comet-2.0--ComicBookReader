'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `[ErrorBoundary] Error in ${this.props.name || 'Component'}:`,
      { componentStack: errorInfo.componentStack },
      error,
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-red-50/50 rounded-[3rem] border-2 border-dashed border-red-100 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6 shadow-lg shadow-red-200/50">
            <AlertTriangle size={40} strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-black text-red-900 tracking-tighter italic">
            Something went wrong
          </h3>
          <p className="text-red-600/60 max-w-md mt-2 font-medium">
            The {this.props.name || 'view'} failed to load correctly. This has been logged for
            investigation.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-8 flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/30 active:scale-95"
          >
            <RefreshCcw size={18} /> Try again
          </button>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-white/80 rounded-xl text-left max-w-2xl overflow-auto border border-red-100 shadow-sm">
              <code className="text-[10px] text-red-800 font-mono">{this.state.error?.stack}</code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
