import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    User, Mail, Lock, Shield, FileText,
    Download, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileLoading, setProfileLoading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Export State
    const [exportLoading, setExportLoading] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const { data } = await api.put('/user/profile', { name, email });
            toast.success('Profile updated successfully');
            
            // Re-auth to update context - using the existing token but fetching new user data
            // Alternatively, we can just update local storage and reload, but let's assume AuthContext handles it via reload or api
            if (data.data) {
                localStorage.setItem('knotic_user', JSON.stringify(data.data));
                window.location.reload(); // Simple way to refresh context
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match');
        }
        if (newPassword.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setPasswordLoading(true);
        try {
            await api.put('/user/password', {
                currentPassword,
                newPassword
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            // Fetch as blob
            const response = await api.get('/jobs/export', { responseType: 'blob' });
            
            // Create a download link and trigger it
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'my_job_applications.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Data exported successfully');
        } catch {
            toast.error('Failed to export data');
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-knotic-text">Settings</h1>
                <p className="text-knotic-muted mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'profile' 
                                ? 'bg-knotic-accent/10 text-knotic-accent' 
                                : 'text-knotic-muted hover:bg-knotic-card hover:text-knotic-text'
                        }`}
                    >
                        <User size={18} />
                        <span className="font-medium">Profile</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'security' 
                                ? 'bg-knotic-accent/10 text-knotic-accent' 
                                : 'text-knotic-muted hover:bg-knotic-card hover:text-knotic-text'
                        }`}
                    >
                        <Shield size={18} />
                        <span className="font-medium">Security</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('data')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'data' 
                                ? 'bg-knotic-accent/10 text-knotic-accent' 
                                : 'text-knotic-muted hover:bg-knotic-card hover:text-knotic-text'
                        }`}
                    >
                        <FileText size={18} />
                        <span className="font-medium">Data & Export</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-knotic-text mb-6">Profile Information</h2>
                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-knotic-text mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-knotic-text mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-knotic-border">
                                    <button
                                        type="submit"
                                        disabled={profileLoading || (name === user?.name && email === user?.email)}
                                        className="px-6 py-2.5 bg-knotic-accent text-white font-medium rounded-xl hover:bg-knotic-hover focus:ring-2 focus:ring-offset-2 focus:ring-knotic-accent focus:ring-offset-knotic-bg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-knotic-text mb-6">Change Password</h2>
                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-knotic-text mb-2">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-knotic-text mb-2">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-knotic-text mb-2">Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-knotic-border">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                                        className="px-6 py-2.5 bg-knotic-accent text-white font-medium rounded-xl hover:bg-knotic-hover focus:ring-2 focus:ring-offset-2 focus:ring-knotic-accent focus:ring-offset-knotic-bg transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Data Tab */}
                    {activeTab === 'data' && (
                        <div className="bg-knotic-card border border-knotic-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-knotic-text mb-6">Data & Export</h2>
                            
                            <div className="bg-knotic-bg/50 border border-knotic-border rounded-xl p-5 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-knotic-text font-medium mb-1">Export Job Applications</h3>
                                        <p className="text-sm text-knotic-muted mb-4">
                                            Download a complete CSV backup of all your tracked job applications, including status, ATS scores, and dates.
                                        </p>
                                        <button
                                            onClick={handleExport}
                                            disabled={exportLoading}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700 flex items-center gap-2"
                                        >
                                            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Download CSV
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Danger Zone Placeholder */}
                            <div className="border border-red-500/20 rounded-xl p-5 bg-red-500/5">
                                <h3 className="text-red-400 font-medium flex items-center gap-2 mb-2">
                                    <AlertCircle size={18} />
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 text-sm font-medium rounded-lg transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
