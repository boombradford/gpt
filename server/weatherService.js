const fetch = require('node-fetch');
const { getCacheKey, getCachedValue, setCachedValue } = require('./cache');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const DEFAULT_LAT = process.env.DEFAULT_LAT || '40.7128';
const DEFAULT_LON = process.env.DEFAULT_LON || '-74.0060';
const DEFAULT_LOCATION_LABEL = process.env.DEFAULT_LOCATION_LABEL || 'New York, US';

function formatTemperatureCelsius(tempCelsius) {
  return {
    celsius: Number(tempCelsius.toFixed(1)),
    fahrenheit: Number(((tempCelsius * 9) / 5 + 32).toFixed(1)),
  };
}

async function fetchWeather(lat, lon) {
  const latitude = lat || DEFAULT_LAT;
  const longitude = lon || DEFAULT_LON;
  const cacheKey = getCacheKey('weather', [latitude, longitude]);
  const cached = getCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  if (!OPENWEATHER_API_KEY) {
    const fallback = {
      location: DEFAULT_LOCATION_LABEL,
      message: 'Set the OPENWEATHER_API_KEY environment variable to enable live weather data.',
    };
    setCachedValue(cacheKey, fallback);
    return fallback;
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', latitude);
  url.searchParams.set('lon', longitude);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', OPENWEATHER_API_KEY);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`OpenWeatherMap request failed with status ${response.status}`);
    }
    const payload = await response.json();
    const tempC = payload.main?.temp;
    const { celsius, fahrenheit } = formatTemperatureCelsius(tempC);
    const data = {
      location: payload.name ? `${payload.name}, ${payload.sys?.country || ''}`.trim() : DEFAULT_LOCATION_LABEL,
      temperature: {
        celsius,
        fahrenheit,
      },
      conditions: payload.weather && payload.weather.length ? payload.weather[0].description : undefined,
    };
    setCachedValue(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch weather', error);
    const fallback = {
      location: DEFAULT_LOCATION_LABEL,
      message: 'Unable to load weather data at this time. Cached data will be used when available.',
    };
    setCachedValue(cacheKey, fallback);
    return fallback;
  }
}

module.exports = {
  fetchWeather,
};
