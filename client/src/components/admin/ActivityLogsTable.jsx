import {
  LogIn, Shield, Briefcase, Trash2, TrendingUp, Activity,
  Clock, ChevronLeft, ChevronRight
} from 'lucide-react';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ACTION_ICONS = {
  login: LogIn,
  register: Shield,
  job_created: Briefcase,
  job_updated: Briefcase,
  job_deleted: Trash2,
  resume_uploaded: TrendingUp,
  resume_analyzed: TrendingUp,
  default: Activity,
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-knotic-border/50 rounded-xl ${className}`} />
);

const Pagination = ({ page, total, limit, onPage }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-knotic-muted">
      <span>
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {fmt(total)}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded-lg hover:bg-knotic-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1 bg-knotic-border rounded-lg text-knotic-text">
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded-lg hover:bg-knotic-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const ActivityLogsTable = ({
  logs,
  logsTotal,
  logsPage,
  logsLoading,
  onPageChange,
}) => {
  return (
    <div>
      <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-knotic-border text-knotic-muted">
              <th className="text-left px-5 py-3 font-medium">Action</th>
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Target</th>
              <th className="text-left px-5 py-3 font-medium">IP</th>
              <th className="text-left px-5 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-knotic-border/50">
                  <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-knotic-muted/80">No activity logged yet</td>
              </tr>
            ) : (
              logs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                return (
                  <tr key={log._id} className="border-b border-knotic-border/50 hover:bg-knotic-border/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-indigo-400 shrink-0" />
                        <span className="text-knotic-text">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-knotic-muted text-xs">{log.userEmail}</td>
                    <td className="px-5 py-3 text-knotic-muted text-xs">{log.target || '—'}</td>
                    <td className="px-5 py-3 text-knotic-muted/80 text-xs">{log.ip || '—'}</td>
                    <td className="px-5 py-3 text-knotic-muted/80 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {fmtDateTime(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={logsPage} total={logsTotal} limit={20} onPage={onPageChange} />
    </div>
  );
};

export default ActivityLogsTable;
