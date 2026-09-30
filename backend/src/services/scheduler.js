const cron = require('node-cron');
const MonitoredSite = require('../models/MonitoredSite');
const Check = require('../models/Check');
const { performCheck } = require('./checker');
const { emitSiteUpdate } = require('./socket');

// Track in-progress site check to avoid overlapping
const inProgress = new Set();

/**
 * Process a single site: run the check, persist result, update cached status.
 */
const processSite = async (site) => {
  if (inProgress.has(site._id.toString())) return;
  inProgress.add(site._id.toString());

  try {
    const result = await performCheck(site.url);

    const check = await Check.create({
      site: site._id,
      timestamp: new Date(),
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      isUp: result.isUp,
      errorMessage: result.errorMessage,
    });

    const newStatus = result.isUp ? 'up' : 'down';
    site.currentStatus = newStatus;
    site.lastCheckedAt = check.timestamp;
    await site.save();

    emitSiteUpdate(site._id.toString(), {
      status: newStatus,
      responseTimeMs: result.responseTimeMs,
      timestamp: check.timestamp,
      statusCode: result.statusCode,
    });
  } catch (err) {
    console.error(`[scheduler] Error processing site ${site._id}:`, err.message);
  } finally {
    inProgress.delete(site._id.toString());
  }
};

/**
 * The scheduler tick — runs every 30 seconds and dispatches checks
 * for any active site whose interval has elapsed.
 */
const startScheduler = () => {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();
      const sites = await MonitoredSite.findAll({ where: { isActive: true } });

      for (const site of sites) {
        const intervalMs = site.checkIntervalMinutes * 60 * 1000;
        const elapsed = site.lastCheckedAt
          ? now.getTime() - new Date(site.lastCheckedAt).getTime()
          : Infinity;

        if (elapsed >= intervalMs) {
          // Fire and forget — don't await to keep tick non-blocking
          processSite(site).catch((err) =>
            console.error(`[scheduler] Unhandled error for ${site._id}:`, err.message)
          );
        }
      }
    } catch (err) {
      console.error('[scheduler] Tick error:', err.message);
    }
  });

  console.log('Scheduler started — checking every 30 seconds');
};

module.exports = { startScheduler };
