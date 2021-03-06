// desktop needs innerWidth
var getWidth = function() {
    return document.documentElement.clientWidth;
}

var getHeight = function() {
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
 * Reads the game title embeded inside the ROM
 * @returns String
 */
function readROMName() {
    let str = "";
    let i = 0;

    if(c.mem.rom[0x134] == 0)
        return null;

    do {
        str += String.fromCharCode(c.mem.rom[0x134 + i]);
        i++;
    } while(i <= 16 && c.mem.rom[0x134 + i] != 0);
    return str;
}

/**
 * Converts a value into a hexidemical string
 * @param {any} v 
 */
function hex(v) {
    return "0x" + v.toString(16).toUpperCase();
}


/**
 * Shows a menu to prompt the user to save text
 * - must be called from an event
 * @param {String} text string to save
 */
function copyClipMenu(text) {
    const elem = document.getElementById('copyTextInput');
    const menuDiv = document.getElementById('textCopyPopup');
    elem.value = text;
    elem.focus();
    console.log("show clipboard menu");

    // show menu
    menuDiv.style.display = 'block';
    menuDiv.style.opacity = "1";
}


/**
 * Copies to clipboard
 * - must be called by a reputable event
 * - copies text inside of 'copyTextInput'
 */
function clipboardCopy() {
    const elem = document.getElementById('copyTextInput');
    
    elem.readonly = false;
    elem.contentEditable = true;
    elem.select();

    const range = document.createRange();
    range.selectNodeContents(elem);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    
    elem.setSelectionRange(0, 999999);
    
    document.execCommand("copy");
    
    // hide menu
    document.getElementById('textCopyPopup').style.display = 'none';

    // because the size is huge, we will empty the text inside it
    elem.value = "";
    
    // show success message
    showMessage("Copied to clipboard", "Success");
}


/**
 * Shows the information of a ROM if it is loaded
 */
function showROMInfo() {
    if(!c.isRunning)
    {
        showMessage("Load a game first.", "No ROM loaded");
        return;
    }

    showMessage(
        '<b style="color:deepskyblue">ROM Name:</b> ' + readROMName() +
        '<br><b style="color:deepskyblue">MBC Type:</b> ' + MemoryControllerText[c.mem.rom[0x0147]] +
        '<br><b style="color:deepskyblue">GBC Mode: </b>' + (c.cgb ? "yes" : "no") +
        '<br><b style="color:deepskyblue">ROM Size:</b> ' + (c.mbcHandler ? c.mbcHandler.rom.length + " bytes": "32kb") +
        '<br><b style="color:deepskyblue">RAM Size:</b> ' + (c.mbcHandler ? c.mbcHandler.ram.length + " bytes": "none") +
        '',
        "ROM Info v1.0"
    );
}


const messageDiv = document.getElementById('messageID');
const messageConfirm = document.getElementById('messageConfirm');
const shadowOverlay = document.getElementById('shadowOverlay');

messageConfirm.onclick = hideMessage;

/**
 * Shows a message to the user
 * @param {String} string message to tell
 * @param {String?} title string to display at the top
 */
function showMessage(string, title) {
    const messageContent = document.getElementById('messageContent');
    const messageHeader = document.getElementById('messageHeader');
    messageContent.innerHTML = string;
    messageHeader.textContent = title || "ALERT";
    // show 
    if(messageDiv.style.display == "block")
        FrontEndMenu.hideOverlay();
    messageDiv.style.display = "block";
    messageConfirm.focus();
    // dark the content below to force user to dismiss current message
    FrontEndMenu.showOverlay();

    messageConfirm.onkeydown = function(event)
    {
        console.log(event.key)
        if(event.key.toLowerCase() == "enter")
        {
            messageConfirm.click();
        }
    }
    
    messageDiv.style.opacity = "1";
}


/**
 * Hides the message dialog from `showMessage`
 */
function hideMessage() {
    // hide
    messageDiv.style.opacity = "0";
    setTimeout(function() {
        messageDiv.style.display = "none";
    }, 600);

    FrontEndMenu.hideOverlay();
}


var FrontEndMenu = new function() {
    let overlays = 0;

    this.showOverlay = function() {
        overlays++;
        shadowOverlay.style.display = 'block';
    }

    this.hideOverlay = function() {   
        if(--overlays <= 0)
        {
            shadowOverlay.style.display = 'none';
            overlays = 0;
        }
    }

    this.getO = function() {
        return overlays;
    }
}


var FrontEndPalette = new function() {
    // color palette
    const paletteSetDiv = document.getElementById('paletteSetDiv');
    const colorPreview = document.getElementById('colorPreview');
    
    // color elements
    const r = document.getElementById('colorR');
    const g = document.getElementById('colorG');
    const b = document.getElementById('colorB');
    
    // color index
    let colorIndex = 0;    
    
    this.showPaletteMenu = function() {
        FrontEndMenu.showOverlay();
        paletteSetDiv.style.display = 'block';
        this.onPaletteArrow(1);
    }
    
    // hides the palette selection menu
    this.hidePaletteMenu = function() {
        paletteSetDiv.style.display = 'none';
        FrontEndMenu.hideOverlay();
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
        localStorage.setItem("__core_defaultPalette", json);
        showMessage("Current Palette saved");
    }

    this.load = function() {
        const pal = localStorage.getItem("__core_defaultPalette");
        if(pal)
        {
            palette = JSON.parse(pal);
            this.onPaletteArrow();
            showMessage("Palette loaded.");
        } else {
            showMessage("No Palette Saved", "Unable to Load");
        }
    }
}


var FrontEndKeyBinding = new function() {
    const changeKeybinding = document.getElementById('changeKeybinding');
    const keyBindingDiv = document.getElementById('keyBindingDiv');
    
    // used by our keyboard event
    this.isAssigning = false;    
    this.bindings = {
        "s" : "A",
        "a" : "B",
        "enter" : "START",
        "shift" : "SELECT",
        "arrowleft" : "LEFT",
        "arrowright" : "RIGHT",
        "arrowup" : "UP",
        "arrowdown" : "DOWN",
        "f" : "FAST"
    };

    this.modifyingButton = "";
    
    // shows the keybinding menu
    this.show = function() {
        FrontEndMenu.showOverlay();
        keyBindingDiv.style.display = 'block';
        keyBindingDiv.focus();

        this.fillButtonText();
    }

    this.fillButtonText = function() {
        // initialize button texts
        const keywordbuttons = keyBindingDiv.getElementsByClassName("keypad-binding-btn")
        const strings = [
            "A button",
            "B button",
            "SELECT button",
            "START button",
            "UP",
            "DOWN",
            "LEFT",
            "RIGHT",
            "FAST FORWARD"
        ];
        const keyboardBindings = Object.keys(this.bindings);

        const bindingsValues = Object.values(this.bindings);
        for(let i = 0; i < keywordbuttons.length; i++)
        {
            /* this complicated shiz idek how it works
                just don't touch it!!
                the order of `this.bindings` changes whenever a key is reassigned,
                 so we must ensure that everything lines up in the same order
            */
            const index = bindingsValues.findIndex(txt => txt == strings[i].split(' ')[0]);
            keywordbuttons[i].innerHTML = strings[i] + "<b> " + keyboardBindings[index] + "</b>";
        }
        
    }
    
    this.hide = function() {
        FrontEndMenu.hideOverlay();
        this.isAssigning = false;
        keyBindingDiv.style.display = 'none';
    }

    // buttonName is the string representation of the gameboy button that should be changed. Ex: `A`, `SELECT`, `LEFT`
    this.assign = function(buttonName) {
        this.isAssigning = true;
        this.modifyingButton = buttonName;
    }

    /**
     * @param keyName is the string representation of the keyboard key
     * for some reason this function gets called 8 times from the keyboard event but whatever
    */
    this.setKey = function(keyName) {
        if(!this.isAssigning)
            return;
        this.isAssigning = false;

        Object.keys(this.bindings).forEach((btn, index) => {
            if(this.bindings[btn] == this.modifyingButton)
                delete this.bindings[btn];
                this.bindings[keyName] = this.modifyingButton;
                showMessage(" " + this.modifyingButton + " assigned to " + keyName, "Key rebound.");
                this.fillButtonText();
                return;
        });
    }
}


/**
 * Checks to see if the current device has a touchscreen
 * @returns true if it does, otherwise false
 */
function hasTouchscreen() {
    return 'ontouchstart' in window;
}


// toggle between emulating in DMG mode or attempting CGB mode
const toggleDMGMode = document.getElementById('toggleDMGMode');

toggleDMGMode.onclick = function() {
    if(c.forceDMG == false)
    {
        toggleDMGMode.innerText = "Force DMG: yes";
    } else {
        toggleDMGMode.innerText = "Force DMG: no";
    }

    c.forceDMG = !c.forceDMG;

    if(c.isRunning)
        showMessage("Reload the ROM to see an affect.", "Emulation Mode Changed");

}