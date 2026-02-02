import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative w-full max-w-sm bg-knotic-card border border-knotic-border rounded-2xl shadow-2xl p-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-knotic-error/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-knotic-error" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-knotic-text text-center mb-2">{title}</h3>
                <p className="text-sm text-knotic-muted text-center mb-6">{message}</p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:bg-knotic-border transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-2.5 px-4 bg-knotic-error text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
