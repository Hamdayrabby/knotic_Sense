import { Briefcase, Plus } from 'lucide-react';

const EmptyState = ({ onAddJob }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Icon */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-knotic-accent/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Briefcase className="w-12 h-12 text-knotic-accent" />
            </div>

            {/* Text */}
            <h3 className="text-2xl font-bold text-knotic-text mb-2">No jobs tracked yet</h3>
            <p className="text-knotic-muted text-center max-w-md mb-8">
                Start by adding jobs you're interested in. We'll help you track applications
                and analyze your resume match with AI.
            </p>

            {/* CTA Button */}
            <button
                onClick={onAddJob}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all duration-200 shadow-lg shadow-knotic-accent/25"
            >
                <Plus className="w-5 h-5" />
                Add Your First Job
            </button>
        </div>
    );
};

export default EmptyState;
