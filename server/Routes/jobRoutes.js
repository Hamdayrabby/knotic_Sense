const express = require('express');
const router = express.Router();
const { getJobs, createJob, deleteJob, updateJobStatus, analyzeJob } = require('../Controllers/JobController');
const { authenticate } = require('../Middleware/authMiddleware');

// All routes are protected
router.use(authenticate);

router.route('/')
    .get(getJobs)
    .post(createJob);

router.route('/:id')
    .delete(deleteJob);

router.route('/:id/status')
    .patch(updateJobStatus);

router.route('/:id/analyze')
    .post(analyzeJob);

module.exports = router;
