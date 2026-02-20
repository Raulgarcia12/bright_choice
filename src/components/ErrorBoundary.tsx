import React from 'react';

interface State { hasError: boolean; error: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, State> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error: error?.message || 'Unknown error' };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
                    <p className="font-semibold text-destructive">Something went wrong</p>
                    <p className="text-xs opacity-70">{this.state.error}</p>
                </div>
            );
        }
        return this.props.children;
    }
}
