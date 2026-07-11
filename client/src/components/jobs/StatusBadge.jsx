import statusConfig from './statusConfig';

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.Interested;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {status}
        </span>
    );
};

export default StatusBadge;
