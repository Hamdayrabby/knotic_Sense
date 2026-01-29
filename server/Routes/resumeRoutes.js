const express = require('express');
const router = express.Router();
const upload = require('../Middleware/resumeUpload');
const { authenticate } = require('../Middleware/authMiddleware');

// @route   POST /api/resume/test-upload
// @desc    Test resume upload
// @access  Private
router.post('/test-upload', authenticate, (req, res) => {
    // Middleware handles the upload. If we reach here, file is valid.
    const singleUpload = upload.single('resume');

    singleUpload(req, res, function (err) {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File too large. Max size is 2MB.' });
            }
            if (err.code === 'LIMIT_FILE_TYPES') {
                return res.status(400).json({ success: false, message: err.message });
            }
            return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    });
});

module.exports = router;
