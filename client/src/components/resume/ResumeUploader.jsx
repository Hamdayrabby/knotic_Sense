import { Upload, Loader2, Sparkles } from 'lucide-react';

const ResumeUploader = ({ file, handleFileChange, handleUpload, isUploading }) => {
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
                        <p className="font-medium text-knotic-text">
                            {file ? file.name : 'Click or Drag PDF here'}
                        </p>
                        <p className="text-xs text-knotic-muted mt-1">Max 2MB. Text-based PDF only.</p>
                    </div>
                </div>

                {file && (
                    <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full bg-knotic-accent hover:bg-knotic-hover text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-knotic-accent/25"
                    >
                        {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        Process Resume
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResumeUploader;
