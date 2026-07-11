const Job = require('../Models/Job');
const mongoose = require('mongoose');

// @desc    Get all jobs for logged in user
// @route   GET /api/jobs
// @access  Private
const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user.id }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get a single job for logged in user
// @route   GET /api/jobs/:id
// @access  Private
const getJob = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const job = await Job.findOne({ _id: req.params.id, user: req.user.id });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.status(200).json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private
const createJob = async (req, res) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        // Check for required fields
        const { company, position, description } = req.body;
        if (!company || !position || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide company, position, and description'
            });
        }

        const job = await Job.create(req.body);

        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('Error creating job:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: messages
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user owns the job
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        await job.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting job:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update job status
// @route   PATCH /api/jobs/:id/status
// @access  Private
const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // Validate status
        const allowedStatuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Please provide a valid status. Allowed values: ${allowedStatuses.join(', ')}`
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check ownership
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        // Construct update object
        const update = {
            $set: { status: status },
            $push: {
                statusHistory: {
                    status: status,
                    changedAt: Date.now()
                }
            }
        };

        // If status is 'Applied', set appliedDate
        if (status === 'Applied') {
            update.$set.appliedDate = Date.now();
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedJob
        });

    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// @desc    Analyze job match with resume
// @route   POST /api/jobs/:id/analyze
// @access  Private
const analyzeJob = async (req, res) => {
    try {
        const { generateContentHash } = require('../Utils/contentHash');
        const User = require('../Models/User');

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check ownership
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to analyze this job'
            });
        }

        // Check for job description
        if (!job.jobDescription) {
            return res.status(400).json({
                success: false,
                message: 'Job description is required for analysis. Update the job with a jobDescription first.'
            });
        }

        let resumeToAnalyze;
        let resumeHash;
        let newResumeId = null;
        let updatedHistory = null;

        // Check if file was uploaded
        if (req.file) {
            const { extractTextFromPDF } = require('../Utils/pdfParser');
            const { normalizeResume } = require('../Utils/resumeParser');

            // 1. Extract Text
            const rawText = await extractTextFromPDF(req.file.buffer);
            if (!rawText || rawText.length < 50) {
                return res.status(400).json({ success: false, message: 'Failed to extract text from PDF.' });
            }

            // 2. Normalize Text
            resumeToAnalyze = await normalizeResume(rawText);

            // 3. Generate Base ATS Score
            const { scoreResume } = require('../Utils/resumeScorer');
            const baseAnalysis = await scoreResume(resumeToAnalyze);
            resumeToAnalyze._analysis = baseAnalysis;

            resumeHash = generateContentHash(resumeToAnalyze); // Hash the NEW uploaded resume

            // 3. Save the new CV to the user's history
            const userDoc = await User.findById(req.user.id);
            if (userDoc) {
                userDoc.resumes = userDoc.resumes || [];
                userDoc.resumes.push({
                    fileName: req.file.originalname,
                    text: rawText,
                    structured: resumeToAnalyze,
                    uploadedAt: new Date()
                });
                await userDoc.save();
                updatedHistory = userDoc.resumes;
                newResumeId = userDoc.resumes[userDoc.resumes.length - 1]._id;
            }
        } else if (req.body.resumeId && req.body.resumeId !== 'legacy-resume') {
            // Select from history
            const user = await User.findById(req.user.id);
            const specificResume = user?.resumes?.find(r => r._id.toString() === req.body.resumeId);
            if (!specificResume) {
                return res.status(404).json({ success: false, message: 'Selected resume not found in history.' });
            }
            resumeToAnalyze = specificResume.structured;
            resumeHash = generateContentHash(resumeToAnalyze);
        } else {
            // Fallback to Profile Resume (Legacy or specific user default)
            const user = await User.findById(req.user.id);
            if (!user.resumeStructured) {
                return res.status(400).json({
                    success: false,
                    message: 'No resume found. Please upload a resume or add one to your profile.'
                });
            }
            resumeToAnalyze = user.resumeStructured;
            resumeHash = generateContentHash(resumeToAnalyze);
        }

        // Generate JD Hash
        const currentJdHash = generateContentHash(job.jobDescription);

        // Force refresh if file was explicitly uploaded or requested by client
        const forceRefresh = !!req.file || req.body.forceRefresh === true;

        // Cache check - look in the analysisHistory array
        if (!forceRefresh && job.analysisHistory && job.analysisHistory.length > 0) {
            const cachedEntry = job.analysisHistory.find(
                entry => entry.jdHash === currentJdHash && entry.resumeHash === resumeHash
            );

            if (cachedEntry) {
                // Update the current primary aiAnalysis pointer to this cached match
                job.aiAnalysis = cachedEntry.data;
                await job.save();

                return res.status(200).json({
                    success: true,
                    cached: true,
                    message: 'Using cached analysis from history',
                    data: cachedEntry.data,
                    history: updatedHistory,
                    newResumeId: newResumeId
                });
            }
        }

        // --- PORTFOLIO-GRADE DETERMINISTIC ATS LIFECYCLE ---

        // 1. Parse Job Description (Cache it if not already parsed)
        if (!job.jdStructured) {
            const { parseJD } = require('../Utils/jdParser');
            job.jdStructured = await parseJD(job.jobDescription);
        }

        // 2. Deterministic Scoring Engine (No LLM Math)
        const { calculateDeterministicScore } = require('../Utils/scoringEngine');
        const scoreMetrics = calculateDeterministicScore(resumeToAnalyze, job.jdStructured);

        // 3. AI Advisory Layer (Qualitative Feedback Only)
        const { generateMatchFeedback } = require('../Utils/jobMatcher');
        const analysis = await generateMatchFeedback(resumeToAnalyze, job.jobDescription, scoreMetrics);

        // Save analysis to job
        const newAnalysisObj = {
            ...analysis,
            analyzedAt: new Date(),
            jdHash: currentJdHash,
            resumeHash: resumeHash
        };
        job.aiAnalysis = newAnalysisObj;

        if (!job.analysisHistory) job.analysisHistory = [];
        // Remove old entry with same hashes to prevent duplicates
        job.analysisHistory = job.analysisHistory.filter(h => h.resumeHash !== resumeHash || h.jdHash !== currentJdHash);
        job.analysisHistory.push({
            resumeHash,
            jdHash: currentJdHash,
            data: newAnalysisObj
        });

        await job.save();

        // Increment subscription counter for new (non-cached) analysis calls
        if (req.subscription) {
            req.subscription.aiAnalysesUsedThisMonth += 1;
            await req.subscription.save();
        }

        res.status(200).json({
            success: true,
            cached: false,
            data: job.aiAnalysis,
            history: updatedHistory,
            newResumeId: newResumeId
        });

    } catch (error) {
        console.error('Error analyzing job:', error);
        if (error.message.startsWith('MATCHER_')) {
            return res.status(500).json({
                success: false,
                message: 'Failed to analyze job match. Please try again.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update job details
// @route   PUT /api/jobs/:id
// @access  Private
const updateJob = async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check ownership
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        // Fields to update
        const {
            company,
            position,
            description,
            location,
            salary,
            appliedDate,
            nextActionDate,
            nextActionNote,
            jobDescription,
            notes
        } = req.body;

        // Build update object
        const updateFields = {};
        if (company) updateFields.company = company;
        if (position) updateFields.position = position;
        if (description) updateFields.description = description;
        if (location) updateFields.location = location;
        if (salary) updateFields.salary = salary;
        if (appliedDate) updateFields.appliedDate = appliedDate;
        if (nextActionDate !== undefined) updateFields.nextActionDate = nextActionDate || null;
        if (nextActionNote !== undefined) updateFields.nextActionNote = nextActionNote;
        if (jobDescription) updateFields.jobDescription = jobDescription;
        if (notes !== undefined) updateFields.notes = notes; // Allow empty string

        job = await Job.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: job
        });

    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Export user's jobs to CSV
// @route   GET /api/jobs/export
// @access  Private
const exportMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user.id })
            .select('company position status aiAnalysis.score nextActionDate nextActionNote createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const headers = ['Company', 'Position', 'Status', 'ATS Score', 'Next Action Date', 'Next Action Note', 'Created'];
        
        const escape = (v) => {
            if (v == null) return '';
            const s = String(v).replace(/"/g, '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
        };

        const rows = jobs.map(j => [
            j.company,
            j.position,
            j.status,
            j.aiAnalysis?.score ?? '',
            j.nextActionDate ? new Date(j.nextActionDate).toISOString().slice(0, 10) : '',
            j.nextActionNote || '',
            new Date(j.createdAt).toISOString().slice(0, 10)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="my_job_applications.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting jobs:', error);
        res.status(500).json({ success: false, message: 'Failed to export jobs' });
    }
};

module.exports = {
    getJobs,
    getJob,
    createJob,
    deleteJob,
    updateJobStatus,
    updateJob,
    analyzeJob,
    exportMyJobs
};
