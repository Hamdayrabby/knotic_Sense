const cron = require('node-cron');
const Job = require('../Models/Job');
const User = require('../Models/User');
const { sendMail } = require('./mailer');

/**
 * Check for pending follow-ups and notify users
 */
const checkDailyFollowUps = async () => {
  console.log('[Scheduler] Running daily follow-up checks...');
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Scheduler] Daily check skipped: SMTP credentials not configured.');
    return;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find active jobs with nextActionDate scheduled for today
    const jobsDue = await Job.find({
      nextActionDate: { $gte: today, $lt: tomorrow },
      status: { $nin: ['Offer', 'Rejected'] }
    }).populate('user');

    console.log(`[Scheduler] Found ${jobsDue.length} follow-up reminders to send.`);

    for (const job of jobsDue) {
      if (!job.user || !job.user.email) continue;

      try {
        await sendMail({
          to: job.user.email,
          subject: `🔔 Follow-up Reminder: ${job.company} — ${job.position}`,
          text: `Hi ${job.user.name},\n\nThis is a reminder that you scheduled a follow-up action for your application at ${job.company} for the position of ${job.position} today.\n\nNext Action Note:\n"${job.nextActionNote || 'No notes added'}"\n\nLog in to Knotic Sense to manage this application: ${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs/${job._id}\n\nBest of luck,\nKnotic Sense Team`,
          html: `<p>Hi ${job.user.name},</p>
                 <p>This is a reminder that you scheduled a follow-up action for your application today:</p>
                 <div style="padding: 15px; background-color: #f3f4f6; border-left: 4px solid #6366f1; margin: 15px 0;">
                   <strong>Company:</strong> ${job.company}<br/>
                   <strong>Position:</strong> ${job.position}<br/>
                   <strong>Next Action Note:</strong> ${job.nextActionNote || 'No notes added'}
                 </div>
                 <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs/${job._id}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px;">View Job Details</a></p>
                 <p>Best of luck,<br/>Knotic Sense Team</p>`
        });
        console.log(`[Scheduler] Sent follow-up alert to ${job.user.email} for job ${job._id}`);
      } catch (mailError) {
        console.error(`[Scheduler] Failed to send email to ${job.user?.email}:`, mailError.message);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Daily follow-up task error:', error);
  }
};

/**
 * Initialize all cron jobs
 */
const initScheduler = () => {
  console.log('[Scheduler] Initializing job scheduler...');

  // 1. Run daily at 9:00 AM
  cron.schedule('0 9 * * *', checkDailyFollowUps);

  // Run immediately in development mock testing mode (1 minute after start)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Scheduler] Development mode detected. Scheduling a quick test run in 30 seconds...');
    setTimeout(checkDailyFollowUps, 30000);
  }
};

module.exports = { initScheduler };
