import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle2, Loader2, Briefcase, GraduationCap, Code, Award, User as UserIcon, Mail, Phone, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScoreGauge from '../components/job-details/ScoreGauge';
import KeywordChips from '../components/job-details/KeywordChips';

const Resume = () => {
    const { user, setUser } = useAuth();
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, skills, experience, education

    // Resume Data Access
    const resumeData = user?.resumeStructured || null;
    const analysisData = resumeData?._analysis || null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            if (selectedFile.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB');
                return;
            }
            setFile(selectedFile);
        } else {
            toast.error('Please select a valid PDF file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await api.post('/resume/test-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { structured } = response.data.data;

            // Allow for analysis data persistence if we already had it? 
            // Usually new upload means new analysis needed.
            const updatedUser = { ...user, resumeStructured: structured };
            setUser(updatedUser);
            localStorage.setItem('knotic_user', JSON.stringify(updatedUser));

            setFile(null);
            toast.success('Resume parsed successfully!');

            // Auto-trigger scoring?
            handleCalculateScore(updatedUser);

        } catch (error) {
            console.error('Upload failed:', error);
            const msg = error.response?.data?.message || 'Upload failed';
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCalculateScore = async (currentUser = user) => {
        setIsCalculating(true);
        const toastId = toast.loading('Analyzing Resume Strength...');
        try {
            const res = await api.post('/resume/score');
            const scoreData = res.data.data;

            // Merge score into structure using _analysis key
            const updatedUser = {
                ...currentUser,
                resumeStructured: {
                    ...currentUser.resumeStructured,
                    _analysis: scoreData
                }
            };
            setUser(updatedUser);
            localStorage.setItem('knotic_user', JSON.stringify(updatedUser)); // Persist

            toast.success('Analysis Complete!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Scoring failed', { id: toastId });
        } finally {
            setIsCalculating(false);
        }
    };

    if (!resumeData && !file) {
        return (
            <div className="max-w-xl mx-auto mt-12">
                <div className="bg-knotic-card border border-knotic-border rounded-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-knotic-accent/10 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-10 h-10 text-knotic-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Upload Your Resume</h2>
                        <p className="text-knotic-muted mt-2">Upload your PDF resume to unlock AI insights, automated matching, and gap analysis.</p>
                    </div>

                    <div className="border-2 border-dashed border-knotic-border rounded-xl p-8 hover:border-knotic-accent transition-colors bg-knotic-bg/50 relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="pointer-events-none">
                            <p className="font-medium text-knotic-text">Click or Drag PDF here</p>
                            <p className="text-xs text-knotic-muted mt-1">Max 2MB. Text-based PDF only.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Resume Profile</h1>
                    <p className="text-knotic-muted">Managed parsed data and AI insights</p>
                </div>

                {/* Re-upload small button */}
                <div className="relative">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                            handleFileChange(e);
                            // Automatically trigger upload logic if file selected?
                            // For now just set state, user must click upload if we had a dedicated button, 
                            // but here we might want immediate action or a confirmation modal.
                            // Let's keep it simple: Select file -> show preview -> Click "Update Resume"
                            if (e.target.files[0]) toast('File selected. Click "Update" to process.');
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <button className="bg-knotic-card hover:bg-knotic-border border border-knotic-border text-knotic-text px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        {file ? file.name : 'Update Resume'}
                    </button>
                </div>
                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="bg-knotic-accent hover:bg-knotic-hover text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 animate-pulse"
                    >
                        {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                        Map & Structure PDF
                    </button>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Profile Card & Summary (4 Cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Candidate Profile */}
                    <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-knotic-accent to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                {resumeData?.candidate?.name?.charAt(0) || <UserIcon />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{resumeData?.candidate?.name || 'Unknown Candidate'}</h2>
                                <p className="text-sm text-knotic-muted">Parsed Profile</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            {resumeData?.candidate?.email && (
                                <div className="flex items-center gap-3 text-knotic-text">
                                    <Mail className="w-4 h-4 text-knotic-muted" />
                                    {resumeData.candidate.email}
                                </div>
                            )}
                            {resumeData?.candidate?.phone && (
                                <div className="flex items-center gap-3 text-knotic-text">
                                    <Phone className="w-4 h-4 text-knotic-muted" />
                                    {resumeData.candidate.phone}
                                </div>
                            )}
                            {resumeData?.candidate?.links?.map((link, i) => (
                                <div key={i} className="flex items-center gap-3 text-knotic-accent hover:underline overflow-hidden">
                                    <LinkIcon className="w-4 h-4 text-knotic-muted flex-shrink-0" />
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="truncate">{link}</a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overall Score */}
                    <div className="bg-knotic-card border border-knotic-border rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles className="w-24 h-24 text-knotic-accent" />
                        </div>
                        <h3 className="font-semibold text-white mb-4">ATS Readiness</h3>

                        {analysisData ? (
                            <div className="flex flex-col items-center">
                                <ScoreGauge score={analysisData.overallScore || 0} size="lg" />
                                <div className="mt-4 text-center">
                                    <p className="font-bold text-lg text-white">{analysisData.quality?.level || 'Assessment Complete'}</p>
                                    <p className="text-sm text-knotic-muted">{analysisData.quality?.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    <div className="bg-knotic-bg/50 p-2 rounded text-center">
                                        <p className="text-xs text-knotic-muted">Completeness</p>
                                        <p className="font-bold text-knotic-text">{analysisData.scoreBreakdown?.completeness}%</p>
                                    </div>
                                    <div className="bg-knotic-bg/50 p-2 rounded text-center">
                                        <p className="text-xs text-knotic-muted">Keywords</p>
                                        <p className="font-bold text-knotic-text">{analysisData.scoreBreakdown?.keywordRichness}%</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCalculateScore()}
                                    disabled={isCalculating}
                                    className="mt-6 w-full py-2 rounded-lg border border-knotic-border hover:bg-knotic-border transition-colors text-sm text-knotic-muted"
                                >
                                    {isCalculating ? 'Recalculating...' : 'Refresh Analysis'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-knotic-muted mb-4">No analysis data yet.</p>
                                <button
                                    onClick={() => handleCalculateScore()}
                                    disabled={isCalculating}
                                    className="bg-knotic-accent hover:bg-knotic-hover text-white px-6 py-2 rounded-lg font-semibold w-full"
                                >
                                    {isCalculating ? 'Analyzing...' : 'Run Diagnostics'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Detailed Tabs (8 Cols) */}
                <div className="lg:col-span-8">
                    {/* Tabs Navigation */}
                    <div className="flex border-b border-knotic-border mb-6 overflow-x-auto">
                        {['overview', 'skills', 'experience', 'education'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 capitalize whitespace-nowrap ${activeTab === tab
                                        ? 'border-knotic-accent text-knotic-text'
                                        : 'border-transparent text-knotic-muted hover:text-knotic-text'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[400px]">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {analysisData ? (
                                    <>
                                        {/* Suggested Jobs */}
                                        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <Briefcase className="w-5 h-5 text-knotic-accent" />
                                                Suggested Roles
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisData.suggestedJobs?.map((job, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm">
                                                        {job}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Strengths */}
                                            <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                                <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Top Strengths
                                                </h3>
                                                <ul className="space-y-2">
                                                    {analysisData.strengths?.map((item, i) => (
                                                        <li key={i} className="text-sm text-knotic-text flex items-start gap-2">
                                                            <span className="text-emerald-500 mt-1">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Improvements */}
                                            <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                                <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> Focus Areas
                                                </h3>
                                                <ul className="space-y-2">
                                                    {analysisData.improvements?.map((item, i) => (
                                                        <li key={i} className="text-sm text-knotic-text flex items-start gap-2">
                                                            <span className="text-amber-500 mt-1">•</span> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Summary text */}
                                        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
                                            <h3 className="font-semibold text-white mb-2">Professional Summary</h3>
                                            <p className="text-knotic-muted leading-relaxed italic">
                                                "{analysisData.summary}"
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-12 text-knotic-muted">
                                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Run the analysis to see AI insights.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* SKILLS TAB */}
                        {activeTab === 'skills' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-knotic-card border border-knotic-border rounded-xl p-6 space-y-8">
                                {resumeData?.skills ? (
                                    <>
                                        {Object.entries(resumeData.skills).map(([category, items]) => (
                                            items && items.length > 0 && (
                                                <div key={category}>
                                                    <h3 className="text-sm font-semibold text-knotic-muted uppercase tracking-wider mb-3">{category}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {items.map((skill, i) => (
                                                            <span key={i} className="px-3 py-1.5 rounded-md bg-knotic-bg border border-knotic-border text-sm text-knotic-text hover:border-knotic-accent transition-colors">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </>
                                ) : (
                                    <p className="text-knotic-muted">No skills parsed.</p>
                                )}
                            </motion.div>
                        )}

                        {/* EXPERIENCE TAB */}
                        {activeTab === 'experience' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                {resumeData?.experience?.map((role, i) => (
                                    <div key={i} className="bg-knotic-card border border-knotic-border rounded-xl p-6 relative">
                                        <div className="absolute left-0 top-6 w-1 h-8 bg-knotic-accent rounded-r-full"></div>
                                        <div className="pl-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-white">{role.role}</h3>
                                                <span className="text-sm font-medium text-knotic-accent bg-knotic-accent/10 px-2 py-1 rounded">
                                                    {role.duration || 'Date Unknown'}
                                                </span>
                                            </div>
                                            <p className="text-knotic-muted font-medium mb-4">{role.company}</p>
                                            <ul className="space-y-2">
                                                {role.details?.map((detail, j) => (
                                                    <li key={j} className="text-sm text-knotic-text/80 pl-4 border-l-2 border-knotic-border leading-relaxed">
                                                        {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )) || <p className="text-knotic-muted">No experience found.</p>}
                            </motion.div>
                        )}

                        {/* EDUCATION TAB */}
                        {activeTab === 'education' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                {resumeData?.education?.map((edu, i) => (
                                    <div key={i} className="bg-knotic-card border border-knotic-border rounded-xl p-6 flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-knotic-bg flex items-center justify-center flex-shrink-0">
                                            <GraduationCap className="w-6 h-6 text-knotic-muted" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{edu.institution}</h3>
                                            <p className="text-knotic-text">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</p>
                                            <div className="flex gap-4 mt-2 text-sm text-knotic-muted">
                                                <span>{edu.start} - {edu.end || 'Present'}</span>
                                                {edu.gpa && <span>GPA: {edu.gpa}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )) || <p className="text-knotic-muted">No education found.</p>}
                            </motion.div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Resume;
