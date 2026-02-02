import { AlertTriangle, Lightbulb, Zap, Star } from 'lucide-react';

const ImprovementPanel = ({ analysis }) => {
    if (!analysis) return null;

    const { roboticFlag, roboticAdvice, improvements, starRating, reasoning } = analysis;

    return (
        <div className="space-y-6">
            {/* Robotic Tone Warning */}
            {roboticFlag && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-500 mb-1">Humanize Your Resume</h4>
                            <p className="text-sm text-orange-200/80">
                                {roboticAdvice || "Your resume sounds a bit too formal or generated. Try using more natural language to pass human review."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Star Rating & Oracle Advice */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Oracle's Rating
                    </h4>
                    <div className="flex gap-1" title={`${starRating}/5 Stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${star <= starRating ? 'fill-yellow-400 text-yellow-400' : 'text-knotic-border'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <p className="text-sm text-knotic-text italic border-l-2 border-indigo-500 pl-3">
                    "{reasoning || "Analysis complete. Review the gaps below to improve your score."}"
                </p>
            </div>

            {/* Improvement Gaps */}
            <div>
                <h4 className="flex items-center gap-2 text-sm font-bold text-knotic-text mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Top Improvement Priorities
                </h4>
                <ul className="space-y-3">
                    {improvements && improvements.length > 0 ? (
                        improvements.slice(0, 3).map((tip, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-knotic-muted bg-knotic-card p-3 rounded-lg border border-knotic-border">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-knotic-border/50 flex items-center justify-center text-xs font-mono">
                                    {idx + 1}
                                </span>
                                <span>{tip}</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-sm text-knotic-muted">No specific improvements found. You're doing great!</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ImprovementPanel;
