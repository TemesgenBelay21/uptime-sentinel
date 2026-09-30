let _io = null;
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const MonitoredSite = require('../models/MonitoredSite');

/** Called once from server.js after socket.io is initialized. */
const init = (io) => {
  _io = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) return next(new Error('Invalid token'));
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('subscribe', async ({ siteIds } = {}) => {
      if (!Array.isArray(siteIds)) return;
      const validIds = siteIds
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0)
        .slice(0, 100);
      if (validIds.length === 0) return;

      try {
        const ownedSites = await MonitoredSite.findAll({
          _id: { [Op.in]: validIds },
          owner: socket.data.userId,
          attributes: ['_id'],
        });
        ownedSites.forEach(({ _id }) => socket.join(`site:${_id}`));
      } catch (error) {
        console.error('[socket] Could not authorize site subscriptions:', error.message);
      }
    });

    socket.on('disconnect', () => {});
  });
};

/**
 * Emit a status update for a site to all subscribers of that site's room.
 * @param {string} siteId
 * @param {object} payload - { status, responseTimeMs, timestamp }
 */
const emitSiteUpdate = (siteId, payload) => {
  if (!_io) return;
  _io.to(`site:${siteId}`).emit('site:status-update', { siteId, ...payload });
};

module.exports = { init, emitSiteUpdate };
