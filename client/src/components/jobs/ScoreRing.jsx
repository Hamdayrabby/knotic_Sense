const ScoreRing = ({ score, size = 40 }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Color based on score
    const getColor = () => {
        if (score >= 75) return { stroke: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' }; // Green
        if (score >= 50) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }; // Amber
        return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }; // Red
    };

    const colors = getColor();

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
            </svg>
            {/* Score text */}
            <span
                className="absolute text-xs font-bold"
                style={{ color: colors.stroke }}
            >
                {score}
            </span>
        </div>
    );
};

export default ScoreRing;
