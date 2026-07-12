import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    Briefcase, TrendingUp, Clock, Upload, List, Loader2, 
    CalendarClock, ArrowRight, CheckCircle2, ChevronRight, AlertCircle 
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch jobs on mount
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await api.get('/jobs');
                setJobs(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch jobs for dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobs();
    }, []);

    // Compute metrics
    const statsData = useMemo(() => {
        const total = jobs.length;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const dueFollowUps = jobs.filter(j =>
            j.nextActionDate &&
            new Date(j.nextActionDate) <= today &&
            !['Offer', 'Rejected'].includes(j.status)
        ).length;
        const interviewing = jobs.filter(j =>
            j.status === 'Interviewing' ||
            (j.statusHistory && j.statusHistory.some(h => h.status === 'Interviewing'))
        ).length;
        const offers = jobs.filter(j => j.status === 'Offer').length;
        const rejected = jobs.filter(j => j.status === 'Rejected').length;
        const concluded = offers + rejected;
        const successRate = concluded > 0 ? Math.round((offers / concluded) * 100) : 0;

        return {
            total,
            dueFollowUps,
            interviewing,
            successRate,
            statusCounts: {
                Wishlist: jobs.filter(j => j.status === 'Wishlist').length,
                Applied: jobs.filter(j => j.status === 'Applied').length,
                Interviewing: jobs.filter(j => j.status === 'Interviewing').length,
                Offer: jobs.filter(j => j.status === 'Offer').length,
                Rejected: jobs.filter(j => j.status === 'Rejected').length,
            },
            upcomingTasks: jobs
                .filter(j => j.nextActionDate && !['Offer', 'Rejected'].includes(j.status))
                .sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate))
                .slice(0, 3) // Top 3 tasks
        };
    }, [jobs]);

    const stats = useMemo(() => [
        { label: 'Total Jobs', value: String(statsData.total), icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
        { label: 'Follow-ups Due', value: String(statsData.dueFollowUps), icon: CalendarClock, color: 'from-violet-500 to-fuchsia-500' },
        { label: 'Interviews', value: String(statsData.interviewing), icon: Clock, color: 'from-orange-500 to-amber-500' },
        { label: 'Success Rate', value: `${statsData.successRate}%`, icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
    ], [statsData]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-knotic-text">
                    Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}! 👋
                </h1>
                <p className="text-knotic-muted mt-2">
                    Here's an overview of your job search progress
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-knotic-card border border-knotic-border rounded-2xl p-6 hover:border-knotic-accent/50 transition-all duration-300 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-knotic-muted text-sm font-medium">{stat.label}</p>
                                {isLoading ? (
                                    <div className="mt-2">
                                        <Loader2 className="w-6 h-6 text-knotic-muted animate-spin" />
                                    </div>
                                ) : (
                                    <p className="text-3xl font-bold text-knotic-text mt-2">{stat.value}</p>
                                )}
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: Actions & Recent Jobs (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-knotic-text mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => navigate('/resume')}
                                className="flex items-center gap-2 px-6 py-3 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:border-knotic-accent hover:text-knotic-accent transition-all duration-200"
                            >
                                <Upload className="w-5 h-5" />
                                Upload Resume
                            </button>
                            <button
                                onClick={() => navigate('/jobs')}
                                className="flex items-center gap-2 px-6 py-3 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:border-knotic-accent hover:text-knotic-accent transition-all duration-200"
                            >
                                <List className="w-5 h-5" />
                                View All Jobs
                            </button>
                        </div>
                    </div>

                    {/* Empty State */}
                    {!isLoading && jobs.length === 0 && (
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-12 text-center">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-knotic-accent/20 to-purple-500/20 flex items-center justify-center mb-6">
                                <Briefcase className="w-10 h-10 text-knotic-accent" />
                            </div>
                            <h3 className="text-xl font-semibold text-knotic-text mb-2">No jobs tracked yet</h3>
                            <p className="text-knotic-muted max-w-md mx-auto">
                                Start by adding jobs you're interested in. We'll help you track your applications and analyze your resume match.
                            </p>
                        </div>
                    )}

                    {/* Recent Jobs list */}
                    {!isLoading && jobs.length > 0 && (
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-knotic-text">Recent Jobs</h2>
                                <button
                                    onClick={() => navigate('/jobs')}
                                    className="text-sm text-knotic-accent hover:text-knotic-hover flex items-center gap-1 transition-colors"
                                >
                                    View all <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {jobs.slice(0, 5).map((job) => (
                                    <div
                                        key={job._id}
                                        onClick={() => navigate(`/jobs/${job._id}`)}
                                        className="flex items-center justify-between p-4 rounded-xl border border-knotic-border hover:border-knotic-accent/50 cursor-pointer transition-all duration-200 hover:bg-knotic-bg"
                                    >
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="font-semibold text-knotic-text truncate">{job.company}</p>
                                            <p className="text-sm text-knotic-muted truncate">{job.position}</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            {job.aiAnalysis?.score && (
                                                <span className="text-sm font-bold px-2 py-1 rounded bg-knotic-bg border border-knotic-border text-knotic-text">
                                                    {job.aiAnalysis.score}% Fit
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                job.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-500' :
                                                job.status === 'Interviewing' ? 'bg-orange-500/10 text-orange-500' :
                                                job.status === 'Applied' ? 'bg-blue-500/10 text-blue-500' :
                                                job.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                                                'bg-knotic-accent/10 text-knotic-accent'
                                            }`}>
                                                {job.status}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-knotic-muted" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Funnel & Tasks (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Job Search Funnel */}
                    <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-knotic-text mb-4">Pipeline Funnel</h2>
                        <div className="space-y-4">
                            {Object.entries(statsData.statusCounts || {}).map(([status, count]) => {
                                const maxCount = Math.max(...Object.values(statsData.statusCounts), 1);
                                const percentage = (count / maxCount) * 100;
                                
                                // Color mapper
                                const colorClass = 
                                    status === 'Offer' ? 'bg-emerald-500' :
                                    status === 'Interviewing' ? 'bg-orange-500' :
                                    status === 'Applied' ? 'bg-blue-500' :
                                    status === 'Rejected' ? 'bg-rose-500' : 'bg-indigo-500';

                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-knotic-text font-medium">{status}</span>
                                            <span className="text-knotic-muted">{count}</span>
                                        </div>
                                        <div className="h-2 bg-knotic-bg border border-knotic-border/50 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upcoming Tasks Reminders */}
                    <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-knotic-text mb-4">Reminders</h2>
                        {statsData.upcomingTasks?.length > 0 ? (
                            <div className="space-y-4">
                                {statsData.upcomingTasks.map((task) => (
                                    <div 
                                        key={task._id} 
                                        onClick={() => navigate(`/jobs/${task._id}`)}
                                        className="p-3 bg-knotic-bg border border-knotic-border rounded-xl cursor-pointer hover:border-knotic-accent transition-colors flex items-start gap-3"
                                    >
                                        <div className="mt-0.5 p-1 bg-knotic-accent/10 rounded-lg text-knotic-accent">
                                            <CalendarClock className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-knotic-accent">
                                                Due: {new Date(task.nextActionDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm font-semibold text-knotic-text truncate">{task.company}</p>
                                            <p className="text-xs text-knotic-muted truncate">{task.nextActionNote || 'Follow up application'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-knotic-muted flex flex-col items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-2" />
                                <p className="text-sm font-medium text-knotic-text">All caught up!</p>
                                <p className="text-xs mt-1">No due reminders or follow-ups.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
