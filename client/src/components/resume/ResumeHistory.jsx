import { List, XCircle } from 'lucide-react';

const ResumeHistory = ({ resumeHistory, resumeData, handleSelectResume, handleDeleteResume }) => {
    return (
        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-knotic-accent" />
                History
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {resumeHistory.length === 0 && (
                    <p className="text-sm text-knotic-muted italic">No history yet.</p>
                )}
                {[...resumeHistory].reverse().map((resume) => {
                    const isSelected = JSON.stringify(resumeData) === JSON.stringify(resume.structured);
                    return (
                        <div
                            key={resume._id}
                            onClick={() => handleSelectResume(resume)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all group relative ${isSelected
                                ? 'bg-knotic-accent/10 border-knotic-accent'
                                : 'bg-knotic-bg/50 border-knotic-border hover:border-knotic-muted'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="truncate pr-6">
                                    <p className="text-sm font-medium text-knotic-text truncate" title={resume.fileName}>
                                        {resume.fileName}
                                    </p>
                                    <p className="text-xs text-knotic-muted mt-1">
                                        {new Date(resume.uploadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteResume(resume._id, e)}
                                    className="absolute top-3 right-3 text-knotic-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResumeHistory;
