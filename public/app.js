const newsTabs = document.querySelectorAll('.news-tab');
const newsList = document.getElementById('news-list');
const weatherDetails = document.getElementById('weather-details');
const calendarList = document.getElementById('calendar-list');
const quoteText = document.getElementById('quote-text');

let currentCategory = 'us';

function setActiveTab(category) {
  newsTabs.forEach((tab) => {
    const isActive = tab.dataset.category === category;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    let errorText = 'Unable to load data.';
    try {
      const payload = await response.json();
      errorText = payload.error || errorText;
    } catch (err) {
      errorText = `${errorText} (${response.status})`;
    }
    throw new Error(errorText);
  }
  return response.json();
}

function formatDate(isoString, options) {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

async function loadNews(category) {
  currentCategory = category;
  setActiveTab(category);
  newsList.innerHTML = '<p class="loading">Loading headlines…</p>';

  try {
    const data = await fetchJson(`/api/news?category=${encodeURIComponent(category)}`);
    if (!data.articles || data.articles.length === 0) {
      newsList.innerHTML = '<p class="error">No headlines found. Try again later.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'news-articles';
    data.articles.forEach((article) => {
      const item = document.createElement('article');
      item.className = 'news-item';
      item.innerHTML = `
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
        <div class="news-meta">
          ${article.source ? `${article.source} • ` : ''}${formatDate(article.publishedAt, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
      `;
      list.appendChild(item);
    });

    const footer = document.createElement('p');
    footer.className = 'news-meta';
    footer.textContent = `Updated ${formatDate(data.updatedAt, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })}${data.cached ? ' • cached' : ''}`;

    newsList.innerHTML = '';
    newsList.appendChild(list);
    newsList.appendChild(footer);
    if (data.notice) {
      const notice = document.createElement('p');
      notice.className = 'notice';
      notice.textContent = data.notice;
      newsList.appendChild(notice);
    }
  } catch (error) {
    newsList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function loadWeatherByCoords(lat, lon) {
  try {
    const data = await fetchJson(`/api/weather?lat=${lat}&lon=${lon}`);
    renderWeather(data);
  } catch (error) {
    weatherDetails.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function loadWeatherFallback() {
  try {
    const data = await fetchJson('/api/weather?city=New%20York');
    renderWeather(data);
  } catch (error) {
    weatherDetails.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

function renderWeather(data) {
  const { location = {}, temperature = {}, conditions, humidity, windSpeed, updatedAt, cached, notice } = data;

  const celsius = Number.isFinite(temperature.celsius) ? Math.round(temperature.celsius) : null;
  const fahrenheit = Number.isFinite(temperature.fahrenheit) ? Math.round(temperature.fahrenheit) : null;

  weatherDetails.innerHTML = `
    <div class="weather-temps">
      <strong>${celsius !== null ? `${celsius}°C` : '–°C'}</strong>
      <span>${fahrenheit !== null ? `${fahrenheit}°F` : '–°F'}</span>
    </div>
    <div class="weather-details">
      <div>${location.name || 'Unknown location'}${location.country ? `, ${location.country}` : ''}</div>
      <div>${conditions ? conditions.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown conditions'}</div>
      <div>Humidity: ${humidity ?? '–'}%</div>
      <div>Wind: ${windSpeed ?? '–'} m/s</div>
      <div>Updated ${formatDate(updatedAt, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}${cached ? ' • cached' : ''}</div>
      ${notice ? `<div class="notice">${notice}</div>` : ''}
    </div>
  `;
}

function initializeWeather() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadWeatherByCoords(latitude, longitude);
      },
      () => {
        loadWeatherFallback();
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 30 * 60 * 1000 }
    );
  } else {
    loadWeatherFallback();
  }
}

async function loadCalendar() {
  try {
    const data = await fetchJson('/api/calendar');
    if (!data.events || data.events.length === 0) {
      calendarList.innerHTML = '<p class="error">No events scheduled.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'calendar-list';

    data.events.forEach((event) => {
      const item = document.createElement('article');
      item.className = 'calendar-event';
      const start = new Date(event.start);
      const end = new Date(event.end);
      const rangeFormatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      item.innerHTML = `
        <h3>${event.title}</h3>
        <time>${rangeFormatter.format(start)} – ${rangeFormatter.format(end)}</time>
        <div>${event.location || 'Location TBD'}</div>
      `;
      list.appendChild(item);
    });

    const instructions = document.createElement('p');
    instructions.className = 'news-meta';
    instructions.textContent = data.integrationInstructions;

    calendarList.innerHTML = '';
    calendarList.appendChild(list);
    calendarList.appendChild(instructions);
  } catch (error) {
    calendarList.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

async function loadQuote() {
  try {
    const data = await fetchJson('/api/quote');
    quoteText.innerHTML = `
      <p class="quote">${data.text}<cite>— ${data.author}</cite></p>
      <p class="news-meta">Updated ${formatDate(data.updatedAt, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}${data.cached ? ' • cached' : ''}</p>
      ${data.notice ? `<p class="notice">${data.notice}</p>` : ''}
    `;
  } catch (error) {
    quoteText.innerHTML = `<p class="error">${error.message}</p>`;
  }
}

newsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.category;
    if (category !== currentCategory) {
      loadNews(category);
    }
  });
});

loadNews(currentCategory);
initializeWeather();
loadCalendar();
loadQuote();
