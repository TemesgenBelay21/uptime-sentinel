const axios = require('axios');

const TIMEOUT_MS = 10_000;

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
    return {
      isUp: false,
      statusCode: null,
      responseTimeMs: Date.now() - start,
      errorMessage: err.message,
    };
  }
};

module.exports = { performCheck };
