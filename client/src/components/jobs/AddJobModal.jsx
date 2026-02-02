import { useState } from 'react';
import Modal from '../ui/Modal';
import { Building2, Briefcase, FileText, Loader2 } from 'lucide-react';

const AddJobModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        description: '',
        jobDescription: '',
        location: 'On-site',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.company.trim() || !formData.position.trim()) {
            setError('Company and Position are required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onSubmit(formData);
            // Reset form
            setFormData({
                company: '',
                position: '',
                description: '',
                jobDescription: '',
                location: 'On-site',
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create job');
        } finally {
            setIsLoading(false);
        }
    };

    const isValid = formData.company.trim() && formData.position.trim();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Job">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company */}
                <div>
                    <label className="block text-sm font-medium text-knotic-text mb-2">
                        Company *
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g. Google"
                            className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Position */}
                <div>
                    <label className="block text-sm font-medium text-knotic-text mb-2">
                        Position *
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-knotic-muted" />
                        <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="e.g. Frontend Developer"
                            className="w-full pl-10 pr-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-knotic-text mb-2">
                        Work Type
                    </label>
                    <select
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent"
                    >
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>

                {/* Brief Description */}
                <div>
                    <label className="block text-sm font-medium text-knotic-text mb-2">
                        Brief Description
                    </label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="e.g. Building web apps for search team"
                        className="w-full px-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent"
                    />
                </div>

                {/* Job Description (JD) */}
                <div>
                    <label className="block text-sm font-medium text-knotic-text mb-2">
                        <FileText className="inline w-4 h-4 mr-1" />
                        Full Job Description (for AI Analysis)
                    </label>
                    <textarea
                        name="jobDescription"
                        value={formData.jobDescription}
                        onChange={handleChange}
                        placeholder="Paste the complete job description here for AI matching analysis..."
                        rows={5}
                        className="w-full px-4 py-3 bg-knotic-bg border border-knotic-border rounded-xl text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent resize-none max-h-40 overflow-y-auto"
                    />
                    <p className="text-xs text-knotic-muted mt-1">
                        The more complete the JD, the better the AI match analysis
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-knotic-error">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-knotic-bg border border-knotic-border text-knotic-text font-medium rounded-xl hover:bg-knotic-border transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid || isLoading}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-knotic-accent to-purple-500 text-white font-semibold rounded-xl hover:from-knotic-hover hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            'Add Job'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddJobModal;
