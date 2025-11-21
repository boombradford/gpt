const NEWS_CATEGORIES = [
  { key: 'us-news', label: 'US News' },
  { key: 'artificial-intelligence', label: 'Artificial Intelligence' },
  { key: 'technology', label: 'Technology' },
];

const PLACEHOLDER_EVENTS = [
  {
    title: 'Team Standup',
    date: '2024-05-15',
    time: '09:00 AM',
    location: 'Video Call',
    description: 'Daily sync with the product and engineering teams.',
  },
  {
    title: 'AI Webinar: Future of Machine Learning',
    date: '2024-05-16',
    time: '01:30 PM',
    location: 'Zoom',
    description: 'Join industry experts for a live discussion on AI trends.',
  },
  {
    title: 'Weekend Planning',
    date: '2024-05-18',
    time: '10:00 AM',
    location: 'Home',
    description: 'Plan the upcoming week and review personal goals.',
  },
];

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function renderNewsCategory(element, data) {
  const list = element.querySelector('.headline-list');
  const message = element.querySelector('.news-message');
  list.innerHTML = '';
  message.textContent = '';

  if (data.headlines && data.headlines.length > 0) {
    data.headlines.forEach((article) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = article.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = article.title;
      listItem.appendChild(link);
      list.appendChild(listItem);
    });
  } else {
    message.textContent = data.message || 'No headlines available in the cache yet.';
  }
}

async function loadNews() {
  const newsSection = document.getElementById('news-widget');
  NEWS_CATEGORIES.forEach(({ key }) => {
    const categoryEl = newsSection.querySelector(`[data-category="${key}"]`);
    if (categoryEl) {
      const message = categoryEl.querySelector('.news-message');
      message.textContent = 'Loading headlines...';
    }
  });

  await Promise.all(
    NEWS_CATEGORIES.map(async ({ key }) => {
      const categoryEl = newsSection.querySelector(`[data-category="${key}"]`);
      if (!categoryEl) return;
      try {
        const data = await fetchJson(`/api/news?category=${key}`);
        renderNewsCategory(categoryEl, data);
      } catch (error) {
        const message = categoryEl.querySelector('.news-message');
        message.textContent = 'Unable to load headlines. Showing cached data when available.';
        console.error('News fetch error', error);
      }
    })
  );
}

function renderWeather(data) {
  const locationEl = document.querySelector('.weather-location');
  const temperatureEl = document.querySelector('.weather-temperature');
  const conditionsEl = document.querySelector('.weather-conditions');
  const messageEl = document.querySelector('.weather-message');

  locationEl.textContent = data.location || 'Unknown location';
  if (data.temperature) {
    temperatureEl.textContent = `${data.temperature.celsius}°C / ${data.temperature.fahrenheit}°F`;
  } else {
    temperatureEl.textContent = '';
  }
  conditionsEl.textContent = data.conditions ? data.conditions : '';
  messageEl.textContent = data.message || '';
}

async function loadWeatherWithCoordinates(lat, lon) {
  try {
    const query = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
    const data = await fetchJson(`/api/weather${query}`);
    renderWeather(data);
  } catch (error) {
    console.error('Weather fetch error', error);
    renderWeather({
      location: 'Weather unavailable',
      message: 'Unable to load weather data right now. Cached data will appear once available.',
    });
  }
}

function loadWeather() {
  if (!navigator.geolocation) {
    loadWeatherWithCoordinates();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherWithCoordinates(latitude, longitude);
    },
    () => {
      loadWeatherWithCoordinates();
    }
  );
}

function renderEvents(events) {
  const list = document.querySelector('.event-list');
  list.innerHTML = '';
  events.forEach((event) => {
    const item = document.createElement('li');
    item.className = 'event-item';
    const title = document.createElement('h4');
    title.textContent = event.title;
    const time = document.createElement('time');
    time.dateTime = event.date;
    time.textContent = `${event.date} · ${event.time}`;
    const location = document.createElement('p');
    location.textContent = event.location;
    const description = document.createElement('p');
    description.textContent = event.description;

    item.append(title, time, location, description);
    list.appendChild(item);
  });
}

// To integrate with Google Calendar:
// 1. Replace PLACEHOLDER_EVENTS with data fetched from the Calendar API.
// 2. Use the Google APIs JavaScript client (gapi) or your backend to handle OAuth.
// 3. Map each event from the API to match the { title, date, time, location, description } structure.
// 4. Call renderEvents(realEvents) after retrieving authorized data.

async function loadQuote() {
  try {
    const data = await fetchJson('/api/quote');
    const quoteText = document.querySelector('.quote-text');
    const quoteAuthor = document.querySelector('.quote-author');
    quoteText.textContent = data.quote;
    quoteAuthor.textContent = data.author ? `— ${data.author}` : '';
  } catch (error) {
    console.error('Quote fetch error', error);
  }
}

function initializeDashboard() {
  renderEvents(PLACEHOLDER_EVENTS);
  loadNews();
  loadWeather();
  loadQuote();
}

document.addEventListener('DOMContentLoaded', initializeDashboard);

