require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { fetchNews, CATEGORY_CONFIG } = require('./newsService');
const { fetchWeather } = require('./weatherService');
const { fetchQuoteOfTheDay } = require('./quoteService');
const { CACHE_TTL_MS } = require('./cache');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/news', async (req, res) => {
  const { category } = req.query;
  try {
    if (category) {
      const data = await fetchNews(category);
      res.json(data);
      return;
    }

    const categories = Object.keys(CATEGORY_CONFIG);
    const results = await Promise.all(categories.map((key) => fetchNews(key)));
    res.json({ categories: results });
  } catch (error) {
    console.error('News route error', error);
    res.status(500).json({ error: 'Unable to load news at this time.' });
  }
});

app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const data = await fetchWeather(lat, lon);
    res.json(data);
  } catch (error) {
    console.error('Weather route error', error);
    res.status(500).json({ error: 'Unable to load weather at this time.' });
  }
});

app.get('/api/quote', async (req, res) => {
  try {
    const data = await fetchQuoteOfTheDay();
    res.json(data);
  } catch (error) {
    console.error('Quote route error', error);
    res.status(500).json({ error: 'Unable to load quote at this time.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cacheTtlHours: CACHE_TTL_MS / (60 * 60 * 1000),
  });
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Personal dashboard server listening on port ${PORT}`);
});
