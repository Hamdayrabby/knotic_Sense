const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getJobs, createJob, deleteJob, updateJobStatus, updateJob, analyzeJob } = require('../Controllers/JobController');
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

router.route('/')
    .get(getJobs)
    .post(createJob);

router.route('/:id')
    .put(updateJob)
    .delete(deleteJob);

router.route('/:id/status')
    .patch(updateJobStatus);

// Analyze route with file upload middleware
router.route('/:id/analyze')
    .post(upload.single('resume'), analyzeJob);

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
