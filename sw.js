const FILES = [
    "./css/style.css",
    "./css/touch.css",
    "./css/debug.css",
    "./css/buttons.css",
    "./css/themes.css",
    "./util/saveManager.js",
    "./util/promptMenu.js",
    "./util/utility.js",
    "./util/settings.js",
    "./util/controller.js",
    "./util/keyboard.js",
    "./util/debug.js",
    "./util/themes.js",
    "./util/cheats.js",
    "./util/touch.js",
    "./util/link.js",
    "./javascript/types.js",
    "./javascript/renderer.js",
    "./javascript/mbc/MBC1.js",
    "./javascript/mbc/MBC2.js",
    "./javascript/mbc/MBC3.js",
    "./javascript/mbc/MBC5.js",
    "./javascript/serial.js",
    "./javascript/ppu.js",
    "./javascript/instructionCB.js",
    "./javascript/instruction.js",
    "./javascript/timer.js",
    "./javascript/register.js",
    "./javascript/cpu.js",
    "./javascript/initalize.js",
    "./index.html",
    "./manifest.webmanifest",
];


var CACHE_NAME = 'gbemu-v3.9.1';

/**
 * Fetches files to cache
 */
self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        await cache.addAll(FILES);
    })());
});

/**
 * Delete old cache versions
 */
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activation');
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function(key) {
                  return !key.startsWith(CACHE_NAME);
                }).map(function (key) {
                    console.log('Removed old cache')
                  return caches.delete(key);
                })
            );
          })
          .then(function() {
            console.log('WORKER: activate completed.');
          })
      );
    });

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] fetching ${e.request.url}`);
        Settings.set_core('sw_status', 'offline');
        if (r) return r;
        const response = await fetch(e.request);
        const cache = await caches.open(CACHE_NAME);
        Settings.set_core('sw_status', 'online');
        console.log(`[Servive Worker] Caching: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});