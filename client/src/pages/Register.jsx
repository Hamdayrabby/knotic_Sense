import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await register(name, email, password);
            navigate('/dashboard');
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = () => {
        if (password.length === 0) return null;
        if (password.length < 6) return { label: 'Too short', color: 'text-knotic-error' };
        if (password.length < 8) return { label: 'Fair', color: 'text-yellow-500' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { label: 'Strong', color: 'text-knotic-success' };
        }
        return { label: 'Good', color: 'text-knotic-accent' };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="min-h-screen bg-knotic-bg flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-knotic-accent/10 via-transparent to-purple-500/10 pointer-events-none" />

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-knotic-accent to-purple-500 shadow-lg shadow-knotic-accent/25 mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-knotic-text">Create your account</h1>
                    <p className="text-knotic-muted mt-1">Start tracking your job applications</p>
                </div>

                {/* Card */}
                <div className="bg-knotic-card border border-knotic-border rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-knotic-text mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-knotic-text mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-knotic-text mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            {passwordStrength && (
                                <p className={`mt-1 text-xs ${passwordStrength.color}`}>
                                    Password strength: {passwordStrength.label}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-knotic-text mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent transition-all duration-200"
                                />
                                {confirmPassword && password === confirmPassword && (
                                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-success" />
                                )}
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-knotic-error/10 border border-knotic-error/20 rounded-xl text-knotic-error text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:ring-offset-2 focus:ring-offset-knotic-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="mt-6 text-center text-knotic-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-knotic-accent hover:text-knotic-hover font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
