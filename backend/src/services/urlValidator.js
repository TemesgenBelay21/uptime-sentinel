const { URL } = require('node:url');
const ipaddr = require('ipaddr.js');

const BLOCKED_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

const isPublicAddress = (address) => {
  try {
    return ipaddr.parse(address).range() === 'unicast';
  } catch {
    return false;
  }
};

/**
 * Validates a user-submitted URL.
 * Returns { valid: true, url } or { valid: false, reason }.
 */
const validateUrl = (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'URL is not valid' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, reason: 'Only http:// and https:// URLs are allowed' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return { valid: false, reason: 'URL points to a blocked hostname' };
  }

  if (ipaddr.isValid(hostname) && !isPublicAddress(hostname)) {
    return { valid: false, reason: 'URL points to a private or reserved IP range' };
  }

  return { valid: true, url: parsed.href };
};

module.exports = { validateUrl, isPublicAddress };
