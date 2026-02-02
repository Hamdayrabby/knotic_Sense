import { motion } from 'framer-motion';

const ScoreGauge = ({ score, label, color = 'text-indigo-500', size = 'md' }) => {
    // Config based on size
    const config = {
        sm: { width: 60, stroke: 4, text: 'text-xs' },
        md: { width: 100, stroke: 8, text: 'text-lg' },
        lg: { width: 150, stroke: 12, text: 'text-3xl' },
    };

    const { width, stroke, text } = config[size] || config.md;
    const radius = (width - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width, height: width }}>
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        className="text-knotic-border"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx={width / 2}
                        cy={width / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={color}
                    />
                </svg>
                {/* Percentage Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-bold text-knotic-text ${text}`}>
                        {score}%
                    </span>
                </div>
            </div>
            {label && (
                <span className="mt-2 text-sm font-medium text-knotic-muted text-center">
                    {label}
                </span>
            )}
        </div>
    );
};

export default ScoreGauge;
