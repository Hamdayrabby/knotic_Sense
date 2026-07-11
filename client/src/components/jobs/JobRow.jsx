import { Trash2, Loader2 } from 'lucide-react';
import StatusDropdown from './StatusDropdown';

const JobRow = ({ job, navigate, handleStatusChange, handleAnalyze, analyzingIds, setDeleteTarget, formatDate }) => {
    const isAnalyzing = analyzingIds.has(job._id);

    return (
        <tr
            onClick={() => navigate(`/jobs/${job._id}`)}
            className="border-b border-knotic-border last:border-b-0 hover:cursor-pointer hover:bg-knotic-card/80 transition-all active:scale-[0.99]"
        >
            {/* Company & Role */}
            <td className="px-6 py-4">
                <div className="min-w-0">
                    <p className="font-semibold text-knotic-text truncate">{job.company}</p>
                    <p className="text-sm text-knotic-muted truncate">{job.position}</p>
                </div>
            </td>

            {/* Applied Date */}
            <td className="px-6 py-4 text-sm text-knotic-muted whitespace-nowrap">
                {formatDate(job.appliedDate || job.createdAt)}
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <StatusDropdown
                    currentStatus={job.status}
                    onStatusChange={(status) => handleStatusChange(job._id, status)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>

            {/* ATS Score */}
            <td className="px-6 py-4">
                <div className="flex justify-center">
                    {job.aiAnalysis?.score ? (
                        <span className={`text-xl font-bold ${job.aiAnalysis.score >= 85 ? 'text-emerald-500' :
                            job.aiAnalysis.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {job.aiAnalysis.score}%
                        </span>
                    ) : (
                        <button
                            onClick={(e) => handleAnalyze(e, job)}
                            disabled={isAnalyzing}
                            className="text-xs bg-knotic-accent/10 hover:bg-knotic-accent hover:text-white text-knotic-accent px-3 py-1.5 rounded-lg transition-colors font-medium border border-knotic-accent/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze'
                            )}
                        </button>
                    )}
                </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
                <div className="flex items-center justify-end">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(job._id);
                        }}
                        className="p-2 rounded-lg text-knotic-muted hover:text-knotic-error hover:bg-knotic-error/10 transition-colors"
                        title="Delete job"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default JobRow;
