const fs = require('fs');
const path = require('path');

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');

function ensureCacheFile() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
  }
}

function readCache() {
  ensureCacheFile();
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read cache, recreating file.', error);
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf-8');
    return {};
  }
}

function writeCache(cache) {
  ensureCacheFile();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function getCacheKey(base, params = []) {
  return [base, ...params].join(':');
}

function getCachedValue(key) {
  const cache = readCache();
  const entry = cache[key];
  if (!entry) {
    return null;
  }

  const isStale = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isStale) {
    return null;
  }
  return entry.data;
}

function setCachedValue(key, data) {
  const cache = readCache();
  cache[key] = {
    timestamp: Date.now(),
    data,
  };
  writeCache(cache);
}

module.exports = {
  CACHE_TTL_MS,
  getCacheKey,
  getCachedValue,
  setCachedValue,
};
