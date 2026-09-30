const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listSites,
  createSite,
  getSite,
  updateSite,
  deleteSite,
  getSiteChecks,
  getSiteUptime,
  getPublicStatus,
} = require('../controllers/siteController');

// Rate-limit site creation: max 20 sites per 15 minutes per IP
const createSiteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many sites created from this IP, please try again later' },
});

// Public status page — no auth
router.get('/status/:publicSlug', getPublicStatus);

// All routes below require authentication
router.use(auth);

router.get('/', listSites);
router.post('/', createSiteLimit, createSite);
router.get('/:id', getSite);
router.put('/:id', updateSite);
router.delete('/:id', deleteSite);
router.get('/:id/checks', getSiteChecks);
router.get('/:id/uptime', getSiteUptime);

module.exports = router;
