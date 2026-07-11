const User = require('../Models/User');
const Job = require('../Models/Job');
const ActivityLog = require('../Models/ActivityLog');
const { sendMail } = require('../Utils/mailer');

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const now = Date.now();
        const TWELVE_WEEKS = 12 * 7 * 24 * 60 * 60 * 1000;
        const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
        
        // Trigger nodemon restart

        // Run all aggregation queries in parallel for performance
        const [
            totalUsers,
            suspendedUsers,
            totalJobs,
            jobsByStatus,
            avgScoreResult,
            recentSignups,
            recentJobs,
            atsTrendRaw,
            topCompanies
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isSuspended: true }),
            Job.countDocuments(),
            Job.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Job.aggregate([
                { $match: { 'aiAnalysis.score': { $exists: true, $ne: null, $type: 'number' } } },
                { $group: { _id: null, avgScore: { $avg: '$aiAnalysis.score' }, totalAnalyzed: { $sum: 1 } } }
            ]),
            // User signups per day for the last 90 days
            User.aggregate([
                { $match: { createdAt: { $gte: new Date(now - NINETY_DAYS) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Jobs created per day for the last 90 days
            Job.aggregate([
                { $match: { createdAt: { $gte: new Date(now - NINETY_DAYS) } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Weekly ATS score trend for the last 12 weeks
            Job.aggregate([
                {
                    $match: {
                        'aiAnalysis.score': { $exists: true, $ne: null, $type: 'number' },
                        'aiAnalysis.analyzedAt': { $gte: new Date(now - TWELVE_WEEKS) }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%U',  // year-week
                                date: { $ifNull: ['$aiAnalysis.analyzedAt', '$updatedAt'] }
                            }
                        },
                        avgScore: { $avg: '$aiAnalysis.score' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Top 5 companies by job count
            Job.aggregate([
                { $group: { _id: '$company', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Transform jobsByStatus array into a clean object
        const statusMap = {};
        const statusOrder = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
        statusOrder.forEach(s => { statusMap[s] = 0; });
        jobsByStatus.forEach(item => {
            statusMap[item._id] = item.count;
        });

        // Count users who were active in the last 7 days (have jobs updated recently)
        const activeThisWeekArr = await Job.distinct('user', {
            updatedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }
        });

        // Fill gaps in signup trend (last 30 days only for display)
        const fillDailyGaps = (rawData, days) => {
            const map = {};
            rawData.forEach(d => { map[d._id] = d.count; });
            const result = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now - i * 24 * 60 * 60 * 1000);
                const key = date.toISOString().slice(0, 10);
                result.push({ _id: key, count: map[key] || 0 });
            }
            return result;
        };

        // Fill gaps in ATS trend (ensure exactly 12 weeks are returned)
        const getYearWeek = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-${weekNo.toString().padStart(2, '0')}`;
        };

        const last12Weeks = [];
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        for (let i = 11; i >= 0; i--) {
            last12Weeks.push(getYearWeek(new Date(now - i * ONE_WEEK)));
        }

        const atsTrend = last12Weeks.map((weekKey, index) => {
            const match = atsTrendRaw.find(r => r._id === weekKey);
            return {
                week: `Wk ${index + 1}`,
                avgScore: match ? Math.round(match.avgScore) : 0,
                count: match ? match.count : 0
            };
        });

        // Compute analysis rate
        const totalAnalyzed = avgScoreResult[0]?.totalAnalyzed || 0;
        const analysisRate = totalJobs > 0 ? Math.round((totalAnalyzed / totalJobs) * 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalJobs,
                suspendedUsers,
                totalAnalyzed,
                // Return null when no analyzed jobs exist so frontend can show "—"
                avgAtsScore: avgScoreResult[0]?.avgScore != null
                    ? Math.round(avgScoreResult[0].avgScore)
                    : null,
                analysisRate,
                activeUsersThisWeek: activeThisWeekArr.length,
                jobsByStatus: statusMap,
                signupTrend: fillDailyGaps(recentSignups, 30),
                jobTrend: fillDailyGaps(recentJobs, 30),
                atsTrend,
                topCompanies: topCompanies.map(c => ({
                    company: c._id,
                    count: c.count
                }))
            }
        });
    } catch (error) {
        console.error('Admin getStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all users with their job counts
// @route   GET /api/admin/users?page=1&limit=20&search=term
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search filter
        const filter = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('name email role isSuspended profilePicture resumes createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        // Attach job count per user (batch query)
        const userIds = users.map(u => u._id);
        const jobCounts = await Job.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        const jobCountMap = {};
        jobCounts.forEach(j => { jobCountMap[j._id.toString()] = j.count; });

        const enrichedUsers = users.map(u => ({
            ...u,
            resumeCount: u.resumes?.length || 0,
            jobCount: jobCountMap[u._id.toString()] || 0,
            resumes: undefined // Don't send full resume data
        }));

        res.status(200).json({
            success: true,
            data: enrichedUsers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin getUsers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete a user and all their jobs
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-deletion
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own admin account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Cascade delete: remove all jobs belonging to this user
        const deletedJobs = await Job.deleteMany({ user: userId });

        // Delete the user
        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: `User "${user.name}" and ${deletedJobs.deletedCount} associated jobs deleted`
        });
    } catch (error) {
        console.error('Admin deleteUser error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all jobs across all users
// @route   GET /api/admin/jobs?page=1&limit=20&search=term&status=Applied
// @access  Private/Admin
const getJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { company: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }
        if (statusFilter) {
            filter.status = statusFilter;
        }

        const [jobs, total] = await Promise.all([
            Job.find(filter)
                .populate('user', 'name email')
                .select('company position status location aiAnalysis.score createdAt updatedAt')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Job.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: jobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin getJobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete any job (admin override)
// @route   DELETE /api/admin/jobs/:id
// @access  Private/Admin
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: `Job "${job.position} at ${job.company}" deleted`
        });
    } catch (error) {
        console.error('Admin deleteJob error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Toggle user suspension
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
const toggleSuspend = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent self-suspension
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot suspend your own account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();

        res.status(200).json({
            success: true,
            message: user.isSuspended ? `User "${user.name}" suspended` : `User "${user.name}" unsuspended`,
            data: { _id: user._id, isSuspended: user.isSuspended }
        });
    } catch (error) {
        console.error('Admin toggleSuspend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user suspension',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update user role (promote/demote)
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "user" or "admin".'
            });
        }

        // Prevent self-demotion
        if (userId === req.user.id && role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: 'name email role isSuspended' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `User "${user.name}" role updated to ${role}`,
            data: user
        });
    } catch (error) {
        console.error('Admin updateUserRole error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ─── CSV Export Helpers ─────────────────────────────────────────────────────

const toCSV = (headers, rows) => {
    const escape = (v) => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
};

// @desc    Export all users as CSV
// @route   GET /api/admin/export/users
// @access  Private/Admin
const exportUsers = async (req, res) => {
    try {
        const users = await User.find().select('name email role isSuspended resumes createdAt').lean();

        const userIds = users.map(u => u._id);
        const jobCounts = await Job.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: '$user', count: { $sum: 1 } } }
        ]);
        const jobCountMap = {};
        jobCounts.forEach(j => { jobCountMap[j._id.toString()] = j.count; });

        const headers = ['Name', 'Email', 'Role', 'Suspended', 'Resumes', 'Jobs', 'Joined'];
        const rows = users.map(u => [
            u.name,
            u.email,
            u.role,
            u.isSuspended ? 'Yes' : 'No',
            u.resumes?.length || 0,
            jobCountMap[u._id.toString()] || 0,
            new Date(u.createdAt).toISOString().slice(0, 10)
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="knotic_users.csv"');
        res.send(toCSV(headers, rows));
    } catch (error) {
        console.error('Admin exportUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to export users' });
    }
};

// @desc    Export all jobs as CSV
// @route   GET /api/admin/export/jobs
// @access  Private/Admin
const exportJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .populate('user', 'email')
            .select('company position status aiAnalysis.score createdAt user')
            .lean();

        const headers = ['User Email', 'Company', 'Position', 'Status', 'ATS Score', 'Created'];
        const rows = jobs.map(j => [
            j.user?.email || '',
            j.company,
            j.position,
            j.status,
            j.aiAnalysis?.score ?? '',
            new Date(j.createdAt).toISOString().slice(0, 10)
        ]);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="knotic_jobs.csv"');
        res.send(toCSV(headers, rows));
    } catch (error) {
        console.error('Admin exportJobs error:', error);
        res.status(500).json({ success: false, message: 'Failed to export jobs' });
    }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivityLog = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { userId, action } = req.query;

        const filter = {};
        if (userId) filter.user = userId;
        if (action) filter.action = action;

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('user', 'email name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin getActivityLog error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity log' });
    }
};

// @desc    Email a user
// @route   POST /api/admin/users/:id/email
// @access  Private/Admin
const emailUser = async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: 'Subject and message are required.' });
        }
        const user = await User.findById(req.params.id).select('email name');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await sendMail({
            to: user.email,
            subject: subject.trim(),
            text: message.trim(),
            html: `<p>${message.trim().replace(/\n/g, '<br/>')}</p>`
        });

        res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
    } catch (error) {
        console.error('Admin emailUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
};

module.exports = {
    getStats,
    getUsers,
    deleteUser,
    getJobs,
    deleteJob,
    toggleSuspend,
    updateUserRole,
    exportUsers,
    exportJobs,
    getActivityLog,
    emailUser
};
