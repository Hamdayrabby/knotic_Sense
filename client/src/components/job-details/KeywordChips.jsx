import { Check, X } from 'lucide-react';

const KeywordChips = ({ matched = [], missing = [] }) => {
    return (
        <div className="space-y-6">
            {/* Matched Keywords */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-500 mb-3">
                    <Check className="w-4 h-4" />
                    Matched Keywords ({matched.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                    {matched.length > 0 ? (
                        matched.map((item, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-1 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
                                title={item.proofQuote ? `Found: "${item.proofQuote}"` : 'Found in resume'}
                            >
                                {item.keyword || item}
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-knotic-muted italic">No keywords matched yet.</span>
                    )}
                </div>
            </div>

            {/* Missing Keywords */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-500 mb-3">
                    <X className="w-4 h-4" />
                    Missing Keywords ({missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                    {missing.length > 0 ? (
                        missing.map((keyword, idx) => (
                            <div
                                key={idx}
                                className="px-3 py-1 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-full"
                            >
                                {keyword}
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-emerald-500 italic">Excellent! No missing keywords found.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KeywordChips;
