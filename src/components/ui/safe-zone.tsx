"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface SafeZoneProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface SafeZoneState {
  hasError: boolean;
  error?: Error;
}

export class SafeZone extends Component<SafeZoneProps, SafeZoneState> {
  constructor(props: SafeZoneProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeZoneState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SafeZone${this.props.name ? `:${this.props.name}` : ""}] caught error:`, error, errorInfo);
    
    try {
      fetch("/api/reports/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage: error.message || String(error),
          stackTrace: error.stack,
          route: typeof window !== "undefined" ? window.location.pathname : undefined,
          metadata: { name: this.props.name, componentStack: errorInfo.componentStack },
        }),
      }).catch((e) => console.error("Failed to send crash report:", e));
    } catch (e) {
      // Ignore fetch errors
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-destructive/20 bg-destructive/5 rounded-lg text-center space-y-3">
          <AlertTriangle className="text-destructive w-8 h-8" />
          <div>
            <h3 className="font-semibold text-sm">Something went wrong</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-xs">
              {this.state.error?.message || "An unexpected error occurred rendering this section."}
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={this.resetError} className="gap-2">
              <RefreshCw size={14} />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const payload = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}`;
                navigator.clipboard.writeText(payload);
                alert("Diagnostics copied to clipboard!");
              }} 
            >
              📋 Copy Diagnostics
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
