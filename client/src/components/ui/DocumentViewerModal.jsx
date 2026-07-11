import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DocumentViewerModal = ({ isOpen, onClose, title, content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!content) return;
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-knotic-bg/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-knotic-card border border-knotic-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-knotic-border bg-knotic-bg/50">
                            <h2 className="text-xl font-semibold text-knotic-text">{title}</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 text-knotic-muted hover:text-knotic-text hover:bg-knotic-border/50 rounded-lg transition-colors flex items-center gap-2"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                    <span className="hidden sm:inline text-sm font-medium">{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 text-knotic-muted hover:text-knotic-text hover:bg-knotic-border/50 rounded-lg transition-colors flex items-center gap-2"
                                    title="Download as TXT"
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="hidden sm:inline text-sm font-medium">Download</span>
                                </button>
                                <div className="w-px h-6 bg-knotic-border mx-2" />
                                <button
                                    onClick={onClose}
                                    className="p-2 text-knotic-muted hover:text-knotic-error hover:bg-knotic-error/10 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-knotic-card">
                            {content ? (
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none font-serif leading-relaxed text-knotic-text/90 whitespace-pre-wrap">
                                    {content}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-knotic-muted">
                                    No content available
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DocumentViewerModal;
