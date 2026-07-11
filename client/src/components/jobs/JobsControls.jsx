import { Search } from 'lucide-react';

const JobsControls = ({ searchQuery, setSearchQuery, sortBy, toggleSort }) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by company or position..."
                    className="w-full pl-10 pr-4 py-2.5 bg-knotic-card border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent"
                />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-knotic-muted">Sort by:</span>
                <div className="flex gap-2">
                    {['updatedAt', 'score', 'status'].map((field) => (
                        <button
                            key={field}
                            onClick={() => toggleSort(field)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${sortBy === field
                                ? 'bg-knotic-accent text-white'
                                : 'bg-knotic-card text-knotic-muted hover:text-knotic-text'
                                }`}
                        >
                            {field === 'updatedAt' ? 'Date' : field}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JobsControls;
