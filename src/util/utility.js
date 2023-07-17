/**
 * Enters full screen if possible, or does nothing
 * @returns true if we could get fullscreen, otherwise false
 */
function requestFullscreen() {
    if(!c.romLoaded)
        return;
    if(canvas.requestFullscreen) {
        canvas.requestFullscreen();
        return true;
    } else if(canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        return true;
    } else if(canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
        return true;
    }

    return false;
}


/**
 * Exits full screen mode if possible
 */
function exitFullscreen() {
    if(document.exitFullscreen) {
        document.exitFullscreen().then(() => {
            return true;
        }).catch(err => {
            CPU.LOG("Not in fullscreen: " + err);
            return false;
        });
        return false;
    }
}

/**
 * Converts a value into a hexidemical string
 * @param {any} v
 * @param {Number} pad number of min digits to display
 * @param {String} prefix string to use as a prefix. Defaults to 0x
 */
function hex(v, pad=0, prefix="0x") {
    return prefix + Number(v).toString(16).toUpperCase().padStart(pad, "0");
}


/**
 * Converts a value into a binary string
 * @param {any} v
 */
function bin(v, pad=0) {
    return "0b" + v.toString(2).toUpperCase().padStart(pad, "0");
}


function selectAll() {
    const elem = document.getElementById('PromptText');
    elem.select();

    const range = document.createRange();
    range.selectNodeContents(elem);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    elem.setSelectionRange(0, 999999);
}

/**
 * Shows a menu to prompt the user to save text
 * - must be called from an event
 * @param {String} text string to save
 */
function copyClipMenu(text) {
    const m = new PromptMenu("Copy Text", "", /\.+/g, 999999, (v)=> {
        selectAll();
        document.execCommand("copy");
        Menu.message.show("Copied to clipboard", "Success");
    }, null, text, "copy");

    m.show();
}


/**
 * Shows the information of a ROM if it is loaded
 */
function showROMInfo() {
    if(!c.romLoaded) {
        Menu.alert.show("No ROM loaded");
        return;
    }

    Menu.message.show(
        `<div class="debug-text" style="color:var(ui-background-text);">
        <br><b style="color:var(--ui-accent);">MBC Type:</b> ${MemoryControllerText[c.mem.rom[0x0147]].replace(/\++/g, " ")}
        <br><b style="color:var(--ui-accent);">Licensee:</b> ${hex(c.mem.rom[0x14b], 2, "$")}
        <br><b style="color:var(--ui-accent);">Header Checksum:</b> ${hex(c.mem.rom[0x14d], 2, "$")}
        <br><b style="color:var(--ui-accent);">Emulation Mode:</b> ${(c.cgb ? "CGB" : "Non-CGB")} mode
        <br><b style="color:var(--ui-accent);">ROM Size:</b> ${(c.hasMbc() ? c.mbcHandler.rom.length >> 10 : 32)} KB
        <br><b style="color:var(--ui-accent);">RAM Size:</b> ${(c.hasMbc() ? c.mbcHandler.ram.length >> 10 : 0)} KB
        </div>`,
        c.getTitle()
    );
}


/**
 * Checks to see if the current device has a touchscreen
 * @returns true if it does, otherwise false
 */
function hasTouchscreen() {
    return 'ontouchstart' in window;
}