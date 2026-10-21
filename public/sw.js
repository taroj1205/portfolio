const STATIC = "static-v1";
const IMAGES = "images-v1";
const PAGES = "pages-v1";
const CURRENT = new Set([STATIC, IMAGES, PAGES]);
const LIMITS = { [IMAGES]: 80, [PAGES]: 30 };
const FRESH = 60 * 60 * 1000;

const remember = async (name, request, response) => {
  const cache = await caches.open(name);
  await cache.put(request, response);
  const limit = LIMITS[name];
  if (limit) {
    const keys = await cache.keys();
    await Promise.all(
      keys
        .slice(0, Math.max(0, keys.length - limit))
        .map((key) => cache.delete(key))
    );
  }
};

const cacheFirst = async (name, request) => {
  const hit = await caches.match(request);
  if (hit) {
    return hit;
  }
  const response = await fetch(request);
  if (response.status === 200) {
    await remember(name, request, response.clone());
  }
  return response;
};

const load = async (request) => {
  const response = await fetch(request);
  if (response.status === 200) {
    await remember(PAGES, request, response.clone());
  }
  return response;
};

const page = async (event) => {
  const { request } = event;
  const hit = await caches.match(request);
  if (hit) {
    const age = Date.now() - new Date(hit.headers.get("date")).getTime();
    if (!(age < FRESH)) {
      event.waitUntil(load(request).catch(() => undefined));
    }
    return hit;
  }
  try {
    return await load(request);
  } catch (error) {
    const fallback = await caches.match(request, { ignoreSearch: true });
    if (fallback) {
      return fallback;
    }
    throw error;
  }
};

const warm = async (path) => {
  const url = new URL(path, self.location.origin);
  if (url.origin !== self.location.origin || (await caches.match(url.href))) {
    return;
  }
  await load(new Request(url.href));
};

const dropOld = async () => {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => !CURRENT.has(name))
      .map((name) => caches.delete(name))
  );
  await self.clients.claim();
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(dropOld());
});

self.addEventListener("message", (event) => {
  event.waitUntil(warm(event.data).catch(() => undefined));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(page(event));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(STATIC, request));
  } else if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/pwa/")
  ) {
    event.respondWith(cacheFirst(IMAGES, request));
  }
});
