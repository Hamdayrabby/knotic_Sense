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
            // Check for duplicate filename before expensive PDF parsing
            const user = await User.findById(req.user.id);
            if (user && user.resumes && user.resumes.some(r => r.fileName === req.file.originalname)) {
                return res.status(409).json({
                    success: false,
                    message: `Resume '${req.file.originalname}' has already been uploaded.`
                });
            }

            // Step 1: Extract raw text from PDF
            const extractedText = await extractTextFromPDF(req.file.buffer);

            // Step 2: Normalize text into structured JSON using Gemini
            const structuredData = await normalizeResume(extractedText);

            // Step 3: Save to user profile (push to history array AND update current)
            const newResume = {
                fileName: req.file.originalname,
                text: extractedText,
                structured: structuredData,
                uploadedAt: new Date()
            };

            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                {
                    $set: { resumeStructured: structuredData }, // Keep legacy field updated
                    $push: { resumes: newResume }
                },
                { new: true } // Return updated doc
            );

            res.status(200).json({
                success: true,
                message: 'Resume uploaded and saved to profile',
                data: {
                    filename: req.file.originalname,
                    text: extractedText,
                    structured: structuredData,
                    history: updatedUser.resumes // Send back full history
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

// @route   DELETE /api/resume/:resumeId
// @desc    Delete a resume from history
// @access  Private
router.delete('/:resumeId', authenticate, async (req, res) => {
    try {
        let updateQuery = { $pull: { resumes: { _id: req.params.resumeId } } };

        // Backward compatibility: If deleting the legacy resume, just clear the main field
        if (req.params.resumeId === 'legacy-resume') {
            updateQuery = { $set: { resumeStructured: null } };
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateQuery,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Resume deleted',
            data: user.resumes
        });
    } catch (error) {
        console.error('Delete Resume Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/resume/score
// @desc    Get ATS score and career insights for your resume
// @access  Private
router.post('/score', authenticate, async (req, res) => {
    try {
        const { scoreResume } = require('../Utils/resumeScorer');
        const { resumeId } = req.body; // Optional: specify which resume to score

        // Get user's resume from profile
        const user = await User.findById(req.user.id);

        let targetResumeData = user.resumeStructured;
        let isLegacy = true;

        if (resumeId && resumeId !== 'legacy-resume') {
            const specificResume = user.resumes.find(r => r._id.toString() === resumeId);
            if (specificResume) {
                targetResumeData = specificResume.structured;
                isLegacy = false;
            } else {
                return res.status(404).json({ success: false, message: 'Resume not found in history.' });
            }
        }

        if (!targetResumeData) {
            return res.status(400).json({
                success: false,
                message: 'No resume found. Please upload your resume first at POST /api/resume/test-upload'
            });
        }

        // Score the resume
        const scoreResult = await scoreResume(targetResumeData);

        // Save the score back to the database for persistence
        if (isLegacy) {
            // Update the legacy structure
            targetResumeData._analysis = scoreResult;
            await User.findByIdAndUpdate(req.user.id, { $set: { resumeStructured: targetResumeData } });
        } else {
            // Update the specific resume in the array
            await User.findOneAndUpdate(
                { _id: req.user.id, "resumes._id": resumeId },
                { $set: { "resumes.$.structured._analysis": scoreResult } }
            );
        }

        // Return the fresh score and the fully updated history list so the frontend can sync
        const updatedUser = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: scoreResult,
            history: updatedUser.resumes,
            resumeStructured: updatedUser.resumeStructured
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
