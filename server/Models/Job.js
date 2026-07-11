const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'Please add a company name'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Please add a job title/position'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a job description']
    },
    location: {
        type: String,
        enum: ['Remote', 'On-site', 'Hybrid'],
        default: 'On-site'
    },
    salary: {
        min: { type: Number },
        max: { type: Number },
        currency: { type: String, default: 'USD' }
    },
    status: {
        type: String,
        enum: ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
        default: 'Interested'
    },
    statusHistory: [
        {
            status: {
                type: String,
                enum: ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'],
                required: true
            },
            changedAt: {
                type: Date,
                default: Date.now
            },
            note: {
                type: String
            }
        }
    ],
    appliedDate: {
        type: Date
    },
    nextActionDate: {
        type: Date,
        default: null
    },
    nextActionNote: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    jobDescription: {
        type: String,
        default: null
    },
    jdStructured: {
        type: Object,
        default: null
    },
    aiAnalysis: {
        score: { type: Number },
        starRating: { type: Number },
        visibility: {
            zone: { type: String },
            description: { type: String }
        },
        scoreBreakdown: { type: Object },
        matchedKeywords: [{ keyword: String, proofQuote: String }],
        missingKeywords: [String],
        roboticFlag: { type: Boolean, default: false },
        roboticAdvice: { type: String },
        phrasingSuggestions: [{ current: String, suggested: String, reason: String }],
        strengths: [String],
        improvements: [String],
        reasoning: { type: String },
        analyzedAt: { type: Date },
        jdHash: { type: String },      // Hash of jobDescription when analyzed
        resumeHash: { type: String }   // Hash of user's resume when analyzed
    },
    analysisHistory: {
        type: Array, // Array of { resumeHash, jdHash, data }
        default: []
    },
    resumeStructured: {
        type: Object,
        default: null
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Middleware to handle status history updates
jobSchema.pre('save', async function () {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            changedAt: Date.now()
        });
    }
});

// ── Indexes for query performance ──
jobSchema.index({ user: 1, updatedAt: -1 }); // Dashboard: list jobs sorted by recent
jobSchema.index({ user: 1, status: 1 });      // Filter jobs by status

module.exports = mongoose.model('Job', jobSchema);
