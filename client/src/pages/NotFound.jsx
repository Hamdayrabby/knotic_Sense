import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-knotic-bg flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-knotic-accent/10 via-transparent to-purple-500/10 pointer-events-none" />

            <div className="relative w-full max-w-lg text-center">
                {/* Logo */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-knotic-accent to-purple-500 shadow-lg shadow-knotic-accent/25 mb-8">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>

                {/* 404 Number */}
                <h1 className="text-8xl md:text-9xl font-extrabold landing-gradient-text mb-4">
                    404
                </h1>

                {/* Message */}
                <h2 className="text-2xl font-bold text-knotic-text mb-3">
                    Page not found
                </h2>
                <p className="text-knotic-muted mb-10 max-w-md mx-auto">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Let&apos;s get you back on track.
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-lg shadow-knotic-accent/25"
                    >
                        <Home className="w-5 h-5" />
                        Go to Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 border border-knotic-border text-knotic-text font-medium rounded-xl hover:border-knotic-accent hover:text-knotic-accent transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
