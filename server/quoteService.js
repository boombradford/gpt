const fetch = require('node-fetch');
const { getCacheKey, getCachedValue, setCachedValue } = require('./cache');

const QUOTE_API_URL = process.env.QUOTE_API_URL || 'https://zenquotes.io/api/today';

function normalizeQuote(entry) {
  if (!entry) {
    return null;
  }
  return {
    quote: entry.q,
    author: entry.a,
  };
}

async function fetchQuoteOfTheDay() {
  const cacheKey = getCacheKey('quote-of-the-day');
  const cached = getCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(QUOTE_API_URL);
    if (!response.ok) {
      throw new Error(`Quote API request failed with status ${response.status}`);
    }
    const payload = await response.json();
    const quote = Array.isArray(payload) ? normalizeQuote(payload[0]) : null;
    const data = quote || {
      quote: 'Make today amazing.',
      author: 'Unknown',
    };
    setCachedValue(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch quote of the day', error);
    const fallback = {
      quote: 'Stay positive, work hard, and make it happen.',
      author: 'Unknown',
    };
    setCachedValue(cacheKey, fallback);
    return fallback;
  }
}

module.exports = {
  fetchQuoteOfTheDay,
};
