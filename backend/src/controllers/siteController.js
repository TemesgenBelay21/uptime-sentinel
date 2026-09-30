const MonitoredSite = require('../models/MonitoredSite');
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

module.exports = { listSites, createSite };
