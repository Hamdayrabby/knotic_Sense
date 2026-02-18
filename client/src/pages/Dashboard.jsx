import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Briefcase, TrendingUp, Clock, Target, Plus, Upload, List, Loader2 } from 'lucide-react';

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

    // Compute real stats from fetched jobs
    const stats = useMemo(() => {
        const total = jobs.length;
        const applied = jobs.filter(j => j.status === 'Applied').length;
        const interviewing = jobs.filter(j => j.status === 'Interviewing').length;
        const offers = jobs.filter(j => j.status === 'Offer').length;
        const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

        return [
            { label: 'Total Jobs', value: String(total), icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
            { label: 'Applied', value: String(applied), icon: Target, color: 'from-knotic-accent to-purple-500' },
            { label: 'Interviews', value: String(interviewing), icon: Clock, color: 'from-orange-500 to-amber-500' },
            { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
        ];
    }, [jobs]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-knotic-text">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
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
                        className="bg-knotic-card border border-knotic-border rounded-2xl p-6 hover:border-knotic-accent/50 transition-all duration-300"
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

            {/* Quick Actions */}
            <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-knotic-text mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => navigate('/jobs')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-medium rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all duration-200 shadow-lg shadow-knotic-accent/25"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Job
                    </button>
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

            {/* Empty state or recent activity */}
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

            {/* Recent Jobs (shown when jobs exist) */}
            {!isLoading && jobs.length > 0 && (
                <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-knotic-text">Recent Jobs</h2>
                        <button
                            onClick={() => navigate('/jobs')}
                            className="text-sm text-knotic-accent hover:text-knotic-hover transition-colors"
                        >
                            View all →
                        </button>
                    </div>
                    <div className="space-y-3">
                        {jobs.slice(0, 5).map((job) => (
                            <div
                                key={job._id}
                                onClick={() => navigate(`/jobs/${job._id}`)}
                                className="flex items-center justify-between p-4 rounded-xl border border-knotic-border hover:border-knotic-accent/50 cursor-pointer transition-all duration-200 hover:bg-knotic-bg"
                            >
                                <div>
                                    <p className="font-semibold text-knotic-text">{job.company}</p>
                                    <p className="text-sm text-knotic-muted">{job.position}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {job.aiAnalysis?.score && (
                                        <span className={`text-lg font-bold ${job.aiAnalysis.score >= 85 ? 'text-emerald-500' :
                                                job.aiAnalysis.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                                            }`}>
                                            {job.aiAnalysis.score}%
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'Offer' ? 'bg-emerald-500/10 text-emerald-500' :
                                            job.status === 'Interviewing' ? 'bg-orange-500/10 text-orange-500' :
                                                job.status === 'Applied' ? 'bg-blue-500/10 text-blue-500' :
                                                    job.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                                                        'bg-knotic-accent/10 text-knotic-accent'
                                        }`}>
                                        {job.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
