import React, { Component } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white p-8 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">系統發生錯誤</h1>
            <p className="text-zinc-400 mb-8">導入的數據格式可能不相容，或發生了未預期的錯誤。請嘗試重新整理頁面或檢查 JSON 結構。</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
