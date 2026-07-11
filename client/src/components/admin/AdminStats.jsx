import { createElement, useState } from 'react';
import {
  Users, Briefcase, TrendingUp, ShieldAlert,
  FileCheck, Percent, BarChart2, Building2, PieChart
} from 'lucide-react';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5 flex items-start gap-4 hover:border-knotic-border transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50">
    <div className={`p-3 rounded-xl ${color}`}>
      {createElement(icon, { size: 20, className: 'text-knotic-text' })}
    </div>
    <div>
      <p className="text-knotic-muted text-sm">{label}</p>
      <p className="text-knotic-text text-2xl font-bold mt-0.5">{value != null ? String(value) : '—'}</p>
      {sub && <p className="text-knotic-muted/80 text-xs mt-1">{sub}</p>}
    </div>
  </div>
);

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-knotic-border/50 rounded-xl ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5 flex items-start gap-4">
    <Skeleton className="w-11 h-11 rounded-xl" />
    <div className="flex-1">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5">
    <Skeleton className="h-4 w-32 mb-6" />
    <div className="flex items-end gap-2 h-36">
      {[40, 65, 80, 55, 90, 70, 45, 60].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

const BarChart = ({ data, labelKey, valueKey, color = '#6366f1', isDateLabel = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data?.length) return (
    <div className="flex items-center justify-center h-40 text-knotic-muted/80 text-sm">
      No data yet
    </div>
  );
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const W = 560, H = 140, pad = 32;
  const barW = Math.max(6, Math.min(40, Math.floor((W - pad * 2) / data.length) - 4));

  // For date labels, show only every Nth label to avoid overlap
  const labelInterval = data.length > 15 ? Math.ceil(data.length / 8) : 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 30}`}
      className="w-full"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={pad}
          y1={H - ratio * H}
          x2={W - pad}
          y2={H - ratio * H}
          className="stroke-knotic-border"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
      ))}
      {data.map((d, i) => {
        const x = pad + i * ((W - pad * 2) / data.length);
        const barH = Math.max(2, (d[valueKey] / max) * H);
        const y = H - barH;
        const isHovered = hoveredIndex === i;
        const label = isDateLabel ? String(d[labelKey]).slice(5) : String(d[labelKey]);

        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            style={{ cursor: 'pointer' }}
          >
            {/* Hover background */}
            {isHovered && (
              <rect
                x={x - 2}
                y={0}
                width={barW + 4}
                height={H}
                fill="#6366f1"
                opacity="0.08"
                rx="4"
              />
            )}
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="4"
              fill={color}
              opacity={isHovered ? 1 : 0.8}
              style={{ transition: 'opacity 0.2s' }}
            />
            {/* Value tooltip on hover */}
            {isHovered && (
              <>
                <rect
                  x={x + barW / 2 - 14}
                  y={y - 22}
                  width={28}
                  height={18}
                  rx="4"
                  className="fill-knotic-card stroke-knotic-border"
                  strokeWidth="0.5"
                />
                <text
                  x={x + barW / 2}
                  y={y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  className="fill-knotic-text"
                >
                  {d[valueKey]}
                </text>
              </>
            )}
            {/* Label */}
            {(!isDateLabel || i % labelInterval === 0) && (
              <text
                x={x + barW / 2}
                y={H + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {isDateLabel ? label : (label.length > 10 ? label.slice(0, 9) + '…' : label)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ data, labelKey, valueKey, color = '#6366f1' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data?.length) return (
    <div className="flex items-center justify-center h-40 text-knotic-muted/80 text-sm">
      No data yet
    </div>
  );
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const W = 560, H = 140, pad = 32;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = H - (d[valueKey] / max) * (H - 20) - 10;
    return [x, y];
  });

  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1][0]} ${H} L ${points[0][0]} ${H} Z`;

  const gradientId = `lg-${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 30}`}
      className="w-full"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={pad}
          y1={H - ratio * H}
          x2={W - pad}
          y2={H - ratio * H}
          className="stroke-knotic-border"
          strokeWidth="0.5"
          strokeDasharray="4 4"
        />
      ))}
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <g
          key={i}
          onMouseEnter={() => setHoveredIndex(i)}
          style={{ cursor: 'pointer' }}
        >
          {/* Larger hit area */}
          <circle cx={x} cy={y} r="10" fill="transparent" />
          <circle
            cx={x}
            cy={y}
            r={hoveredIndex === i ? 5 : 3}
            fill={color}
            style={{ transition: 'r 0.2s' }}
          />
          {/* Tooltip on hover */}
          {hoveredIndex === i && (
            <>
              <rect
                x={x - 18}
                y={y - 24}
                width={36}
                height={18}
                rx="4"
                className="fill-knotic-card stroke-knotic-border"
                strokeWidth="0.5"
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                className="fill-knotic-text"
              >
                {data[i][valueKey]}
              </text>
            </>
          )}
          <text x={x} y={H + 16} textAnchor="middle" fontSize="9" fill="#64748b">
            {String(data[i][labelKey])}
          </text>
        </g>
      ))}
    </svg>
  );
};

const TopCompanies = ({ companies = [] }) => {
  if (!companies?.length) return (
    <div className="flex items-center justify-center h-40 text-knotic-muted/80 text-sm">
      No companies yet
    </div>
  );

  const maxCount = Math.max(...companies.map(c => c.count), 1);

  return (
    <div className="space-y-3">
      {companies.map((c, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-knotic-muted/80 text-xs font-mono w-4 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-knotic-text text-sm font-medium truncate">{c.company}</span>
              <span className="text-knotic-muted text-xs font-medium ml-2">{c.count} jobs</span>
            </div>
            <div className="h-1.5 bg-knotic-border/50 rounded-full overflow-hidden">
              <div
                 className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: `${(c.count / maxCount) * 100}%`,
                   background: `linear-gradient(90deg, #6366f1, #a78bfa)`,
                 }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminStats = ({ stats, statsLoading }) => {
  if (statsLoading) {
    return (
      <div className="space-y-8">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        {/* Skeleton charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-knotic-muted/80 text-sm">Could not load stats.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total users" value={fmt(stats.totalUsers)} color="bg-indigo-500" />
        <StatCard icon={Briefcase} label="Total jobs" value={fmt(stats.totalJobs)} color="bg-purple-500" />
        <StatCard
          icon={TrendingUp}
          label="Avg ATS score"
          value={stats.avgAtsScore != null ? `${stats.avgAtsScore}%` : '—'}
          color="bg-emerald-500"
        />
        <StatCard
          icon={FileCheck}
          label="Analyzed"
          value={fmt(stats.totalAnalyzed)}
          sub={`${stats.analysisRate || 0}% of all jobs`}
          color="bg-cyan-500"
        />
        <StatCard
          icon={ShieldAlert}
          label="Suspended"
          value={fmt(stats.suspendedUsers)}
          sub={`${fmt(stats.activeUsersThisWeek)} active this week`}
          color="bg-red-500"
        />
        <StatCard
          icon={Percent}
          label="Analysis rate"
          value={`${stats.analysisRate || 0}%`}
          sub={`${fmt(stats.totalAnalyzed)} of ${fmt(stats.totalJobs)} jobs`}
          color="bg-amber-500"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs by status */}
        <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-indigo-400" />
            <h3 className="text-knotic-text font-medium text-sm">Jobs by status</h3>
          </div>
          <BarChart
            data={Object.entries(stats.jobsByStatus || {}).map(([k, v]) => ({
              status: k,
              count: v,
            }))}
            labelKey="status"
            valueKey="count"
            color="#6366f1"
            isDateLabel={false}
          />
        </div>

        {/* ATS score trend */}
        <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-emerald-400" />
            <h3 className="text-knotic-text font-medium text-sm">Avg ATS score trend (12 weeks)</h3>
          </div>
          <LineChart
            data={stats.atsTrend || []}
            labelKey="week"
            valueKey="avgScore"
            color="#10b981"
          />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Signup trend */}
        <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-400" />
            <h3 className="text-knotic-text font-medium text-sm">User signups (last 30 days)</h3>
          </div>
          <BarChart
            data={stats.signupTrend || []}
            labelKey="_id"
            valueKey="count"
            color="#a855f7"
            isDateLabel={true}
          />
        </div>

        {/* Top Companies */}
        <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-amber-400" />
            <h3 className="text-knotic-text font-medium text-sm">Top companies</h3>
          </div>
          <TopCompanies companies={stats.topCompanies} />
        </div>
      </div>

      {/* Charts row 3 — Job creation trend */}
      <div className="bg-knotic-card/60 border border-knotic-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={16} className="text-cyan-400" />
          <h3 className="text-knotic-text font-medium text-sm">Job applications (last 30 days)</h3>
        </div>
        <BarChart
          data={stats.jobTrend || []}
          labelKey="_id"
          valueKey="count"
          color="#06b6d4"
          isDateLabel={true}
        />
      </div>
    </div>
  );
};

export default AdminStats;
