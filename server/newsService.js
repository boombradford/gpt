const fetch = require('node-fetch');
const { getCacheKey, getCachedValue, setCachedValue } = require('./cache');

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || process.env.NEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

const CATEGORY_CONFIG = {
  'us-news': {
    label: 'US News',
    endpoint: 'top-headlines',
    params: {
      country: 'us',
      topic: 'nation',
      lang: 'en',
      max: 10,
    },
  },
  'artificial-intelligence': {
    label: 'Artificial Intelligence',
    endpoint: 'search',
    params: {
      q: '"artificial intelligence"',
      lang: 'en',
      max: 10,
    },
  },
  technology: {
    label: 'Technology',
    endpoint: 'top-headlines',
    params: {
      topic: 'technology',
      lang: 'en',
      max: 10,
    },
  },
};

function buildUrl(endpoint, params) {
  const url = new URL(`${GNEWS_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set('token', GNEWS_API_KEY || '');
  return url.toString();
}

function normalizeArticle(article) {
  return {
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source?.name,
    publishedAt: article.publishedAt,
  };
}

async function fetchNews(category) {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error(`Unsupported news category: ${category}`);
  }

  const cacheKey = getCacheKey('news', [category]);
  const cached = getCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  if (!GNEWS_API_KEY) {
    const fallback = {
      category: config.label,
      headlines: [],
      message: 'Set the GNEWS_API_KEY environment variable to enable live headlines.',
    };
    setCachedValue(cacheKey, fallback);
    return fallback;
  }

  const url = buildUrl(config.endpoint, config.params);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GNews request failed with status ${response.status}`);
    }
    const payload = await response.json();
    const headlines = (payload.articles || []).map(normalizeArticle);
    const data = {
      category: config.label,
      headlines,
    };
    setCachedValue(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch news', error);
    const fallback = {
      category: config.label,
      headlines: [],
      message: 'Unable to load headlines at this time. Cached data will be used when available.',
    };
    setCachedValue(cacheKey, fallback);
    return fallback;
  }
}

module.exports = {
  CATEGORY_CONFIG,
  fetchNews,
};
