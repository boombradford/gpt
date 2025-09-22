const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours

const cache = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getCachedValue(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION_MS;
  return isExpired ? null : entry.data;
}

function setCacheValue(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithCache(key, fetcher) {
  const cached = getCachedValue(key);
  if (cached) {
    return { ...cached, cached: true };
  }

  const freshData = await fetcher();
  setCacheValue(key, freshData);
  return { ...freshData, cached: false };
}

const NEWS_CATEGORIES = {
  us: {
    label: 'US News',
    endpoint: 'top-headlines',
    params: { lang: 'en', country: 'us', max: 10 }
  },
  ai: {
    label: 'Artificial Intelligence',
    endpoint: 'search',
    params: { q: '"artificial intelligence"', lang: 'en', max: 10, in: 'title' }
  },
  technology: {
    label: 'Technology',
    endpoint: 'top-headlines',
    params: { topic: 'technology', lang: 'en', max: 10 }
  }
};

const SAMPLE_NEWS = {
  us: [
    {
      title: 'Sample: Senate advances bipartisan infrastructure update',
      url: 'https://example.com/us-infrastructure',
      source: 'US Daily'
    },
    {
      title: 'Sample: Community-led initiatives boost local economies',
      url: 'https://example.com/us-community',
      source: 'City Beat'
    }
  ],
  ai: [
    {
      title: 'Sample: Researchers unveil new breakthrough in AI ethics',
      url: 'https://example.com/ai-ethics',
      source: 'Tech Research Weekly'
    },
    {
      title: 'Sample: AI tools empower small businesses to automate tasks',
      url: 'https://example.com/ai-small-business',
      source: 'Innovation Today'
    }
  ],
  technology: [
    {
      title: 'Sample: Next-gen smartphones focus on sustainability',
      url: 'https://example.com/tech-smartphones',
      source: 'Gadget Wire'
    },
    {
      title: 'Sample: Open-source communities celebrate major milestone',
      url: 'https://example.com/tech-open-source',
      source: 'Developer Journal'
    }
  ]
};

const SAMPLE_WEATHER = {
  location: {
    name: 'New York City',
    country: 'US'
  },
  temperature: {
    celsius: 22,
    fahrenheit: 71.6
  },
  conditions: 'clear sky',
  humidity: 48,
  windSpeed: 3.5
};

const SAMPLE_QUOTE = {
  text: 'The future depends on what we do in the present.',
  author: 'Mahatma Gandhi'
};

function createSampleNewsResponse(categoryKey, notice) {
  const articles = (SAMPLE_NEWS[categoryKey] || []).map((article, index) => ({
    ...article,
    publishedAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
  }));
  return {
    updatedAt: new Date().toISOString(),
    articles,
    notice
  };
}

function createSampleWeatherResponse(notice) {
  return {
    updatedAt: new Date().toISOString(),
    location: { ...SAMPLE_WEATHER.location },
    temperature: { ...SAMPLE_WEATHER.temperature },
    conditions: SAMPLE_WEATHER.conditions,
    humidity: SAMPLE_WEATHER.humidity,
    windSpeed: SAMPLE_WEATHER.windSpeed,
    notice
  };
}

function createSampleQuoteResponse(notice) {
  return {
    updatedAt: new Date().toISOString(),
    ...SAMPLE_QUOTE,
    notice
  };
}

function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

async function fetchNews(categoryKey) {
  const category = NEWS_CATEGORIES[categoryKey];
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return createSampleNewsResponse(
      categoryKey,
      'Using sample headlines. Add GNEWS_API_KEY to enable live news.'
    );
  }
  const url = buildUrl(`https://gnews.io/api/v4/${category.endpoint}`, {
    ...category.params,
    token: apiKey
  });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`GNews API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const articles = (data.articles || []).map((article) => ({
      title: article.title,
      url: article.url,
      source: article.source?.name,
      publishedAt: article.publishedAt
    }));

    return {
      updatedAt: new Date().toISOString(),
      articles
    };
  } catch (error) {
    console.error('Failed to load news:', error.message);
    return createSampleNewsResponse(
      categoryKey,
      'Live news is temporarily unavailable. Showing sample headlines.'
    );
  }
}

app.get('/api/news', async (req, res) => {
  try {
    const categoryKey = req.query.category || 'us';
    if (!NEWS_CATEGORIES[categoryKey]) {
      return res.status(400).json({ error: 'Invalid news category.' });
    }

    const result = await fetchWithCache(`news-${categoryKey}`, () => fetchNews(categoryKey));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchWeather({ lat, lon, city }) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return createSampleWeatherResponse(
      'Using sample weather data. Add OPENWEATHER_API_KEY for live conditions.'
    );
  }
  const params = city
    ? { q: city, appid: apiKey, units: 'metric' }
    : { lat, lon, appid: apiKey, units: 'metric' };

  const url = buildUrl('https://api.openweathermap.org/data/2.5/weather', params);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenWeatherMap API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    const tempC = data.main?.temp;
    const tempF = tempC !== undefined ? (tempC * 9) / 5 + 32 : undefined;

    return {
      updatedAt: new Date().toISOString(),
      location: {
        name: data.name,
        country: data.sys?.country
      },
      temperature: {
        celsius: tempC,
        fahrenheit: tempF
      },
      conditions: data.weather?.[0]?.description || 'Unknown',
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed
    };
  } catch (error) {
    console.error('Failed to load weather:', error.message);
    return createSampleWeatherResponse(
      'Live weather data is temporarily unavailable. Showing sample conditions.'
    );
  }
}

app.get('/api/weather', async (req, res) => {
  const { lat, lon, city } = req.query;
  if ((!lat || !lon) && !city) {
    return res.status(400).json({ error: 'Provide either lat/lon or city query parameters.' });
  }

  try {
    const cacheKey = city ? `weather-city-${city.toLowerCase()}` : `weather-${lat}-${lon}`;
    const result = await fetchWithCache(cacheKey, () => fetchWeather({ lat, lon, city }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const calendarData = {
  updatedAt: new Date().toISOString(),
  events: [
    {
      id: 1,
      title: 'Stand-up Meeting',
      start: '2024-06-05T09:00:00',
      end: '2024-06-05T09:15:00',
      location: 'Conference Room A'
    },
    {
      id: 2,
      title: 'Project Planning Session',
      start: '2024-06-06T13:00:00',
      end: '2024-06-06T14:30:00',
      location: 'Zoom'
    },
    {
      id: 3,
      title: 'Product Demo',
      start: '2024-06-07T11:00:00',
      end: '2024-06-07T12:00:00',
      location: 'Client HQ'
    }
  ],
  integrationInstructions:
    'Replace this endpoint with Google Calendar API calls. Authenticate with OAuth 2.0 and use the events.list endpoint to pull upcoming events.'
};

app.get('/api/calendar', (req, res) => {
  res.json(calendarData);
});

async function fetchQuote() {
  try {
    const response = await fetch('https://api.quotable.io/random?tags=inspirational|life');
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Quote API error (${response.status}): ${message}`);
    }

    const data = await response.json();
    return {
      updatedAt: new Date().toISOString(),
      text: data.content,
      author: data.author
    };
  } catch (error) {
    console.error('Failed to load quote:', error.message);
    return createSampleQuoteResponse(
      'Using a sample quote while the live quote service is unavailable.'
    );
  }
}

app.get('/api/quote', async (req, res) => {
  try {
    const result = await fetchWithCache('quote-of-the-day', fetchQuote);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }

  if (!res.headersSent) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard server listening on http://localhost:${PORT}`);
});
