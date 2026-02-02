import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, ArrowUpDown, Trash2, Sparkles, Calendar, Building2, Loader2 } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/jobs/EmptyState';
import StatusDropdown from '../components/jobs/StatusDropdown';
import ScoreRing from '../components/jobs/ScoreRing';
import AddJobModal from '../components/jobs/AddJobModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const Jobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [analyzingIds, setAnalyzingIds] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updatedAt'); // updatedAt, score, status
    const [sortOrder, setSortOrder] = useState('desc');

    // Fetch jobs on mount
    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Create job
    const handleCreateJob = async (jobData) => {
        const response = await api.post('/jobs', jobData);
        setJobs((prev) => [response.data.data, ...prev]);
        toast.success('Job added successfully');
    };

    // Update status (optimistic)
    const handleStatusChange = async (jobId, newStatus) => {
        // Optimistic update
        const previousJobs = [...jobs];
        setJobs((prev) =>
            prev.map((job) =>
                job._id === jobId ? { ...job, status: newStatus } : job
            )
        );

        try {
            await api.patch(`/jobs/${jobId}/status`, { status: newStatus });
            toast.success('Status updated');
        } catch (error) {
            // Revert on failure
            setJobs(previousJobs);
            console.error('Failed to update status:', error);
        }
    };

    // Delete job
    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await api.delete(`/jobs/${deleteTarget}`);
            setJobs((prev) => prev.filter((job) => job._id !== deleteTarget));
            setDeleteTarget(null);
            toast.success('Job deleted');
        } catch (error) {
            console.error('Failed to delete job:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filtered and sorted jobs
    const filteredJobs = useMemo(() => {
        let result = [...jobs];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (job) =>
                    job.company.toLowerCase().includes(query) ||
                    job.position.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'score':
                    aVal = a.aiAnalysis?.score || 0;
                    bVal = b.aiAnalysis?.score || 0;
                    break;
                case 'status':
                    const statusOrder = { Interested: 0, Applied: 1, Interviewing: 2, Offer: 3, Rejected: 4 };
                    aVal = statusOrder[a.status] || 0;
                    bVal = statusOrder[b.status] || 0;
                    break;
                default:
                    aVal = new Date(a.updatedAt).getTime();
                    bVal = new Date(b.updatedAt).getTime();
            }

            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return result;
    }, [jobs, searchQuery, sortBy, sortOrder]);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Toggle sort
    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-knotic-border border-t-knotic-accent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-knotic-text">Jobs</h1>
                    <p className="text-knotic-muted mt-1">
                        Track and manage your job applications
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-lg shadow-knotic-accent/25"
                >
                    <Plus className="w-5 h-5" />
                    Add Job
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-knotic-card border border-knotic-border rounded-2xl">
                    <EmptyState onAddJob={() => setIsModalOpen(true)} />
                </div>
            ) : (
                <>
                    {/* Search and filters */}
                    <div className="flex items-center gap-4">
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
                            <button
                                onClick={() => toggleSort('updatedAt')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortBy === 'updatedAt'
                                    ? 'bg-knotic-accent text-white'
                                    : 'bg-knotic-card text-knotic-muted hover:text-knotic-text'
                                    }`}
                            >
                                Date
                            </button>
                            <button
                                onClick={() => toggleSort('score')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortBy === 'score'
                                    ? 'bg-knotic-accent text-white'
                                    : 'bg-knotic-card text-knotic-muted hover:text-knotic-text'
                                    }`}
                            >
                                Score
                            </button>
                            <button
                                onClick={() => toggleSort('status')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortBy === 'status'
                                    ? 'bg-knotic-accent text-white'
                                    : 'bg-knotic-card text-knotic-muted hover:text-knotic-text'
                                    }`}
                            >
                                Status
                            </button>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job._id}
                                onClick={() => navigate(`/jobs/${job._id}`)}
                                className="bg-knotic-card border border-knotic-border rounded-xl p-4 flex flex-col gap-4 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-knotic-text text-lg">{job.company}</h3>
                                        <p className="text-sm text-knotic-muted">{job.position}</p>
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
                                            <div className="origin-right">
                                                <span className={`text-xl font-bold ${job.aiAnalysis.score >= 85 ? 'text-emerald-500' :
                                                        job.aiAnalysis.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>
                                                    {job.aiAnalysis.score}%
                                                </span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(job._id);
                                            }}
                                            className="p-2 text-knotic-muted hover:text-knotic-error transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-knotic-card border border-knotic-border rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-knotic-border">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-knotic-muted">
                                        <span className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Company & Role
                                        </span>
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-knotic-muted">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Applied
                                        </span>
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-knotic-muted">
                                        Status
                                    </th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-knotic-muted">
                                        <span className="flex items-center justify-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            ATS Score
                                        </span>
                                    </th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-knotic-muted">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map((job) => (
                                    <tr
                                        key={job._id}
                                        onClick={() => navigate(`/jobs/${job._id}`)}
                                        className="border-b border-knotic-border last:border-b-0 hover:cursor-pointer hover:bg-knotic-card/80 transition-all active:scale-[0.99]"
                                    >
                                        {/* Company & Role */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-knotic-text">{job.company}</p>
                                                <p className="text-sm text-knotic-muted">{job.position}</p>
                                            </div>
                                        </td>

                                        {/* Applied Date */}
                                        <td className="px-6 py-4 text-sm text-knotic-muted">
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
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            // Add to loading set
                                                            setAnalyzingIds(prev => new Set(prev).add(job._id));

                                                            try {
                                                                const res = await api.post(`/jobs/${job._id}/analyze`);
                                                                const analysis = res.data.data;

                                                                // Update local state
                                                                setJobs(prev => prev.map(j =>
                                                                    j._id === job._id ? { ...j, aiAnalysis: analysis } : j
                                                                ));

                                                                toast.success('Analysis Complete!');
                                                            } catch (err) {
                                                                console.error(err);
                                                                // If 400 (no resume), prompt to upload
                                                                if (err.response?.status === 400 && err.response?.data?.message?.includes('resume')) {
                                                                    toast.error('Please upload a resume first');
                                                                    navigate('/resume');
                                                                } else if (err.response?.status === 400 && err.response?.data?.message?.includes('description')) {
                                                                    toast.error('Add job description first');
                                                                    navigate(`/jobs/${job._id}`);
                                                                } else {
                                                                    toast.error('Analysis Failed');
                                                                }
                                                            } finally {
                                                                setAnalyzingIds(prev => {
                                                                    const next = new Set(prev);
                                                                    next.delete(job._id);
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                        disabled={analyzingIds.has(job._id)}
                                                        className="text-xs bg-knotic-accent/10 hover:bg-knotic-accent hover:text-white text-knotic-accent px-3 py-1.5 rounded-lg transition-colors font-medium border border-knotic-accent/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {analyzingIds.has(job._id) ? (
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
                                            <div className="flex items-center justify-end gap-2">
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
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Results count */}
                    <p className="text-sm text-knotic-muted">
                        Showing {filteredJobs.length} of {jobs.length} jobs
                    </p>
                </>
            )}

            {/* Add Job Modal */}
            <AddJobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateJob}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Job"
                message="Are you sure you want to delete this job? This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default Jobs;
