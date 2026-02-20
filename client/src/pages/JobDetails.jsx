import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import Timeline from '../components/job-details/Timeline';
import ScoreGauge from '../components/job-details/ScoreGauge';
import KeywordChips from '../components/job-details/KeywordChips';
import ImprovementPanel from '../components/job-details/ImprovementPanel';
import NotesEditor from '../components/job-details/NotesEditor';

// Skeleton Loader
const DetailsSkeleton = () => (
    <div className="animate-pulse max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        <div className="h-8 bg-knotic-border/50 rounded w-1/3 mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
                <div className="flex gap-4 border-b border-knotic-border pb-2 mb-6">
                    <div className="h-10 w-40 bg-knotic-border/30 rounded"></div>
                    <div className="h-10 w-40 bg-knotic-border/30 rounded"></div>
                </div>
                <div className="h-48 bg-knotic-border/30 rounded-xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-knotic-border/30 rounded-xl"></div>
                    <div className="h-64 bg-knotic-border/30 rounded-xl"></div>
                </div>
            </div>
            <div className="lg:col-span-4">
                <div className="h-[500px] bg-knotic-border/30 rounded-xl sticky top-6"></div>
            </div>
        </div>
    </div>
);

// Scanning Animation
const ScanningOverlay = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-knotic-bg/80 backdrop-blur-sm"
    >
        <div className="relative">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-knotic-accent border-t-transparent rounded-full"
            />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-knotic-accent" />
        </div>
        <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-4 text-knotic-accent font-medium tracking-wider"
        >
            ANALYZING RESUME MATCH...
        </motion.p>
    </motion.div>
);

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, notes

    const { user } = useAuth();
    const resumeHistory = user?.resumes || [];
    const [selectedResumeId, setSelectedResumeId] = useState('');

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const response = await api.get('/jobs');
            const foundJob = response.data.data.find(j => j._id === id);

            if (foundJob) {
                setJob(foundJob);
            } else {
                setError('Job not found');
            }
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Failed to load job details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveNotes = async (newNotes) => {
        try {
            // Optimistic update
            setJob(prev => ({ ...prev, notes: newNotes }));

            await api.put(`/jobs/${id}`, {
                notes: newNotes
            });
            toast.success('Notes saved');
        } catch (err) {
            console.error('Failed to save notes:', err);
            toast.error('Failed to save notes');
            // Revert logic could be added here
        }
    };

    const handleAnalyze = async (file = null) => {
        setIsAnalyzing(true);

        try {
            let response;
            if (file) {
                const formData = new FormData();
                formData.append('resume', file);
                // Must set Content-Type to undefined to let axios auto-set multipart/form-data with boundary
                response = await api.post(`/jobs/${id}/analyze`, formData, {
                    headers: { 'Content-Type': undefined },
                    timeout: 120000 // 2 minute timeout
                });
            } else {
                const payload = selectedResumeId ? { resumeId: selectedResumeId } : {};
                response = await api.post(`/jobs/${id}/analyze`, payload, {
                    timeout: 120000
                });
            }

            console.log('Analysis response:', response.data);
            console.log('Cached?', response.data.cached);
            console.log('New analysis data:', response.data.data);

            setJob(prev => ({ ...prev, aiAnalysis: response.data.data }));
            toast.success(response.data.cached ? 'Using cached analysis' : 'Fresh analysis complete!', { id: 'reanalyze' });
        } catch (err) {
            console.error('Analysis failed:', err);
            toast.error(err.response?.data?.message || err.message, { id: 'reanalyze' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isLoading) return <div className="p-8"><DetailsSkeleton /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-rose-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="text-xl font-semibold">{error}</p>
            <button onClick={() => navigate('/jobs')} className="mt-4 text-knotic-accent hover:underline">
                Back to Jobs
            </button>
        </div>
    );
    if (!job) return null;

    const { aiAnalysis } = job;
    const score = aiAnalysis?.score || 0;

    // Visibility Zone Color
    let visibilityColor = 'bg-gray-500/10 border-gray-500/20';
    if (score >= 85) visibilityColor = 'bg-emerald-500/10 border-emerald-500/30';
    else if (score >= 60) visibilityColor = 'bg-amber-500/10 border-amber-500/30';
    else if (score > 0) visibilityColor = 'bg-rose-500/10 border-rose-500/30';

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 relative min-h-screen">
            <AnimatePresence>
                {isAnalyzing && <ScanningOverlay />}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/jobs')}
                    className="flex items-center gap-2 text-knotic-muted hover:text-knotic-text transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{job.position}</h1>
                        <p className="text-knotic-muted text-lg">{job.company} • {job.location}</p>
                    </div>

                    {/* Primary Action */}
                    {!aiAnalysis ? (
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="job-resume-upload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleAnalyze(e.target.files[0]);
                                    }}
                                />
                                <label
                                    htmlFor="job-resume-upload"
                                    className="cursor-pointer text-sm text-knotic-muted hover:text-knotic-text hover:underline px-2 py-1"
                                >
                                    Upload Custom CV
                                </label>
                                <button
                                    onClick={() => handleAnalyze()}
                                    className="bg-gradient-to-r from-knotic-accent to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" /> Run Analysis
                                </button>
                            </div>

                            {/* CV Selector */}
                            {resumeHistory.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-knotic-muted mt-2">
                                    <span>Using CV:</span>
                                    <div className="relative">
                                        <select
                                            value={selectedResumeId}
                                            onChange={(e) => setSelectedResumeId(e.target.value)}
                                            className="appearance-none bg-knotic-card border border-knotic-border rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-knotic-accent cursor-pointer"
                                        >
                                            <option value="">Default Profile CV</option>
                                            {[...resumeHistory].reverse().map(r => (
                                                <option key={r._id} value={r._id}>{r.fileName}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-2 top-1.5 pointer-events-none opacity-50" />
                                    </div>
                                </div>
                            )}
                            {resumeHistory.length === 0 && <p className="text-xs text-knotic-muted opacity-60">Using Default Profile Resume</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="job-resume-reupload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            toast.loading('Re-analyzing with new CV...', { id: 'reanalyze' });
                                            handleAnalyze(file);
                                            e.target.value = ''; // Reset input to allow re-selecting same file
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="job-resume-reupload"
                                    className="cursor-pointer text-sm font-medium text-knotic-accent bg-knotic-accent/10 hover:bg-knotic-accent hover:text-white px-4 py-2 rounded-lg transition-all border border-knotic-accent/20 flex items-center gap-2 h-12"
                                >
                                    <FileText className="w-4 h-4" /> Update CV
                                </label>
                                <button
                                    onClick={() => {
                                        toast.loading('Re-analyzing...', { id: 'reanalyze' });
                                        handleAnalyze();
                                    }}
                                    className="bg-knotic-card hover:bg-knotic-border border border-knotic-border text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all h-12"
                                >
                                    <Sparkles className="w-4 h-4" /> Re-Analyze
                                </button>
                                <div className={`px-5 py-2 rounded-xl border ${visibilityColor} flex items-center gap-3 h-12`}>
                                    <ScoreGauge score={score} size="sm" color={score >= 85 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500'} />
                                    <div>
                                        <p className="text-xs text-knotic-muted uppercase tracking-wider">Visibility Zone</p>
                                        <p className="font-bold text-knotic-text">{aiAnalysis.visibility?.zone || 'Calculated'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* CV Selector for Re-Analysis */}
                            {resumeHistory.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-knotic-muted mt-2">
                                    <span>Test against CV:</span>
                                    <div className="relative">
                                        <select
                                            value={selectedResumeId}
                                            onChange={(e) => setSelectedResumeId(e.target.value)}
                                            className="appearance-none bg-knotic-card border border-knotic-border rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-knotic-accent cursor-pointer"
                                        >
                                            <option value="">Default Profile CV</option>
                                            {[...resumeHistory].reverse().map(r => (
                                                <option key={r._id} value={r._id}>{r.fileName}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-2 top-1.5 pointer-events-none opacity-50" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Main Content (Tabs) - Spans 8 cols */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Tabs */}
                    <div className="flex border-b border-knotic-border">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-knotic-accent text-knotic-text' : 'border-transparent text-knotic-muted hover:text-knotic-text'}`}
                        >
                            Overview & Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'notes' ? 'border-knotic-accent text-knotic-text' : 'border-transparent text-knotic-muted hover:text-knotic-text'}`}
                        >
                            Interview Notes
                        </button>
                    </div>

                    <div className="min-h-[500px]">
                        {activeTab === 'overview' ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Score Breakdown */}
                                {aiAnalysis ? (
                                    <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                        <h3 className="text-lg font-semibold text-white mb-6">Match Breakdown</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <ScoreGauge score={aiAnalysis.scoreBreakdown?.keywords || 0} label="Keywords" size="sm" />
                                            <ScoreGauge score={aiAnalysis.scoreBreakdown?.skills || 0} label="Skills" size="sm" />
                                            <ScoreGauge score={aiAnalysis.scoreBreakdown?.experience || 0} label="Experience" size="sm" />
                                            <ScoreGauge score={aiAnalysis.scoreBreakdown?.education || 0} label="Education" size="sm" />
                                            <ScoreGauge score={aiAnalysis.scoreBreakdown?.formatting || 0} label="Format" size="sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-knotic-card border border-knotic-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] border-dashed">
                                        <Sparkles className="w-12 h-12 text-knotic-muted mb-4 opacity-50" />
                                        <h3 className="text-lg font-medium text-knotic-text">No Analysis Yet</h3>
                                        <p className="text-knotic-muted max-w-sm mt-2">Run the AI analysis to see how well your resume matches this job description.</p>
                                    </div>
                                )}

                                {/* Actionable Advice */}
                                {aiAnalysis && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Improvement Plan</h3>
                                            <ImprovementPanel analysis={aiAnalysis} />
                                        </div>
                                        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-white mb-4">Keyword Gaps</h3>
                                            <KeywordChips matched={aiAnalysis.matchedKeywords} missing={aiAnalysis.missingKeywords} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                                <NotesEditor
                                    initialNotes={job.notes}
                                    onSave={handleSaveNotes}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Timeline & Status - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-knotic-card border border-knotic-border rounded-xl p-6 sticky top-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            Activity Timeline
                        </h3>
                        <Timeline history={job.statusHistory} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JobDetails;
