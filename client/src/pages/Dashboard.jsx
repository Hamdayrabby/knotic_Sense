import { useAuth } from '../context/AuthContext';
import { Briefcase, TrendingUp, Clock, Target } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    // Placeholder stats (will be dynamic later)
    const stats = [
        { label: 'Total Jobs', value: '0', icon: Briefcase, color: 'from-blue-500 to-cyan-500' },
        { label: 'Applied', value: '0', icon: Target, color: 'from-knotic-accent to-purple-500' },
        { label: 'Interviews', value: '0', icon: Clock, color: 'from-orange-500 to-amber-500' },
        { label: 'Success Rate', value: '0%', icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
    ];

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
                                <p className="text-3xl font-bold text-knotic-text mt-2">{stat.value}</p>
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
                    <button className="px-6 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-medium rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all duration-200 shadow-lg shadow-knotic-accent/25">
                        + Add New Job
                    </button>
                    <button className="px-6 py-3 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:border-knotic-accent hover:text-knotic-accent transition-all duration-200">
                        Upload Resume
                    </button>
                    <button className="px-6 py-3 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:border-knotic-accent hover:text-knotic-accent transition-all duration-200">
                        View All Jobs
                    </button>
                </div>
            </div>

            {/* Empty state */}
            <div className="bg-knotic-card border border-knotic-border rounded-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-knotic-accent/20 to-purple-500/20 flex items-center justify-center mb-6">
                    <Briefcase className="w-10 h-10 text-knotic-accent" />
                </div>
                <h3 className="text-xl font-semibold text-knotic-text mb-2">No jobs tracked yet</h3>
                <p className="text-knotic-muted max-w-md mx-auto">
                    Start by adding jobs you're interested in. We'll help you track your applications and analyze your resume match.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
