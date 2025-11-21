# Personal Dashboard

A responsive personal dashboard web application that surfaces the latest news headlines, weather details, upcoming events, and an inspirational quote of the day. The server transparently caches all external API calls for 12 hours to stay within free tier limits and deliver fast repeat loads.

## Features

- **News Widget** – Retrieves and displays top headlines for US News, Artificial Intelligence, and Technology using the GNews API.
- **Weather Widget** – Shows the current temperature in °C and °F, condition summary, and location using OpenWeatherMap data.
- **Calendar Widget** – Renders configurable placeholder events and outlines how to integrate with the Google Calendar API.
- **Quote of the Day** – Pulls a fresh inspirational quote daily using the ZenQuotes API (or a compatible endpoint).
- **12-hour cache** – All outbound API requests are cached for 12 hours to respect rate limits; the dashboard falls back to cached responses automatically.

## Tech Stack

- Node.js + Express backend
- Vanilla JavaScript front-end served statically from Express
- File-based cache persisted under `cache/cache.json`
- Environment variable driven configuration via `dotenv`

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create a `.env` file** (optional but recommended) in the project root:
   ```env
   GNEWS_API_KEY=your_gnews_api_key
   OPENWEATHER_API_KEY=your_openweathermap_api_key
   DEFAULT_LAT=40.7128           # optional fallback latitude
   DEFAULT_LON=-74.0060          # optional fallback longitude
   DEFAULT_LOCATION_LABEL=New York, US  # optional fallback label
   QUOTE_API_URL=https://zenquotes.io/api/today  # optional override
   PORT=3000
   ```
   - Obtain a free GNews API key from [https://gnews.io](https://gnews.io) or update the news service to use your preferred provider.
   - Create a free OpenWeatherMap account at [https://openweathermap.org](https://openweathermap.org) to receive an API key.
3. **Start the development server**
   ```bash
   npm start
   ```
4. Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

> **Tip:** The first time you load the dashboard it will call the live APIs (if keys are configured) and populate the cache. Subsequent requests within 12 hours will be served from `cache/cache.json`.

## Calendar Integration Guide

The dashboard ships with static placeholder events defined in `public/app.js`. To connect a real calendar:

1. Create a Google Cloud project and enable the **Google Calendar API**.
2. Configure **OAuth 2.0** credentials for a web application and add the authorized JavaScript origins (e.g., `http://localhost:3000`).
3. Use the [Google APIs JavaScript client (`gapi`)](https://developers.google.com/calendar/api/quickstart/js) or build a secure backend route to handle OAuth token exchange.
4. After authenticating, fetch events (e.g., `gapi.client.calendar.events.list`) and map them to the `{ title, date, time, location, description }` structure used by `renderEvents` in `public/app.js`.
5. Replace `PLACEHOLDER_EVENTS` with the real data and call `renderEvents(realEvents)` once the API returns.

## API Caching Details

- Cached responses live for **12 hours** (`43,200,000ms`).
- Cache entries are stored by key in `cache/cache.json` along with their fetch timestamp.
- When a request arrives, the server serves cached data if the entry is fresh; otherwise it refreshes the cache by calling the upstream API.
- If an external API call fails or required API keys are missing, the server caches a helpful fallback response so the UI can display contextual messages without re-pinging the upstream service.

## Project Structure

```
workspace/
├── cache/                 # JSON cache storage
├── public/                # Front-end assets
│   ├── app.js             # Widget logic and rendering
│   ├── index.html         # Dashboard markup
│   └── styles.css         # Styling
├── server/                # Express server and service modules
│   ├── cache.js           # File-based caching helpers
│   ├── index.js           # Express entrypoint and API routes
│   ├── newsService.js     # News API integration with caching
│   ├── quoteService.js    # Quote API integration with caching
│   └── weatherService.js  # Weather API integration with caching
├── package.json
└── README.md
```

## Troubleshooting

- **Missing API keys** – The UI will surface a friendly message when keys are absent. Add the required keys to `.env` and restart the server to enable live data.
- **Resetting the cache** – Delete `cache/cache.json` to force the application to refetch fresh data on the next request.
- **Changing the cache window** – Update `CACHE_TTL_MS` in `server/cache.js` if you need a shorter or longer cache duration.

Enjoy your personalized daily dashboard!
