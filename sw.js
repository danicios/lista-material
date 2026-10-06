// Keeps a copy of the app on the phone so it opens without coverage.
// The list data itself is cached by Firestore; this only covers the page, its scripts and fonts.
const CACHE = "lista-material-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

const save = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  const lib = url.hostname === "www.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if(!own && !lib) return;   // Firestore and sign-in traffic always goes to the network

  if(own){
    // Our own files: newest version when online, saved copy when not
    e.respondWith(fetch(req).then(r => save(req, r)).catch(() => caches.match(req, {ignoreSearch: true})));
  } else {
    // Firebase SDK and fonts have versioned URLs, so the saved copy is always good
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => save(req, r))));
  }
});
