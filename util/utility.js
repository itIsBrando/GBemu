// desktop needs innerWidth
const getWidth = function() {
    return document.documentElement.clientWidth;
}


const getHeight = function() {
    return document.documentElement.clientHeight;
}


/**
 * Checks if the game is landscape of potrait
 * @returns true if the window is being displayed in landscape
 */
function isLandscape() {
    return getHeight() < getWidth();
}


/**
 * @returns true if the device is an iPhone with a notch
 */
function hasNotch() {
    return navigator.userAgent.match(/(iPhone)/) && window.innerWidth * window.innerHeight == "304500";
}


/**
 * Enters full screen if possible, or does nothing
 * @returns true if we could get fullscreen, otherwise false
 */
function requestFullscreen() 
{
    if(!c.isRunning)
        return;
    if(canvas.requestFullscreen)
    {
        canvas.requestFullscreen();
        return true;
    } else if(canvas.webkitRequestFullscreen)
    {
        canvas.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        return true;
    } else if(canvas.msRequestFullscreen)
    {
        canvas.msRequestFullscreen();
        return true;
    }

    return false;
}


/**
 * Exits full screen mode if possible
 */
function exitFullscreen() {
    if(canvas.requestFullscreen)
    {
        canvas.exitFullscreen();
    } else if(canvas.webkitRequestFullscreen)
    {
        canvas.webkitExitFullscreen();
    } else if(canvas.msRequestFullscreen)
    {
        canvas.msExitFullscreen();
    }
}


/**
 * Converts a value into a hexidemical string
 * @param {any} v 
 * @param {Number} pad number of min digits to display
 * @param {String} prefix string to use as a prefix. Defaults to 0x
 */
function hex(v, pad=0, prefix="0x") {
    return prefix + v.toString(16).toUpperCase().padStart(pad, "0");
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
    if(!c.isRunning) {
        Menu.alert.show("No ROM loaded");
        return;
    }

    Menu.message.show(
        `<div class="debug-text"><b style="color:deepskyblue">ROM Name:</b> ${c.readROMName()}` +
        '<br><b style="color:deepskyblue;">MBC Type:</b> ' + MemoryControllerText[c.mem.rom[0x0147]].replace(/\++/g, " ") +
        '<br><b style="color:deepskyblue">Emulation Mode:</b> ' + (c.cgb ? "GBC" : "DMG") +
        '<br><b style="color:deepskyblue">ROM Size:</b> ' + (c.hasMbc() ? c.mbcHandler.rom.length + " bytes": "32kb") +
        '<br><b style="color:deepskyblue">RAM Size:</b> ' + (c.hasMbc() ? c.mbcHandler.ram.length + " bytes": "none") +
        '</div>',
        "ROM Info"
    );
}


var Palette = new function() {
    // color palette
    const paletteSetDiv = document.getElementById('paletteSetDiv');
    const colorPreview = document.getElementById('colorPreview');
    
    // color elements
    const r = document.getElementById('colorR');
    const g = document.getElementById('colorG');
    const b = document.getElementById('colorB');
    
    // color index
    let colorIndex = 0;
    
    this.show = function() {
        showElement(paletteSetDiv);
        this.onPaletteArrow(0);
    }
    
    // hides the palette selection menu
    this.hide = function() {
        hideElement(paletteSetDiv);
    }
    
    // sets the preview color's background color
    this.setPreviewCol = function() {
        const col = "rgb(" + r.value + ', ' + g.value + ', ' + b.value + ')';
    
        colorPreview.style.backgroundColor = col;
    }
    
    /**
     * Called when the color input changes its value
     */
    this.onPaletteChange = function()
    {
        this.setPreviewCol();
        palette[colorIndex][0] = Number(r.value);
        palette[colorIndex][1] = Number(g.value);
        palette[colorIndex][2] = Number(b.value);
    }
    
    /**
     * Changes the color index that the user is editing
     * @param dir -1 to move left or 1 to move right
     */
    this.onPaletteArrow = function(dir) {
        colorIndex = (colorIndex + dir) & 3;
        document.getElementById('paletteTitle').innerText = "Color " + colorIndex;
        
        r.value = palette[colorIndex][0];
        g.value = palette[colorIndex][1];
        b.value = palette[colorIndex][2];
        this.setPreviewCol();
    }

    this.save = function() {
        const json = JSON.stringify(palette);
        Settings.set_core("defaultPalette", json);
        Menu.message.show("Current Palette saved");
    }

    this.load = function() {
        const pal = Settings.get_core("defaultPalette");
        if(pal)
        {
            palette = JSON.parse(pal);
            this.onPaletteArrow();
            Menu.message.show("Palette loaded.");
        } else {
            Menu.message.show("No Palette Saved", "Unable to Load");
        }

    }
}


/**
 * Checks to see if the current device has a touchscreen
 * @returns true if it does, otherwise false
 */
function hasTouchscreen() {
    return 'ontouchstart' in window;
}