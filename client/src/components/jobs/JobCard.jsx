import { Calendar, Trash2 } from 'lucide-react';
import StatusDropdown from './StatusDropdown';

const JobCard = ({ job, navigate, handleStatusChange, setDeleteTarget, formatDate }) => {
    return (
        <div
            onClick={() => navigate(`/jobs/${job._id}`)}
            className="bg-knotic-card border border-knotic-border rounded-xl p-4 flex flex-col gap-4 active:scale-[0.99] transition-transform cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <h3 className="font-bold text-knotic-text text-lg truncate">{job.company}</h3>
                    <p className="text-sm text-knotic-muted truncate">{job.position}</p>
                </div>
                <StatusDropdown
                    currentStatus={job.status}
                    onStatusChange={(status) => handleStatusChange(job._id, status)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            <div className="flex items-center justify-between border-t border-knotic-border pt-3">
                <div className="flex items-center gap-2 text-sm text-knotic-muted">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(job.appliedDate || job.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                    {job.aiAnalysis?.score && (
                        <span className={`text-xl font-bold ${job.aiAnalysis.score >= 85 ? 'text-emerald-500' :
                            job.aiAnalysis.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                            {job.aiAnalysis.score}%
                        </span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(job._id);
                        }}
                        className="p-2 text-knotic-muted hover:text-knotic-error transition-colors"
                        title="Delete job"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
