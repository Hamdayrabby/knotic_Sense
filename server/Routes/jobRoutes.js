const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getJobs, getJob, createJob, deleteJob, updateJobStatus, updateJob, analyzeJob, exportMyJobs } = require('../Controllers/JobController');
const { authenticate } = require('../Middleware/authMiddleware');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// All routes are protected
router.use(authenticate);

const aiLimiter = (req, res, next) => req.app.get('aiLimiter')(req, res, next);

router.route('/')
    .get(getJobs)
    .post(createJob);

router.route('/export')
    .get(exportMyJobs);

router.route('/:id')
    .get(getJob)
    .put(updateJob)
    .delete(deleteJob);

router.route('/:id/status')
    .patch(updateJobStatus);

const { checkAiQuota } = require('../Middleware/quotaMiddleware');

// Analyze route with file upload and quota verification middleware
router.route('/:id/analyze')
    .post(aiLimiter, checkAiQuota, upload.single('resume'), analyzeJob);

// Multer error handling
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload Error: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

module.exports = router;
