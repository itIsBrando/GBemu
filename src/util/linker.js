/**
 * This file is the link between JavaScript and WASM.
 * Devices that do not support WASM will not use WASM
 */


const loadModule = async (modulePath) => {
    try {
      return await import(modulePath)
    } catch (e) {
      throw new ImportError(`Unable to import module ${modulePath}`)
    }
  }



async function fetchWasm() {
    const {default: init, scale2x, scale3x} = await loadModule('./../wasm/pkg/lib_wasm.js');

    await init();
    Filter.wasmScale2x = scale2x;
    Filter.wasmScale3x = scale3x;

    document.getElementById('labelChangeFilter').classList.add('wasm-supported-badge');

}

try {
    await fetchWasm();
} catch(e) {
    console.log("[WASM]: Not supported");
}