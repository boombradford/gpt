# Personal Dashboard

A responsive personal dashboard that aggregates news, weather, a calendar overview, and a quote of the day. All external API calls are cached for 12 hours to minimize requests and remain within free tier limits.

## Features

- **News widget** with category tabs for US News, Artificial Intelligence, and Technology headlines sourced from the GNews API.
- **Weather widget** that uses the browser's geolocation (with a New York City fallback) to show temperatures in °C and °F, humidity, and wind speed from OpenWeatherMap.
- **Calendar widget** that displays placeholder events and outlines how to integrate Google Calendar.
- **Quote of the day widget** backed by the Quotable API.
- **12-hour caching** on the server for every external API request.

## Getting started

### Prerequisites

- [Node.js 18+](https://nodejs.org/) (includes a global `fetch` implementation).
- API keys for:
  - [GNews](https://gnews.io/) – set `GNEWS_API_KEY`.
  - [OpenWeatherMap](https://openweathermap.org/api) – set `OPENWEATHER_API_KEY`.

### Installation

```bash
npm install
```

Create a `.env` file in the project root and add the required credentials:

```bash
GNEWS_API_KEY=your_gnews_token
OPENWEATHER_API_KEY=your_openweather_token
PORT=3000 # optional
```

> **Tip:** If the keys are omitted the dashboard serves clearly labeled sample data so you can still explore the UI. Add your API credentials to see live results.

### Run the dashboard

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000/) in your browser.

The server caches each API response for 12 hours. During that window, requests are served from memory and marked with a `cached` flag in the JSON response so the UI can display when data was reused.

## Google Calendar integration guide

The calendar widget currently serves placeholder events from the `/api/calendar` endpoint. To connect a real calendar:

1. Create a Google Cloud project, enable the Calendar API, and configure OAuth 2.0 credentials.
2. Replace the placeholder logic in `server.js` with authenticated calls to [`events.list`](https://developers.google.com/calendar/api/v3/reference/events/list).
3. Store the resulting events in the cache for 12 hours just like the other widgets.
4. Update the front-end mapping in `public/app.js` if you need to display additional fields (attendees, hangout links, etc.).

## Project structure

```
├── public/
│   ├── app.js          # Front-end logic for all widgets
│   ├── index.html      # Dashboard markup
│   └── styles.css      # Styling and layout
├── server.js           # Express server with 12-hour caching
├── package.json
└── README.md
```

## License

ISC
