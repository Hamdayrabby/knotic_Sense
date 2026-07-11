import { useState } from 'react';
import { Calendar, Save } from 'lucide-react';

const formatDateInput = (date) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 10);
};

const NextActionCard = ({ date, note, onSave }) => {
    const [nextActionDate, setNextActionDate] = useState(formatDateInput(date));
    const [nextActionNote, setNextActionNote] = useState(note || '');
    const [isSaving, setIsSaving] = useState(false);

    const hasChanges = nextActionDate !== formatDateInput(date) || nextActionNote !== (note || '');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                nextActionDate,
                nextActionNote
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-knotic-accent" />
                Next Action
            </h3>
            <div className="space-y-3">
                <input
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="w-full px-3 py-2 bg-knotic-bg border border-knotic-border rounded-lg text-knotic-text focus:outline-none focus:ring-2 focus:ring-knotic-accent"
                />
                <textarea
                    value={nextActionNote}
                    onChange={(e) => setNextActionNote(e.target.value)}
                    rows={3}
                    placeholder="Follow up, prepare interview notes, send thank-you email..."
                    className="w-full px-3 py-2 bg-knotic-bg border border-knotic-border rounded-lg text-knotic-text placeholder:text-knotic-muted/50 focus:outline-none focus:ring-2 focus:ring-knotic-accent resize-none"
                />
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-knotic-accent text-white font-medium hover:bg-knotic-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Reminder'}
                </button>
            </div>
        </div>
    );
};

export default NextActionCard;
