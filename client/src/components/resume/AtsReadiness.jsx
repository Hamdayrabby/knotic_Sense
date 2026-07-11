import { Sparkles } from 'lucide-react';
import ScoreGauge from '../job-details/ScoreGauge';

const AtsReadiness = ({ analysisData, handleCalculateScore, isCalculating }) => {
    return (
        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-knotic-accent" />
            </div>
            <h3 className="font-semibold text-white mb-4">ATS Readiness</h3>

            {analysisData ? (
                <div className="flex flex-col items-center">
                    <ScoreGauge score={analysisData.overallScore || 0} size="lg" />
                    <div className="mt-4 text-center">
                        <p className="font-bold text-lg text-white">{analysisData.quality?.level || 'Assessment Complete'}</p>
                        <p className="text-sm text-knotic-muted">{analysisData.quality?.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-6">
                        <div className="bg-knotic-bg/50 p-2 rounded text-center">
                            <p className="text-xs text-knotic-muted">Completeness</p>
                            <p className="font-bold text-knotic-text">{analysisData.scoreBreakdown?.completeness}%</p>
                        </div>
                        <div className="bg-knotic-bg/50 p-2 rounded text-center">
                            <p className="text-xs text-knotic-muted">Keywords</p>
                            <p className="font-bold text-knotic-text">{analysisData.scoreBreakdown?.keywordRichness}%</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleCalculateScore()}
                        disabled={isCalculating}
                        className="mt-6 w-full py-2 rounded-lg border border-knotic-border hover:bg-knotic-border transition-colors text-sm text-knotic-muted"
                    >
                        {isCalculating ? 'Recalculating...' : 'Refresh Analysis'}
                    </button>
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-knotic-muted mb-4">No analysis data yet.</p>
                    <button
                        onClick={() => handleCalculateScore()}
                        disabled={isCalculating}
                        className="bg-knotic-accent hover:bg-knotic-hover text-white px-6 py-2 rounded-lg font-semibold w-full"
                    >
                        {isCalculating ? 'Analyzing...' : 'Run Diagnostics'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AtsReadiness;
