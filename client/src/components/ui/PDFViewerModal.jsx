import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';

const PDFViewerModal = ({ isOpen, onClose, title, document }) => {
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
                        className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-knotic-card border border-knotic-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-knotic-border bg-knotic-bg/50">
                            <h2 className="text-xl font-semibold text-knotic-text">{title}</h2>
                            <div className="flex items-center gap-2">
                                <PDFDownloadLink document={document} fileName={`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`}>
                                    {({ loading }) => (
                                        <button
                                            disabled={loading}
                                            className="px-4 py-2 bg-knotic-accent hover:bg-knotic-hover text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span className="hidden sm:inline">{loading ? 'Preparing...' : 'Download PDF'}</span>
                                        </button>
                                    )}
                                </PDFDownloadLink>
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

                        {/* Body - PDF Viewer */}
                        <div className="flex-1 bg-gray-100 overflow-hidden rounded-b-2xl">
                            <PDFViewer width="100%" height="100%" className="border-none">
                                {document}
                            </PDFViewer>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PDFViewerModal;
