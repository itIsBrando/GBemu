
const CACHE_NAME = 'gbemu-v3.5';
const FILES = [
    "util/",
    "icons/",
    "javascript/",
    "javascript/mbc",
    "javascript/audio",
    "util/saveManager.js",
    "util/utility.js",
    "util/settings.js",
    "util/controller.js",
    "util/keyboard.js",
    "util/debug.js",
    "util/themes.js",
    "util/cheats.js",
    "util/touch.js",
    "javascript/types.js",
    "javascript/renderer.js",
    "javascript/mbc/MBC1.js",
    "javascript/mbc/MBC2.js",
    "javascript/mbc/MBC3.js",
    "javascript/mbc/MBC5.js",
    "javascript/audio/apu.js",
    "javascript/audio/c1.js",
    "javascript/audio/c2.js",
    "javascript/audio/c3.js",
    "javascript/audio/c4.js",
    "javascript/ppu.js",
    "javascript/instructionCB.js",
    "javascript/instruction.js",
    "javascript/timer.js",
    "javascript/register.js",
    "javascript/cpu.js",
    "javascript/initalize.js",
    "icons/icon.jpg",
    "manifest.webmanifest",
    "index.html",
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
    