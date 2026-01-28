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
    aiAnalysis: {
        matchPercentage: { type: Number },
        keywordsMatched: [String],
        suggestions: { type: String },
        score: { type: Number }
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

module.exports = mongoose.model('Job', jobSchema);
