import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    LogOut,
    Sparkles,
    Shield,
    Settings,
    X,
    Sun,
    Moon,
    Monitor
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [theme, setTheme] = useTheme();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/jobs', icon: Briefcase, label: 'Jobs' },
        { to: '/resume', icon: FileText, label: 'Resume' },
        { to: '/settings', icon: Settings, label: 'Settings' }
    ];

    // Conditionally add admin link for admin users
    if (user?.role === 'admin') {
        navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
    }

    return (
        <aside
            className={`fixed left-0 top-0 h-screen w-64 bg-knotic-card border-r border-knotic-border flex flex-col transition-transform duration-300 z-50 
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        >
            {/* Logo */}
            <div className="p-6 border-b border-knotic-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-knotic-accent to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-knotic-text">Knotic Sense</h1>
                        <p className="text-xs text-knotic-muted">Job Tracker AI</p>
                    </div>
                </div>
                {/* Close button on mobile */}
                <button
                    onClick={onClose}
                    className="md:hidden p-1 rounded-lg text-knotic-muted hover:bg-knotic-border hover:text-knotic-text"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                onClick={() => onClose && onClose()} // Close on click (mobile)
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-knotic-accent text-white shadow-lg shadow-knotic-accent/25'
                                        : 'text-knotic-muted hover:bg-knotic-border hover:text-knotic-text'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Theme & User & Logout */}
            <div className="p-4 border-t border-knotic-border space-y-4">
                {/* Theme Selector */}
                <div className="flex items-center justify-between bg-knotic-bg border border-knotic-border rounded-xl p-1">
                    <button
                        onClick={() => setTheme('light')}
                        title="Light Mode"
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                            theme === 'light'
                                ? 'bg-knotic-card text-knotic-accent border border-knotic-border/50 shadow-sm'
                                : 'text-knotic-muted hover:text-knotic-text'
                        }`}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        title="System Preference"
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                            theme === 'system'
                                ? 'bg-knotic-card text-knotic-accent border border-knotic-border/50 shadow-sm'
                                : 'text-knotic-muted hover:text-knotic-text'
                        }`}
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        title="Dark Mode"
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                            theme === 'dark'
                                ? 'bg-knotic-card text-knotic-accent border border-knotic-border/50 shadow-sm'
                                : 'text-knotic-muted hover:text-knotic-text'
                        }`}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>

                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-knotic-accent to-purple-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-knotic-text truncate">{user?.name}</p>
                        <p className="text-xs text-knotic-muted truncate">{user?.email}</p>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-knotic-muted hover:bg-knotic-error/10 hover:text-knotic-error transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
