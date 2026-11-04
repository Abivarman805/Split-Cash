import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught UI error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.href = '/?autostart=1';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060f14] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full rounded-3xl bg-slate-900/95 border border-emerald-500/30 p-7 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              SplitMate Recovery Mode
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              We recovered from a temporary display issue ({this.state.errorMessage}). Click below to open your dashboard directly.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Open Dashboard Now</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
