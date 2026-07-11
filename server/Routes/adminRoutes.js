const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../Middleware/authMiddleware');
const {
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
} = require('../Controllers/AdminController');

// All routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
// @access  Private/Admin
router.get('/stats', getStats);

// @route   GET /api/admin/users
// @desc    Get all users (paginated, searchable)
// @access  Private/Admin
router.get('/users', getUsers);

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role (promote/demote)
// @access  Private/Admin
router.patch('/users/:id/role', updateUserRole);

// @route   PATCH /api/admin/users/:id/suspend
// @desc    Toggle user suspension
// @access  Private/Admin
router.patch('/users/:id/suspend', toggleSuspend);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their jobs
// @access  Private/Admin
router.delete('/users/:id', deleteUser);

// @route   GET /api/admin/jobs
// @desc    Get all jobs across all users (paginated, searchable)
// @access  Private/Admin
router.get('/jobs', getJobs);

// @route   DELETE /api/admin/jobs/:id
// @desc    Delete any job
// @access  Private/Admin
router.delete('/jobs/:id', deleteJob);

// @route   GET /api/admin/export/users
// @desc    Export all users as CSV
// @access  Private/Admin
router.get('/export/users', exportUsers);

// @route   GET /api/admin/export/jobs
// @desc    Export all jobs as CSV
// @access  Private/Admin
router.get('/export/jobs', exportJobs);

// @route   GET /api/admin/activity
// @desc    Get activity logs
// @access  Private/Admin
router.get('/activity', getActivityLog);

// @route   POST /api/admin/users/:id/email
// @desc    Email a user
// @access  Private/Admin
router.post('/users/:id/email', emailUser);

module.exports = router;
