const cron = require('node-cron');
const MonitoredSite = require('../models/MonitoredSite');
const Check = require('../models/Check');
const AlertLog = require('../models/AlertLog');
const User = require('../models/User');
const { performCheck } = require('./checker');
const { sendDownAlert, sendRecoveryAlert } = require('./mailer');
const { emitSiteUpdate } = require('./socket');

// Track in-progress site check to avoid overlapping
const inProgress = new Set();

/**
 * Process a single site: run the check, persist result, handle transitions.
 */
const processSite = async (site) => {
  if (inProgress.has(site._id.toString())) return;
  inProgress.add(site._id.toString());

  try {
    const result = await performCheck(site.url);
    const previousStatus = site.currentStatus;

    // Persist the check
    const check = await Check.create({
      site: site._id,
      timestamp: new Date(),
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      isUp: result.isUp,
      errorMessage: result.errorMessage,
    });

    // Update site's current state
    const newStatus = result.isUp ? 'up' : 'down';
    site.currentStatus = newStatus;
    site.lastCheckedAt = check.timestamp;
    await site.save();

    // Emit live update to all connected subscribers
    emitSiteUpdate(site._id.toString(), {
      status: newStatus,
      responseTimeMs: result.responseTimeMs,
      timestamp: check.timestamp,
      statusCode: result.statusCode,
    });

    // ── Transition detection ─────────────────────────────────────────────────
    const isTransitionToDown = result.isUp === false && previousStatus !== 'down';
    const isTransitionToUp = result.isUp === true && previousStatus === 'down';

    if (!isTransitionToDown && !isTransitionToUp) return;

    // Fetch the site owner's email for alerts
    const owner = await User.findByPk(site.owner);
    if (!owner) return;

    if (isTransitionToDown) {
      await sendDownAlert({
        to: owner.email,
        siteName: site.name,
        siteUrl: site.url,
        detectedAt: check.timestamp,
        errorMessage: result.errorMessage,
        statusCode: result.statusCode,
      });

      await AlertLog.create({
        site: site._id,
        type: 'down',
        sentAt: new Date(),
        emailedTo: owner.email,
      });

      console.log(`🔴 [alert] ${site.name} → DOWN — alert sent to ${owner.email}`);
    }

    if (isTransitionToUp) {
      // Find the last down Check to calculate downtime duration
      const lastDownCheck = await Check.findOne({
        where: { site: site._id, isUp: false },
        order: [['timestamp', 'DESC']],
      });

      const downtimeMs = lastDownCheck
        ? check.timestamp.getTime() - lastDownCheck.timestamp.getTime()
        : null;

      await sendRecoveryAlert({
        to: owner.email,
        siteName: site.name,
        siteUrl: site.url,
        recoveredAt: check.timestamp,
        downtimeMs,
      });

      await AlertLog.create({
        site: site._id,
        type: 'recovered',
        sentAt: new Date(),
        emailedTo: owner.email,
      });

      console.log(`🟢 [alert] ${site.name} → UP — recovery alert sent to ${owner.email}`);
    }
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

  console.log('⏱️  Scheduler started — checking every 30 seconds');
};

module.exports = { startScheduler };
