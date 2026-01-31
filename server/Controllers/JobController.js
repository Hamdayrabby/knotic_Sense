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
        const { matchResumeToJob } = require('../Utils/jobMatcher');
        const User = require('../Models/users');

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

        // Get user's resume from profile
        const user = await User.findById(req.user.id);
        if (!user.resumeStructured) {
            return res.status(400).json({
                success: false,
                message: 'No resume found. Please upload your resume first at POST /api/resume/test-upload'
            });
        }

        // Cache check: Skip if already analyzed and JD unchanged
        if (job.aiAnalysis && job.aiAnalysis.analyzedAt) {
            return res.status(200).json({
                success: true,
                cached: true,
                message: 'Using cached analysis',
                data: job.aiAnalysis
            });
        }

        // Call Gemini for analysis (use user's resume)
        const analysis = await matchResumeToJob(user.resumeStructured, job.jobDescription);

        // Save analysis to job
        job.aiAnalysis = {
            ...analysis,
            analyzedAt: new Date()
        };
        await job.save();

        res.status(200).json({
            success: true,
            cached: false,
            data: job.aiAnalysis
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

module.exports = {
    getJobs,
    createJob,
    deleteJob,
    updateJobStatus,
    analyzeJob
};
