const CACHE_NAME = 'gbemu-v3.8.5';
const FILES = [
    "css/style.css",
    "css/touch.css",
    "css/debug.css",
    "css/buttons.css",
    "css/themes.css",
    "javascript/mbc",
    "util/saveManager.js",
    "util/promptMenu.js",
    "util/utility.js",
    "util/settings.js",
    "util/controller.js",
    "util/keyboard.js",
    "util/debug.js",
    "util/themes.js",
    "util/cheats.js",
    "util/touch.js",
    "util/link.js",
    "javascript/types.js",
    "javascript/renderer.js",
    "javascript/mbc/MBC1.js",
    "javascript/mbc/MBC2.js",
    "javascript/mbc/MBC3.js",
    "javascript/mbc/MBC5.js",
    "javascript/serial.js",
    "javascript/ppu.js",
    "javascript/instructionCB.js",
    "javascript/instruction.js",
    "javascript/timer.js",
    "javascript/register.js",
    "javascript/cpu.js",
    "javascript/initalize.js",
    "index.html",
    "manifest.webmanifest",
];

/**
 * Fetches files to cache
 */
self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        log('Caching all: app shell and content');
        await cache.addAll(FILES);
    })());
});

/**
 * Delete old cache versions
 */
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if(key === CACHE_NAME) {
                return;
            }

            return caches.delete(key);
        }))
    }));
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
      const r = await caches.match(e.request);
      if (r) return r;
      const response = await fetch(e.request);
      const cache = await caches.open(CACHE_NAME);
     
      cache.put(e.request, response.clone());
      return response;
    })());
  });