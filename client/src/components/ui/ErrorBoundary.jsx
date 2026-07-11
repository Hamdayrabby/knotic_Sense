import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-knotic-bg flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-knotic-accent/10 via-transparent to-purple-500/10 pointer-events-none" />
                    <div className="relative w-full max-w-md text-center">
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-10 shadow-xl">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-rose-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-knotic-text mb-3">
                                Something went wrong
                            </h1>
                            <p className="text-knotic-muted mb-8">
                                An unexpected error occurred. Don&apos;t worry — your data is safe.
                            </p>
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-lg shadow-knotic-accent/25"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
