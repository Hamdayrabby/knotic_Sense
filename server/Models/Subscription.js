const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'teams'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'],
    default: 'active'
  },
  currentPeriodEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days out for free/trial
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  // Usage tracking reset date
  usagePeriodStart: {
    type: Date,
    default: Date.now
  },
  aiAnalysesUsedThisMonth: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Reset monthly counter if the period has rolled over
subscriptionSchema.methods.resetUsageIfNeeded = async function () {
  const now = new Date();
  // Check if current date is past current period end
  if (now > this.currentPeriodEnd) {
    this.usagePeriodStart = now;
    // Set next period end (30 days from now)
    this.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.aiAnalysesUsedThisMonth = 0;
    await this.save();
  }
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
