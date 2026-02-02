import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const NotesEditor = ({ initialNotes = '', onSave, isSaving }) => {
    const [notes, setNotes] = useState(initialNotes);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setNotes(initialNotes);
        setHasChanges(false);
    }, [initialNotes]);

    const handleChange = (e) => {
        setNotes(e.target.value);
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(notes);
        setHasChanges(false);
    };

    return (
        <div className="bg-knotic-card border border-knotic-border rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between p-3 border-b border-knotic-border bg-knotic-bg/50">
                <h3 className="text-sm font-semibold text-knotic-text">Interview Prep & Notes</h3>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hasChanges
                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                        : 'bg-knotic-border text-knotic-muted cursor-not-allowed'
                        }`}
                >
                    <Save className="w-3 h-3" />
                    {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
            </div>
            <textarea
                value={notes}
                onChange={handleChange}
                placeholder="# Interview Prep\n\n- Research company values\n- Prepare STAR stories\n- Questions for interviewer..."
                className="flex-1 w-full p-4 bg-transparent text-knotic-text resize-none focus:outline-none placeholder:text-knotic-muted/30 font-mono text-sm leading-relaxed"
            />
        </div>
    );
};

export default NotesEditor;
