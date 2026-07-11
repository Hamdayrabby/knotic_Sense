import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Sparkles,
    Briefcase,
    FileText,
    Target,
    Brain,
    Upload,
    PlusCircle,
    BarChart3,
    ArrowRight,
    Github,
    ChevronDown,
    Zap,
    Shield,
    TrendingUp,
    Menu,
    X,
    Code,
    Database,
    Cpu,
    FileCheck
} from 'lucide-react';

import AnimatedCounter from '../components/landing/AnimatedCounter';
import FeatureCard from '../components/landing/FeatureCard';
import StepCard from '../components/landing/StepCard';

/* ═══════════════════════════════ LANDING PAGE ═══════════════════════════════ */
const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    // Track scroll for navbar background
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const features = [
        {
            icon: Target,
            title: 'ATS Score Analysis',
            description: 'Get an instant ATS-readiness score. Check your CV for completeness, formatting, and keyword richness to ensure it passes the screen.',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Brain,
            title: 'AI Role Suggestions',
            description: 'Upload your CV and let our AI analyze your profile to suggest the best-fitted job roles for your unique skills and experience.',
            gradient: 'from-emerald-500 to-green-500',
        },
        {
            icon: FileText,
            title: 'CV vs JD Gap Analysis',
            description: 'Instantly compare your CV against any job description. See exactly which keywords you\'re missing and which skills already match.',
            gradient: 'from-orange-500 to-amber-500',
        },
        {
            icon: Briefcase,
            title: 'Application Tracker',
            description: 'Organize every job application in one place — track status from Interested to Offer, add notes, and manage tailored CV versions.',
            gradient: 'from-purple-500 to-pink-500',
        },
    ];

    const steps = [
        {
            icon: Upload,
            title: 'Upload Your CV',
            description: 'Upload a PDF to get an instant ATS score and AI-suggested job roles that fit your profile.',
        },
        {
            icon: PlusCircle,
            title: 'Paste a Job Description',
            description: 'Add a job you\'re interested in, paste the description, and let the system analyze the gaps between your CV and the role.',
        },
        {
            icon: BarChart3,
            title: 'Find Gaps & Improve',
            description: 'See matched vs missing keywords, and get actionable suggestions to tailor your CV before hitting apply.',
        },
    ];

    return (
        <div className="min-h-screen bg-knotic-bg overflow-hidden">

            {/* ─── NAVBAR ─── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-knotic-bg/80 backdrop-blur-xl border-b border-knotic-border/50 shadow-lg' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-knotic-accent to-purple-500 flex items-center justify-center shadow-lg shadow-knotic-accent/25">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-knotic-text">Knotic Sense</span>
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-5 py-2.5 text-knotic-muted hover:text-knotic-text font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2.5 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-lg shadow-knotic-accent/25"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-knotic-muted hover:text-knotic-text"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-knotic-card/95 backdrop-blur-xl border-t border-knotic-border p-6 space-y-4">
                        <Link to="/login" className="block w-full text-center px-5 py-3 text-knotic-text font-medium rounded-xl border border-knotic-border hover:bg-knotic-border transition-colors">
                            Sign In
                        </Link>
                        <Link to="/register" className="block w-full text-center px-5 py-3 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl">
                            Get Started Free
                        </Link>
                    </div>
                )}
            </nav>

            {/* ─── HERO SECTION ─── */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Gradient orbs */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-knotic-accent/15 rounded-full blur-[120px] landing-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[120px] landing-float-delayed" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 landing-grid-pattern opacity-[0.03]" />
                </div>

                <div className="relative max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-knotic-accent/10 border border-knotic-accent/20 text-knotic-accent text-sm font-medium mb-8 landing-fade-up">
                        <Zap className="w-4 h-4" />
                        AI-Powered CV Gap Analysis
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-extrabold text-knotic-text mb-6 leading-tight tracking-tight landing-fade-up" style={{ animationDelay: '100ms' }}>
                        Know Your CV's{' '}
                        <span className="landing-gradient-text">Weak Spots</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-knotic-muted max-w-2xl mx-auto mb-10 leading-relaxed landing-fade-up" style={{ animationDelay: '200ms' }}>
                        Manage your CVs, compare them against job descriptions, and find exactly what's missing — before recruiters do. Track every application in one place.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 landing-fade-up" style={{ animationDelay: '300ms' }}>
                        <Link
                            to="/register"
                            className="group px-8 py-4 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-bold text-lg rounded-2xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-xl shadow-knotic-accent/30 hover:shadow-knotic-accent/50 flex items-center gap-3"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-4 text-knotic-muted hover:text-knotic-text font-medium text-lg rounded-2xl border border-knotic-border hover:border-knotic-accent/50 transition-all flex items-center gap-2"
                        >
                            See Features
                            <ChevronDown className="w-5 h-5" />
                        </a>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 landing-bounce">
                        <ChevronDown className="w-6 h-6 text-knotic-muted/50" />
                    </div>
                </div>
            </section>

            {/* ─── FEATURES SECTION ─── */}
            <section id="features" className="relative py-24 md:py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-knotic-text mb-4">
                            Your Complete{' '}
                            <span className="landing-gradient-text">Application Toolkit</span>
                        </h2>
                        <p className="text-knotic-muted text-lg max-w-xl mx-auto">
                            CV management, gap analysis, and application tracking — everything to prepare the perfect application.
                        </p>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, i) => (
                            <FeatureCard key={feature.title} {...feature} delay={i * 100} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="relative py-24 md:py-32 px-6">
                {/* Subtle bg accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-knotic-accent/[0.03] to-transparent pointer-events-none" />

                <div className="max-w-5xl mx-auto relative">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-knotic-text mb-4">
                            Three Steps to{' '}
                            <span className="landing-gradient-text">a Stronger CV</span>
                        </h2>
                        <p className="text-knotic-muted text-lg max-w-xl mx-auto">
                            Upload, analyze, and improve — in under two minutes.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line (desktop only) */}
                        <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-knotic-accent/30 via-purple-500/30 to-knotic-accent/30" />

                        {steps.map((step, i) => (
                            <StepCard key={step.title} number={i + 1} {...step} delay={i * 150} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── STATS / BADGES ─── */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="landing-glass-card rounded-3xl p-10 md:p-16">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <p className="text-4xl md:text-5xl font-extrabold text-knotic-text mb-2">
                                    <AnimatedCounter end={100} suffix="%" />
                                </p>
                                <p className="text-knotic-muted text-sm">Free to Use</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-extrabold text-knotic-text mb-2">
                                    <AnimatedCounter end={5} />
                                </p>
                                <p className="text-knotic-muted text-sm">Pipeline Stages</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-extrabold landing-gradient-text mb-2">
                                    AI
                                </p>
                                <p className="text-knotic-muted text-sm">Powered Analysis</p>
                            </div>
                            <div>
                                <p className="text-4xl md:text-5xl font-extrabold text-knotic-text mb-2">∞</p>
                                <p className="text-knotic-muted text-sm">Jobs & Resumes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── WHY KNOTIC ─── */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Text */}
                        <div>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-knotic-text mb-6 leading-tight">
                                Stop Guessing.{' '}
                                <span className="landing-gradient-text">See the Gaps.</span>
                            </h2>
                            <p className="text-knotic-muted text-lg leading-relaxed mb-8">
                                Most applicants never know why their CV gets filtered out. knotic_Sense compares your CV against any job description — showing missing keywords, skill gaps, and exactly what to add before you hit "Apply."
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: Shield, text: 'Get an ATS readiness score before you apply' },
                                    { icon: Zap, text: 'Discover AI-suggested job roles based on your CV' },
                                    { icon: TrendingUp, text: 'Spot missing keywords and skill gaps instantly' },
                                ].map(({ icon, text }) => (
                                    <div key={text} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-knotic-accent/10 flex items-center justify-center flex-shrink-0">
                                            {createElement(icon, { className: 'w-5 h-5 text-knotic-accent' })}
                                        </div>
                                        <p className="text-knotic-text">{text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Illustrative card mockup */}
                        <div className="relative">
                            <div className="landing-glass-card rounded-2xl p-6 space-y-4">
                                {/* Mock score display */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-knotic-muted">CV Match Score</p>
                                        <p className="text-4xl font-extrabold text-emerald-500">87%</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                                        <Target className="w-8 h-8 text-emerald-500" />
                                    </div>
                                </div>

                                {/* Mock keyword pills */}
                                <div>
                                    <p className="text-xs text-knotic-muted mb-2 uppercase tracking-wider">Found in Your CV</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['React', 'Node.js', 'MongoDB', 'REST API', 'TypeScript'].map(kw => (
                                            <span key={kw} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                                ✓ {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-knotic-muted mb-2 uppercase tracking-wider">Missing from CV</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['Docker', 'AWS'].map(kw => (
                                            <span key={kw} className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                                                ✗ {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Decorative glow */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-knotic-accent/10 to-purple-500/10 rounded-3xl blur-2xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ADVANCED TECHNOLOGY ─── */}
            <section className="py-24 px-6 bg-knotic-card/30 border-y border-knotic-border/50 relative">
                <div className="absolute inset-0 landing-grid-pattern opacity-[0.02]" />
                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4 landing-fade-up">
                            <Code className="w-4 h-4" />
                            Built for Accuracy & Speed
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-knotic-text mb-4">
                            Advanced Technology Inside
                        </h2>
                        <p className="text-knotic-muted text-lg max-w-2xl mx-auto">
                            knotic_Sense is powered by a modern stack and intelligent algorithms to give you the most accurate and secure experience possible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Detail Card 1 */}
                        <div className="landing-glass-card p-8 rounded-2xl hover:border-blue-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <Database className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Modern, Responsive Architecture</h3>
                            </div>
                            <p className="text-knotic-muted leading-relaxed">
                                Built on the lightning-fast MERN stack (MongoDB, Express, React, Node.js). The UI utilizes a custom Tailwind glassmorphism design system to ensure a seamless, app-like experience across all your devices, without relying on bulky component libraries.
                            </p>
                        </div>

                        {/* Detail Card 2 */}
                        <div className="landing-glass-card p-8 rounded-2xl hover:border-emerald-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                    <Cpu className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Transparent, Deterministic Scoring</h3>
                            </div>
                            <p className="text-knotic-muted leading-relaxed">
                                Our ATS scoring isn't a black box. The custom Node.js algorithm normalizes text, prevents keyword stuffing, and strictly evaluates your experience and degree relevance to give you a realistic, recruiter-level score breakdown you can trust.
                            </p>
                        </div>

                        {/* Detail Card 3 */}
                        <div className="landing-glass-card p-8 rounded-2xl hover:border-orange-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                    <FileCheck className="w-6 h-6 text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">AI-Powered PDF Extraction</h3>
                            </div>
                            <p className="text-knotic-muted leading-relaxed">
                                Your PDF resumes are parsed instantly using robust backend tools and structured by Hugging Face & Gemini LLMs via strict JSON prompts. The pipeline automatically categorizes your raw text into precise skills, experience timelines, and education history.
                            </p>
                        </div>

                        {/* Detail Card 4 */}
                        <div className="landing-glass-card p-8 rounded-2xl hover:border-purple-500/50 transition-colors group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                    <Shield className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Zero-Hallucination Architecture</h3>
                            </div>
                            <p className="text-knotic-muted leading-relaxed">
                                Don't settle for just another generic AI CV scorer. knotic_Sense is uniquely engineered to prevent LLM hallucinations. By decoupling the deterministic keyword extraction from the semantic AI analysis, we guarantee that your ATS score is based strictly on your actual experience, not AI fabrication.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FINAL CTA ─── */}
            <section className="py-24 md:py-32 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="relative">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-knotic-accent/20 via-purple-500/20 to-knotic-accent/20 rounded-3xl blur-3xl" />

                        <div className="relative landing-glass-card rounded-3xl p-12 md:p-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-knotic-accent to-purple-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-knotic-accent/30">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-knotic-text mb-4">
                                Ready to Optimize Your CV?
                            </h2>
                            <p className="text-knotic-muted text-lg max-w-lg mx-auto mb-8">
                                Upload your CV, paste a job description, and discover exactly what to improve. Free forever.
                            </p>
                            <Link
                                to="/register"
                                className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-bold text-lg rounded-2xl hover:from-knotic-hover hover:to-purple-600 transition-all shadow-xl shadow-knotic-accent/30 hover:shadow-knotic-accent/50"
                            >
                                Create Free Account
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-knotic-border/50 py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-knotic-accent to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-knotic-muted">
                            © {new Date().getFullYear()} Knotic Sense. Built by{' '}
                            <a href="https://github.com/Hamdayrabby" target="_blank" rel="noopener noreferrer" className="text-knotic-accent hover:text-knotic-hover transition-colors">
                                Hamday Rabby
                            </a>
                        </span>
                    </div>
                    <a
                        href="https://github.com/Hamdayrabby/knotic_Sense"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-knotic-muted hover:text-knotic-text transition-colors text-sm"
                    >
                        <Github className="w-5 h-5" />
                        View on GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
