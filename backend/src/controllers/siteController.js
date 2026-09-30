const MonitoredSite = require('../models/MonitoredSite');
const Check = require('../models/Check');
const AlertLog = require('../models/AlertLog');
const { validateUrl } = require('../services/urlValidator');

/** GET /api/sites */
const listSites = async (req, res, next) => {
  try {
    const sites = await MonitoredSite.findAll({
      where: { owner: req.user.userId },
      order: [['createdAt', 'DESC']],
    });
    res.json({ sites });
  } catch (err) {
    next(err);
  }
};

/** POST /api/sites */
const createSite = async (req, res, next) => {
  try {
    const { name, url, checkIntervalMinutes } = req.body;
    if (!name || !url) return res.status(400).json({ message: 'name and url are required' });

    const { valid, reason, url: normalizedUrl } = validateUrl(url);
    if (!valid) return res.status(400).json({ message: reason });

    const interval = Number(checkIntervalMinutes) || 5;
    if (interval < 1) return res.status(400).json({ message: 'Minimum check interval is 1 minute' });

    const site = await MonitoredSite.create({
      owner: req.user.userId,
      name: name.trim(),
      url: normalizedUrl,
      checkIntervalMinutes: interval,
    });

    res.status(201).json({ site });
  } catch (err) {
    next(err);
  }
};

/** GET /api/sites/:id */
const getSite = async (req, res, next) => {
  try {
    const site = await ownerSite(req, res);
    if (!site) return;

    const recentChecks = await Check.findAll({
      where: { site: site._id },
      order: [['timestamp', 'DESC']],
      limit: 50,
    });

    const alerts = await AlertLog.findAll({
      where: { site: site._id },
      order: [['sentAt', 'DESC']],
      limit: 20,
    });

    res.json({ site, recentChecks, alerts });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/sites/:id */
const updateSite = async (req, res, next) => {
  try {
    const site = await ownerSite(req, res);
    if (!site) return;

    const { name, url, checkIntervalMinutes, isActive } = req.body;

    if (name !== undefined) site.name = name.trim();
    if (url !== undefined) {
      const { valid, reason, url: normalizedUrl } = validateUrl(url);
      if (!valid) return res.status(400).json({ message: reason });
      site.url = normalizedUrl;
    }
    if (checkIntervalMinutes !== undefined) {
      const interval = Number(checkIntervalMinutes);
      if (interval < 1) return res.status(400).json({ message: 'Minimum check interval is 1 minute' });
      site.checkIntervalMinutes = interval;
    }
    if (isActive !== undefined) site.isActive = Boolean(isActive);

    await site.save();
    res.json({ site });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/sites/:id */
const deleteSite = async (req, res, next) => {
  try {
    const site = await ownerSite(req, res);
    if (!site) return;

    // Cascade-delete check history and alert logs
    await site.destroy();

    res.json({ message: 'Site deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Find site by :id and verify ownership; sends 403/404 and returns null if invalid. */
const ownerSite = async (req, res) => {
  const siteId = Number(req.params.id);
  if (!Number.isSafeInteger(siteId) || siteId < 1) {
    res.status(404).json({ message: 'Site not found' });
    return null;
  }

  const site = await MonitoredSite.findByPk(siteId);
  if (!site) {
    res.status(404).json({ message: 'Site not found' });
    return null;
  }
  if (String(site.owner) !== String(req.user.userId)) {
    res.status(403).json({ message: 'Forbidden' });
    return null;
  }
  return site;
};

module.exports = { listSites, createSite, getSite, updateSite, deleteSite };
