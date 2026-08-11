// conju.gat — offline-first for the verb data, network-first for the app shell.
// The point is that it works on the metro.

const VERSION = "conjugat-v1";
const DATA = ["/data/patterns.json", "/data/verbs.json", "/data/deck.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(["/", ...DATA]))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Verb data: serve from cache immediately, refresh in the background.
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const live = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(request, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || live;
      }),
    );
    return;
  }

  // Everything else: try the network, fall back to whatever we cached.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/"))) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit || caches.match("/"))
          .then((hit) => hit || Response.error()),
      ),
  );
});
