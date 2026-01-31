const express = require('express');
const router = express.Router();
const upload = require('../Middleware/resumeUpload');
const { extractTextFromPDF } = require('../Utils/pdfParser');
const { normalizeResume } = require('../Utils/resumeParser');
const { authenticate } = require('../Middleware/authMiddleware');
const User = require('../Models/users');

// @route   POST /api/resume/test-upload
// @desc    Upload and parse resume, save to user profile
// @access  Private
router.post('/test-upload', authenticate, (req, res) => {
    // Middleware handles the upload. If we reach here, file is valid.
    const singleUpload = upload.single('resume');

    singleUpload(req, res, async function (err) {
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

        try {
            // Step 1: Extract raw text from PDF
            const extractedText = await extractTextFromPDF(req.file.buffer);

            // Step 2: Normalize text into structured JSON using Gemini
            const structuredData = await normalizeResume(extractedText);

            // Step 3: Save to user profile
            await User.findByIdAndUpdate(req.user.id, {
                resumeStructured: structuredData
            });

            res.status(200).json({
                success: true,
                message: 'Resume uploaded and saved to profile',
                data: {
                    filename: req.file.originalname,
                    text: extractedText,
                    structured: structuredData
                }
            });
        } catch (parseError) {
            if (parseError.message === 'SCANNED_PDF') {
                return res.status(400).json({
                    success: false,
                    message: 'Scanned PDFs not supported. Please upload a text-based PDF.'
                });
            }
            if (parseError.message.startsWith('LLM_')) {
                console.error('LLM Error:', parseError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to structure resume data. Please try again.'
                });
            }
            if (parseError.message === 'GEMINI_API_KEY is not configured') {
                console.error('Config Error:', parseError);
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error. Contact administrator.'
                });
            }
            console.error('PDF Parse Error:', parseError);
            res.status(500).json({
                success: false,
                message: 'Failed to process PDF content'
            });
        }
    });
});

// @route   POST /api/resume/score
// @desc    Get ATS score and career insights for your resume
// @access  Private
router.post('/score', authenticate, async (req, res) => {
    try {
        const { scoreResume } = require('../Utils/resumeScorer');

        // Get user's resume from profile
        const user = await User.findById(req.user.id);

        if (!user.resumeStructured) {
            return res.status(400).json({
                success: false,
                message: 'No resume found. Please upload your resume first at POST /api/resume/test-upload'
            });
        }

        // Score the resume
        const scoreResult = await scoreResume(user.resumeStructured);

        res.status(200).json({
            success: true,
            data: scoreResult
        });
    } catch (error) {
        console.error('Resume Score Error:', error);
        if (error.message.startsWith('SCORER_')) {
            return res.status(500).json({
                success: false,
                message: 'Failed to score resume. Please try again.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
});

module.exports = router;
