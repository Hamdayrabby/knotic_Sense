const LoadingSpinner = () => {
    return (
        <div className="min-h-screen bg-knotic-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Animated spinner */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-knotic-border"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-knotic-accent animate-spin"></div>
                </div>

                {/* Brand text */}
                <p className="text-knotic-muted text-sm font-medium">Loading Knotic Sense...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
