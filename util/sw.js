
const CACHE_NAME = 'gbemu-v1.1';
const FILES = [
    "util/",
    "javascript/",
    "javascript/mbc",
    "util/saveManager.js",
    "util/utility.js",
    "util/controller.js",
    "util/debug.js",
    "util/themes.js",
    "javascript/types.js",
    "javascript/renderer.js",
    "javascript/mbc/MBC1.js",
    "javascript/mbc/MBC2.js",
    "javascript/mbc/MBC3.js",
    "javascript/mbc/MBC5.js",
    "javascript/ppu.js",
    "javascript/instructionCB.js",
    "javascript/instruction.js",
    "javascript/timer.js",
    "javascript/register.js",
    "javascript/cpu.js",
    "javascript/initalize.js",
    "util/touch.js",
    "index.html"
]

/**
 * Fetches files to cache
 */
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installing');

    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        console.log('[Service Worker] Caching all: app shell and content');
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
    