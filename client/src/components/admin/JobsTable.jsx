import { useState } from 'react';
import { Search, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const STATUS_COLORS = {
  Interested: 'bg-blue-500/20 text-blue-300',
  Applied: 'bg-indigo-500/20 text-indigo-300',
  Interviewing: 'bg-amber-500/20 text-amber-300',
  Offer: 'bg-emerald-500/20 text-emerald-300',
  Rejected: 'bg-red-500/20 text-red-300',
  // lowercase fallbacks
  applied: 'bg-indigo-500/20 text-indigo-300',
  interview: 'bg-amber-500/20 text-amber-300',
  offer: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-red-500/20 text-red-300',
  saved: 'bg-slate-500/20 text-knotic-text/90',
};

const Badge = ({ children, className }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
    {children}
  </span>
);

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

const JobsTable = ({
  jobs,
  jobsTotal,
  jobsPage,
  jobsSearch,
  jobsStatus,
  jobsLoading,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onExport,
  onDeleteJob,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, label }
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await onDeleteJob(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-knotic-muted" />
          <input
            value={jobsSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company or position…"
            className="pl-9 pr-4 py-2 bg-knotic-card border border-knotic-border rounded-xl text-sm text-knotic-text placeholder-knotic-muted/50 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
        <select
          value={jobsStatus}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 bg-knotic-card border border-knotic-border rounded-xl text-sm text-knotic-text focus:outline-none"
        >
          <option value="">All statuses</option>
          {['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={onExport}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-knotic-card hover:bg-knotic-border border border-knotic-border rounded-xl text-sm text-knotic-text/90 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-knotic-border text-knotic-muted">
              <th className="text-left px-5 py-3 font-medium">Position</th>
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-left px-5 py-3 font-medium">ATS score</th>
              <th className="text-left px-5 py-3 font-medium">Created</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-knotic-border/50">
                  <td className="px-5 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-8 ml-auto" /></td>
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-knotic-muted/80">No jobs found</td>
              </tr>
            ) : (
              jobs.map((j) => {
                const atsScore = j.aiAnalysis?.score;
                return (
                  <tr key={j._id} className="border-b border-knotic-border/50 hover:bg-knotic-border/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-knotic-text font-medium">{j.position}</p>
                      <p className="text-knotic-muted text-xs">{j.company}</p>
                    </td>
                    <td className="px-5 py-3 text-knotic-muted text-xs">
                      {j.user?.email || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge className={STATUS_COLORS[j.status] || 'bg-slate-500/20 text-knotic-text/90'}>
                        {j.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {atsScore != null ? (
                        <span className={`font-medium ${atsScore >= 70 ? 'text-emerald-400' : atsScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {atsScore}%
                        </span>
                      ) : (
                        <span className="text-knotic-muted/80">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-knotic-muted text-xs">{fmtDate(j.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setConfirmDelete({ id: j._id, label: `${j.position} @ ${j.company}` })}
                        className="p-1.5 rounded-lg text-knotic-muted hover:text-red-400 hover:bg-knotic-border transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={jobsPage} total={jobsTotal} limit={15} onPage={onPageChange} />

      {/* Deletion Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-knotic-bg border border-knotic-border rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-knotic-text font-semibold text-lg mb-2">Confirm delete</h3>
            <p className="text-knotic-muted text-sm mb-6">
              Permanently delete job <span className="text-knotic-text font-medium">{confirmDelete.label}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-knotic-border hover:bg-slate-600 text-knotic-text text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-knotic-text text-sm rounded-xl transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsTable;
