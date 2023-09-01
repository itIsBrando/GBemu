const CACHE_NAME = 'gbemu-v4.6.96';

const FILES = [
    "./",
    "./css/style.css",
    "./css/touch.css",
    "./css/debug.css",
    "./css/buttons.css",
    "./css/menu.css",
    "./css/themes.css",
    './src/util/linker.js',
    "./src/util/saveManager.js",
    "./src/util/promptMenu.js",
    "./src/util/filter.js",
    "./src/util/utility.js",
    "./src/util/palette.js",
    "./src/util/menu.js",
    "./src/util/settings.js",
    "./src/util/debug.js",
    "./src/util/themes.js",
    "./src/util/cheats.js",
    "./src/util/controller/keyboard.js",
    "./src/util/controller/accelerometer.js",
    "./src/util/controller/controller.js",
    "./src/util/controller/touch.js",
    "./src/util/link.js",
    "./src/util/debug/Opcode.js",
    "./src/util/debug/Disassembler.js",
    "./src/util/debug/Map.js",
    "./src/util/debug/Oam.js",
    "./src/util/debug/Tiles.js",
    "./src/util/debug/Memory.js",
    "./src/types.js",
    "./src/renderer.js",
    "./src/mbc/hardware/rtc.js",
    "./src/mbc/hardware/eeprom.js",
    "./src/mbc/MBC1.js",
    "./src/mbc/MBC2.js",
    "./src/mbc/MBC3.js",
    "./src/mbc/MBC5.js",
    "./src/mbc/MBC7.js",
    "./src/mbc/HuC1.js",
    "./src/serial.js",
    "./src/ppu.js",
    "./src/hdma.js",
    "./src/instructionCB.js",
    "./src/instruction.js",
    "./src/timer.js",
    "./src/cpu.js",
    "./src/initalize.js",
    "./src/util/state.js",
    "./icons/joystick.svg",
    "./icons/slider.svg",
    "./icons/gear.svg",
    "./icons/icon_108x108.png",
    "./icons/icon_512x512.png",
    "./wasm/pkg/lib_wasm.js",
    "./wasm/pkg/lib_wasm_bg.wasm",
    "./index.html",
    "./manifest.webmanifest",
];

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
                    return caches.delete(key);
                })
            );
          })
          .then(function() {
            console.log('[Service Worker] activate completed');
          })
      );
    });

self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] fetching ${e.request.url}`);
        if (r) return r;
        const response = await fetch(e.request);
        const cache = await caches.open(CACHE_NAME);
        console.log(`[Servive Worker] Caching: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});


self.addEventListener('message', (e) => {
    switch(e.data.action) {
        case 'skipWaiting':
            self.skipWaiting();
            break;
        default:
            console.log(`[Service Worker] Unknown message: ${e.data.action}`);
    }
});