import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const statusConfig = {
    Interested: { color: 'bg-blue-500', icon: Circle },
    Applied: { color: 'bg-indigo-500', icon: Clock },
    Interviewing: { color: 'bg-amber-500', icon: Clock },
    Offer: { color: 'bg-emerald-500', icon: CheckCircle2 },
    Rejected: { color: 'bg-red-500', icon: Circle },
};

const Timeline = ({ history = [] }) => {
    // Sort history by date descending (newest first)
    const sortedHistory = [...history].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { x: -20, opacity: 0 },
        show: { x: 0, opacity: 1 }
    };

    if (history.length === 0) {
        return <div className="text-knotic-muted text-sm italic">No timeline data available.</div>;
    }

    return (
        <div className="relative pl-4 border-l-2 border-knotic-border space-y-8">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
            >
                {sortedHistory.map((entry, index) => {
                    const statusInfo = statusConfig[entry.status] || { color: 'bg-gray-500', icon: Circle };
                    const Icon = statusInfo.icon;

                    return (
                        <motion.div key={index} variants={item} className="mb-8 relative last:mb-0">
                            {/* Dot on the line */}
                            <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full ${statusInfo.color} border-2 border-knotic-bg shadow-sm z-10`} />

                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-knotic-text text-lg">
                                    {entry.status}
                                </span>
                                <span className="text-xs text-knotic-muted">
                                    {format(new Date(entry.changedAt), 'PP p')}
                                </span>
                                {entry.note && (
                                    <p className="mt-2 text-sm text-knotic-muted bg-knotic-card/50 p-3 rounded-lg border border-knotic-border">
                                        {entry.note}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default Timeline;
