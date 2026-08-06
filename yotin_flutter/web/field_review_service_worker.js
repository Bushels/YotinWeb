'use strict';

const cachePrefix = 'yotin-field-review-';
const metadataCache = 'yotin-field-review-metadata';
const activeCacheKey = new Request('./active-cache');
const manifestUrl = new URL('./field-review-cache-manifest.json', self.registration.scope).toString();
const indexUrl = new URL('./index.html', self.registration.scope).toString();
let cacheInProgress = false;

const messageType = {
  cache: 'yotin:cache-field-review',
  status: 'yotin:field-review-cache-status',
  progress: 'yotin:field-review-cache-progress',
  ready: 'yotin:field-review-cache-ready',
  failed: 'yotin:field-review-cache-failed',
  idle: 'yotin:field-review-cache-idle',
};

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;
  if (type === messageType.cache) {
    event.waitUntil(cacheFieldReview());
  }
  if (type === messageType.status) {
    event.waitUntil(reportCacheStatus());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !isFieldReviewRequest(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  event.respondWith(networkFirstAsset(request));
});

function isFieldReviewRequest(request) {
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
}

async function cacheFieldReview() {
  if (cacheInProgress) return;
  cacheInProgress = true;
  let pendingCacheName;
  try {
    const manifestResponse = await fetch(manifestUrl, { cache: 'reload' });
    if (!manifestResponse.ok) {
      throw new Error(`Could not load offline manifest (${manifestResponse.status}).`);
    }
    const manifestForCache = manifestResponse.clone();
    const manifest = await manifestResponse.json();
    if (
      manifest.schema !== 1 ||
      typeof manifest.version !== 'string' ||
      !Array.isArray(manifest.urls) ||
      manifest.urls.length === 0 ||
      !manifest.urls.every(isSafeRelativeAsset)
    ) {
      throw new Error('Offline manifest is invalid.');
    }

    pendingCacheName = `${cachePrefix}${manifest.version}`;
    const activeCacheName = await activeFieldReviewCacheName();
    if (activeCacheName === pendingCacheName) {
      await notifyClients({
        type: messageType.ready,
        version: manifest.version,
      });
      return;
    }
    await caches.delete(pendingCacheName);
    const cache = await caches.open(pendingCacheName);
    const manifestRequest = new Request(manifestUrl, { cache: 'reload' });
    await cache.put(manifestRequest, manifestForCache);

    for (let index = 0; index < manifest.urls.length; index += 1) {
      const url = new URL(manifest.urls[index], self.registration.scope).toString();
      const request = new Request(url, { cache: 'reload' });
      const response = await fetch(request);
      if (!response.ok || response.type === 'opaque') {
        throw new Error(`Could not cache ${manifest.urls[index]}.`);
      }
      await cache.put(request, response.clone());
      await notifyClients({
        type: messageType.progress,
        completed: index + 1,
        total: manifest.urls.length,
      });
    }

    const metadata = await caches.open(metadataCache);
    await metadata.put(activeCacheKey, new Response(pendingCacheName));
    await removeInactiveFieldReviewCaches(pendingCacheName);
    await notifyClients({
      type: messageType.ready,
      version: manifest.version,
    });
  } catch (error) {
    if (pendingCacheName) await caches.delete(pendingCacheName);
    await notifyClients({ type: messageType.failed });
  } finally {
    cacheInProgress = false;
  }
}

function isSafeRelativeAsset(url) {
  return typeof url === 'string' &&
    url.startsWith('./') &&
    !url.includes('..') &&
    !url.includes('://');
}

async function reportCacheStatus() {
  const cacheName = await activeFieldReviewCacheName();
  try {
    const manifestResponse = await fetch(manifestUrl, { cache: 'reload' });
    const manifest = await manifestResponse.json();
    if (
      manifestResponse.ok &&
      manifest.schema === 1 &&
      typeof manifest.version === 'string' &&
      cacheName === `${cachePrefix}${manifest.version}`
    ) {
      await notifyClients({ type: messageType.ready, version: manifest.version });
      return;
    }
    await notifyClients({ type: messageType.idle });
    return;
  } catch (_) {
    // An existing complete cache remains useful when the page opens offline.
  }
  await notifyClients({
    type: cacheName ? messageType.ready : messageType.idle,
  });
}

async function activeFieldReviewCacheName() {
  const metadata = await caches.open(metadataCache);
  const response = await metadata.match(activeCacheKey);
  if (!response) return null;
  const cacheName = await response.text();
  return cacheName.startsWith(cachePrefix) ? cacheName : null;
}

async function activeFieldReviewCache() {
  const cacheName = await activeFieldReviewCacheName();
  return cacheName ? caches.open(cacheName) : null;
}

async function removeInactiveFieldReviewCaches(activeCacheName) {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(
        (name) =>
          name.startsWith(cachePrefix) &&
          name !== metadataCache &&
          name !== activeCacheName,
      )
      .map((name) => caches.delete(name)),
  );
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) return response;
  } catch (_) {
    // The active cache below is the intentional offline fallback.
  }
  const cache = await activeFieldReviewCache();
  return (cache && await cache.match(indexUrl)) || Response.error();
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    if (response.ok) return response;
  } catch (_) {
    // The active package below is the intentional offline fallback.
  }
  const cache = await activeFieldReviewCache();
  return (cache && await cache.match(request)) || Response.error();
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  clients.forEach((client) => client.postMessage(message));
}
