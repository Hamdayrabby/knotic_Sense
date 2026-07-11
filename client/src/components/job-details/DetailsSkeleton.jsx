const DetailsSkeleton = () => (
    <div className="animate-pulse max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        <div className="h-8 bg-knotic-border/50 rounded w-1/3 mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
                <div className="flex gap-4 border-b border-knotic-border pb-2 mb-6">
                    <div className="h-10 w-40 bg-knotic-border/30 rounded"></div>
                    <div className="h-10 w-40 bg-knotic-border/30 rounded"></div>
                </div>
                <div className="h-48 bg-knotic-border/30 rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-knotic-border/30 rounded-xl"></div>
                    <div className="h-64 bg-knotic-border/30 rounded-xl"></div>
                </div>
            </div>
            <div className="lg:col-span-4">
                <div className="h-[500px] bg-knotic-border/30 rounded-xl sticky top-6"></div>
            </div>
        </div>
    </div>
);

export default DetailsSkeleton;
