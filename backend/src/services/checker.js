const axios = require('axios');
const dns = require('node:dns');
const { isPublicAddress } = require('./urlValidator');

const TIMEOUT_MS = 10_000;

const publicAddressLookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      const blockedAddressError = new Error('URL resolves to a private or reserved IP address');
      blockedAddressError.code = 'ERR_BLOCKED_ADDRESS';
      return callback(blockedAddressError);
    }

    if (options.all) return callback(null, addresses);
    return callback(null, addresses[0].address, addresses[0].family);
  });
};

/**
 * Performs one HTTP GET check against a URL.
 * Returns { isUp, statusCode, responseTimeMs, errorMessage }
 */
const performCheck = async (url) => {
  const start = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      maxRedirects: 5,
      lookup: publicAddressLookup,
      validateStatus: () => true, // don't throw on 4xx/5xx — we decide isUp ourselves
      headers: {
        'User-Agent': 'UptimeSentinel/1.0 (+https://github.com/uptime-sentinel)',
      },
    });

    const responseTimeMs = Date.now() - start;
    const statusCode = response.status;
    const isUp = statusCode >= 200 && statusCode < 400;

    return {
      isUp,
      statusCode,
      responseTimeMs,
      errorMessage: null,
    };
  } catch (err) {
    const responseTimeMs = Date.now() - start;
    let errorMessage = err.message;

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      errorMessage = `Timeout after ${TIMEOUT_MS}ms`;
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = 'DNS lookup failed';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    }

    return {
      isUp: false,
      statusCode: null,
      responseTimeMs,
      errorMessage,
    };
  }
};

module.exports = { performCheck, publicAddressLookup };
