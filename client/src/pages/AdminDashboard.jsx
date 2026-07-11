import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';
import AdminStats from '../components/admin/AdminStats';
import UsersTable from '../components/admin/UsersTable';
import JobsTable from '../components/admin/JobsTable';
import ActivityLogsTable from '../components/admin/ActivityLogsTable';
import EmailUserModal from '../components/admin/EmailUserModal';

const TABS = ['Overview', 'Users', 'Jobs', 'Activity'];

const AdminDashboard = () => {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [usersSuspended, setUsersSuspended] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsSearch, setJobsSearch] = useState('');
  const [jobsStatus, setJobsStatus] = useState('');
  const [jobsLoading, setJobsLoading] = useState(false);

  // Activity state
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  // UI state
  const [emailTarget, setEmailTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const searchDebounce = useRef(null);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1, search = '', role = '', suspended = '') => {
    setUsersLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: { page, limit: 15, search, role, suspended },
      });
      setUsers(data.data);
      setUsersTotal(data.pagination.total);
      setUsersPage(page);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ── Fetch jobs ─────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async (page = 1, search = '', status = '') => {
    setJobsLoading(true);
    try {
      const { data } = await api.get('/admin/jobs', {
        params: { page, limit: 15, search, status },
      });
      setJobs(data.data);
      setJobsTotal(data.pagination.total);
      setJobsPage(page);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    try {
      const { data } = await api.get('/admin/activity', {
        params: { page, limit: 20 },
      });
      setLogs(data.data);
      setLogsTotal(data.pagination.total);
      setLogsPage(page);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (tab === 'Users') fetchUsers(1, usersSearch, usersRole, usersSuspended);
  }, [fetchUsers, tab, usersRole, usersSuspended]);
  useEffect(() => {
    if (tab === 'Jobs') fetchJobs(1, jobsSearch, jobsStatus);
  }, [fetchJobs, jobsStatus, tab]);
  useEffect(() => {
    if (tab === 'Activity') fetchLogs(1);
  }, [fetchLogs, tab]);

  // ── Debounced search ───────────────────────────────────────────────────────
  const handleUserSearch = (val) => {
    setUsersSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchUsers(1, val, usersRole, usersSuspended), 350);
  };
  const handleJobSearch = (val) => {
    setJobsSearch(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => fetchJobs(1, val, jobsStatus), 350);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId + '_role');
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading('');
    }
  };

  const handleToggleSuspend = async (userId) => {
    setActionLoading(userId + '_suspend');
    try {
      const { data } = await api.patch(`/admin/users/${userId}/suspend`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isSuspended: data.data.isSuspended } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle suspension');
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(userId + '_delete');
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setUsersTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
      throw err;
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteJob = async (jobId) => {
    setActionLoading(jobId + '_delete');
    try {
      await api.delete(`/admin/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setJobsTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete job');
      throw err;
    } finally {
      setActionLoading('');
    }
  };

  const handleExport = (type) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.open(`${baseURL}/admin/export/${type}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-knotic-bg text-knotic-text p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-knotic-text">Admin dashboard</h1>
          <p className="text-knotic-muted text-sm mt-1">Knotic Sense platform management</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            if (tab === 'Users') fetchUsers(usersPage, usersSearch, usersRole, usersSuspended);
            if (tab === 'Jobs') fetchJobs(jobsPage, jobsSearch, jobsStatus);
            if (tab === 'Activity') fetchLogs(logsPage);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-knotic-card hover:bg-knotic-border border border-knotic-border rounded-xl text-sm text-knotic-muted hover:text-knotic-text transition-colors"
        >
          <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-knotic-card/50 border border-knotic-border p-1 rounded-xl w-fit mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-knotic-accent text-white shadow-sm'
                : 'text-knotic-muted hover:text-knotic-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 'Overview' && (
        <AdminStats stats={stats} statsLoading={statsLoading} />
      )}

      {tab === 'Users' && (
        <UsersTable
          users={users}
          usersTotal={usersTotal}
          usersPage={usersPage}
          usersSearch={usersSearch}
          usersRole={usersRole}
          usersSuspended={usersSuspended}
          usersLoading={usersLoading}
          actionLoading={actionLoading}
          onSearchChange={handleUserSearch}
          onRoleFilterChange={(val) => {
            setUsersRole(val);
            fetchUsers(1, usersSearch, val, usersSuspended);
          }}
          onSuspendedFilterChange={(val) => {
            setUsersSuspended(val);
            fetchUsers(1, usersSearch, usersRole, val);
          }}
          onPageChange={(p) => fetchUsers(p, usersSearch, usersRole, usersSuspended)}
          onExport={() => handleExport('users')}
          onEmailUser={setEmailTarget}
          onRoleChange={handleRoleChange}
          onToggleSuspend={handleToggleSuspend}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {tab === 'Jobs' && (
        <JobsTable
          jobs={jobs}
          jobsTotal={jobsTotal}
          jobsPage={jobsPage}
          jobsSearch={jobsSearch}
          jobsStatus={jobsStatus}
          jobsLoading={jobsLoading}
          onSearchChange={handleJobSearch}
          onStatusFilterChange={(val) => {
            setJobsStatus(val);
            fetchJobs(1, jobsSearch, val);
          }}
          onPageChange={(p) => fetchJobs(p, jobsSearch, jobsStatus)}
          onExport={() => handleExport('jobs')}
          onDeleteJob={handleDeleteJob}
        />
      )}

      {tab === 'Activity' && (
        <ActivityLogsTable
          logs={logs}
          logsTotal={logsTotal}
          logsPage={logsPage}
          logsLoading={logsLoading}
          onPageChange={fetchLogs}
        />
      )}

      {/* Email Modal */}
      {emailTarget && (
        <EmailUserModal user={emailTarget} onClose={() => setEmailTarget(null)} />
      )}
    </div>
  );
};

export default AdminDashboard;
