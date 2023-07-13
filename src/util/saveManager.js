const SaveType = {
    SAVESTATE: "SS",
    SAV: "SAV",
};

class SaveStorage {
    /**
     *
     * @param {String} label Label text so user knows what save this is or null if unknown
     * @param {Uint8Array} data RAM data
     * @param {SaveType} type 'sav' or 'savestate'
     */
    constructor(label, data, type)
    {
        this.label = label;
        this.type = type;
        if(type == SaveType.SAV)
            this.ram = data;
        else
            this.data = data;
        this.img = null;
        this.time = SaveStorage.getFormattedTime();
    }


    populateImage() {
        this.img = canvas.toDataURL('image/jpg');
    }

    static getFormattedTime() {
        const d = new Date();
        const t = d.toDateString().match(/ .+/).toString().trim();

        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}\r${t}`;
    }

}


function saveButtonClick(name) {
    if(c.mbcHandler)
        SaveManager.save(name, c.mbcHandler.ram, c.getTitle());
    else
        Menu.message.show("ROM does not support saving.", "Could not Save", false, null, SaveManager.hide());

}



const localSaveButton = document.getElementById('localSaveButton');
const localLoadButton = document.getElementById('localLoadButton');
const popupMenu = document.getElementById('popup');
const plusButton = document.getElementById('plusButton');
const contextMenuDiv = document.getElementById('saveContextMenu');
const saveButtonDiv = document.getElementById('saveButtonDiv');

let _timer;

/**
 * Sets the number of columns of save tiles.
 */
function saveButtonDivResize() {
    const rect = saveButtonDiv.getBoundingClientRect();
    const cols = Math.max(2, rect.width / 230);

    saveButtonDiv.style.gridTemplateColumns = " 1fr".repeat(cols + 0.5);
}


function saveButtonOnTouchStart(event) {
    _timer = setTimeout(function() {
        event.clientX = event.touches[0].clientX;
        event.clientY = event.touches[0].clientY;
        SaveManager.contextMenuCallback(event);
    } , 400);

}

function saveButtonOnTouchEnd() {
    clearTimeout(_timer);
}


/**
 * Shows the pop up menu for SAVING to localStorage
 */
localSaveButton.addEventListener('click', function() {
    showElement(plusButton);

    saveButtonDiv.innerHTML = '';

    // This will only get called when the save already exists
    // brandon from the future (07/12/2023): otherwise the user must've pressed the `+` button
    SaveManager.populateSaveHTML(function() {
        if(!c.romLoaded)
            return;

        const type = SaveManager.getType(this.value);

        if(!c.mbcHandler && type !== SaveType.SAVESTATE) {
            Menu.message.show("ROM does not support saving.", "Could Not Save");
            return;
        }

        SaveManager.save(SaveManager.getSaveString(this.value), c.mbcHandler.ram, type, c.getTitle());

    });

    if(!SaveManager.showing())
        State.push(MainState.SaveMenu);
});


var SaveManager = new function() {
    this.CUR_VERSION = "0.2.0"; // version of save format

    /**
     * @param {Uint8Array} arr
     * @returns {String}
     */
    this.pack = function(arr) {
        let str = "";

        for(let i = 0; i < arr.length; i++) {
            str += hex(arr[i] & 0xFF, 2, "");
        }

        return str;
    }

    /**
     * Uncondenses a string. String must have even length
     * @param {String} str 8-bit hex formatted string
     * @returns Uint8Array
     */
    this.unpack = function(str) {
        // if we are not a string or if we are a JSON object in a string
        if(typeof str != "string" || String(str) == "" || str.indexOf("[") != -1)
            return null;

        let arr = new Uint8Array(str.length >> 1);
        for(let i = 0; i < str.length; i += 2)
        {
            const byte = `0x${str[i]}${str[i + 1]}`;

            arr[i >> 1] = Number(byte);
        }

        return arr;
    }

    /**
     *
     * @param {String} key string in localStorage
     * @returns null if not found, otherwise:
     *   - a Uint8Array of the save data IF is type SaveType.SAV
     *   - Otherwise, returns a JSON object
     */
    this.getSave = function(key) {
        const data = localStorage.getItem(key);

        if(!data)
            return null;

        const obj = JSON.parse(data);

        if(this.getType(key) == SaveType.SAV) {
            const unpacked = this.unpack(obj.ram);

            // using new, condensed format
            if(unpacked != null)
                return unpacked

            // support old save type
            return new Uint8Array(Object.values(obj.ram));
        } else {
            return obj.data;
        }
    }

    this.getType = function(key) {
        const data = JSON.parse(localStorage.getItem(key));
        return (data.type == null || data.type == SaveType.SAV) ? SaveType.SAV : SaveType.SAVESTATE;
    }

    this.getTime = function(key) {
        const data = JSON.parse(localStorage.getItem(key));
        return (data.time);
    }

    /**
     * Returns the save's real name, trimming off the ROM's name
     * @param {String} key localStorage key
     * @returns
     */
    this.getSuffix = function(key) {
        return key.slice(key.indexOf(' ') + 1)
    }

    this.addSuffix = function(key) {
        return `${key} ${c.getTitle()}`;
    }

    this.rmSuffix = function(key) {
        return key.substring(0, key.indexOf(' '));
    }

    this.getSaveString = function(key) {
        return this.rmSuffix(key).replace(/\s+/g, '');
    }

    /**
     * Saves a savefile to localStorage
     * - reports an errors
     * @param {String} name becomes the key (which will include a suffix) for localStorage
     * @param {String} ROMName optional name of the ROM
     * @param {SaveType} type either savestate or .sav format
     * @param {Uint8Array} arr array containing saveable data
     */
    this.save = function(name, arr, type, ROMName = null) {
        const data = type == SaveType.SAV ? this.pack(arr) : c.createSaveState();
        const s = new SaveStorage(ROMName, data, type);

        /**
         * Valid characters a-z 0-9 .
         */
        name = name.match(/[0-9A-Za-z\.]+/g,'').join('-').substring(0, 20);
        console.log(name);

        if(name.length === 0)
            name = "untitled";

        s.populateImage();
        let json = JSON.stringify(s);

        const performSaveToStorage = function() {
            localStorage.setItem(SaveManager.addSuffix(name), json);
            Menu.alert.show(
                `<b style='color:var(--ui-accent);'>${name}</b> saved.`,
                5000
            );

        }

        if(this.addSuffix(name) in localStorage) {

            Menu.message.show(
                `Is it okay to overwrite <b style='color:var(--ui-accent);'>${name}</b>?`,
                "Save Already Exists",
                true,
                null,
                // on succes
                performSaveToStorage
            );
        } else {
            performSaveToStorage();
        }
    }


    /**
     * @note does nothing if this menu is already open
     * @returns false if the menu is already open
     */
    this.show = function() {

        if(popupMenu.style.display === "block")
            return false;

        showElement(popupMenu);
        Themes.setSettingsBar();

        pauseEmulation();

        showElementFadeIn(popupMenu);

        window.addEventListener('resize', saveButtonDivResize);
        saveButtonDivResize();
    }


    this.hide = function() {
        hideElementFadeOut(popupMenu);

        resumeEmulation();

        Themes.setStatusBar();

        // now we must delete buttons from popup menu
        saveButtonDiv.innerHTML = "";
        window.removeEventListener('resize', saveButtonDivResize);
    }


    this.showing = function() {
        return popupMenu.style.display != "none" && popupMenu.style.display != '';
    }


    // @todo fix this is the absolute shittiest fricking function you've everwritten
    // SO DAMN MANY HARD CODED NUMBERS
    // WTF ARE THESE NAMES!!!
    this.contextMenuCallback = function(event) {
        const key = this.value;
        const menuItems = contextMenuDiv.children[0].children;

        // hides the context menu if another right click occurs
        contextMenuDiv.oncontextmenu = contextMenuDiv.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideElement(contextMenuDiv);
        }

        event.preventDefault();
        // set position
        contextMenuDiv.children[0].style.left = event.clientX + "px";
        contextMenuDiv.children[0].style.top = event.clientY + "px";

        for(let i = 0; i < menuItems.length; i++) {
            menuItems[i].value = key;
        }

        // delete
        contextMenuDiv.children[0].children[3].onclick = SaveManager.deleteSelf;

        // rename
        contextMenuDiv.children[0].children[2].onclick = function() {
            const m = new PromptMenu("New name", "Name", /[0-9A-Za-z]+/g, 20, (v) => {
                const sav = localStorage.getItem(key);
                const romName = key.slice(key.indexOf(' ') + 1);

                if(`${v} ${romName}` in localStorage) {
                    Menu.alert.show("Name already exists", 5000);
                    return false;
                }

                localStorage.setItem(`${v} ${romName}`, sav);

                delete localStorage[key]; // remove old

                // this is jank but we must mainly hide promptmenu so that we can
                //  force the proper order
                // PromptMenu.hide();
                localSaveButton.click(); // redraw saves
                return true;
            });

            m.show();
        }

        // details
        contextMenuDiv.children[0].children[0].onclick = function() {
            const sav = SaveManager.getSave(key);
            let str = `Name: ${SaveManager.getSaveString(key)}<br>
            Game: ${SaveManager.getSuffix(key)}<br>
            Type: ${SaveManager.getType(key) == SaveType.SAV ? ".sav" : "savestate"}<br>
            Date: ${SaveManager.getTime(key)}`;

            if(SaveManager.getType(key) == SaveType.SAV)
                str += `<br>Size: ${sav.length} bytes`
            Menu.message.show(
                 str,
                "Details"
            );
        }

        // export
        contextMenuDiv.children[0].children[1].onclick = function() {
            const key = this.value;

            // cannot save if savestate
            if(SaveManager.getType(key) != SaveType.SAV)
            {
                Menu.message.show("This save cannot be exported");
                return;
            }

            const name = SaveManager.getSaveString(key);
            const data = SaveManager.getSave(key);

            // if we are mobile or embedded app on iOS, we cannot download files
            if(window.navigator.standalone) {
                let str = SaveManager.pack(data);
                const json = JSON.stringify(new SaveStorage(name, str, SaveType.SAV));

                copyClipMenu(new String(json));
            } else {
                downloadSave(name, data);
            }

        }

        showElement(contextMenuDiv, 'flex');
    }


    this.populateSaveHTML = function(onLabelClick) {
        const saveButtonDiv = document.getElementById('saveButtonDiv');
        const keys = Object.keys(localStorage);
        const romName = c.getTitle();
        let hasSaves = false;

        for(let i in keys) {
            // some settings should not be shown
            if(Settings.isSetting(keys[i]))
                continue;

            const obj = JSON.parse(localStorage[keys[i]]);

            if(obj.label != null && c.romLoaded && romName != obj.label)
                continue;

            const btn = document.createElement("button");
            btn.className = "menubtn save-menu-button";
            btn.type = "button";
            btn.innerHTML = `
                <img width="160" height="144" class="save-menu-img">
                <a class="save-menu-button-title">
                    ${this.getSaveString(keys[i])}
                    <code class="save-state-icon" style="color: ${obj.type == SaveType.SAVESTATE ? 'gold' : 'lightblue'};">${obj.type || "SAV"}</code>
                </a>
            `;
            btn.value = keys[i];
            btn.onclick = onLabelClick;

            if('oncontextmenu' in window) {
                btn.oncontextmenu = this.contextMenuCallback;
            } else {
                // oncontext menu unavaiable for damn iOS devices :'(
                btn.addEventListener('touchstart', saveButtonOnTouchStart);
                btn.addEventListener('touchend', saveButtonOnTouchEnd);
            }

            const can = btn.getElementsByTagName('img')[0];

            if(obj.img) {
                const im = decodeURI(obj.img);
                can.src = im;
            }


            saveButtonDiv.appendChild(btn);

            hasSaves = true;
        }

        if(!hasSaves) {
            saveButtonDiv.innerHTML = `<p style="text-align: center; grid-column: 1 / -1;">no saves</p>`;
        } else {
            const div = document.createElement('div');
            div.className = 'save-menu-padding';
            saveButtonDiv.appendChild(div);
        }
    }

    /**
     * @returns an array of keys that contain the rom name
     */
    this.getSavesFromName = function(romName) {
        const keys = Object.keys(localStorage);
        let out = [];
        for(let i in keys) {
            if(Settings.isSetting(keys[i]))
                continue;

            const e = JSON.parse(localStorage.getItem(keys[i]));

            if(e['label'] === romName)
                out.push(keys[i]);
        }

        return out;
    }


    /**
     * Called by the `+` button in `id=popup`
     */
    this.addSave = function() {
        const m = new PromptMenu("Save Name", "Name", /[0-9A-Za-z]+/g, 12, (v, state) => {
            const type = state.save_type.checked == ".sav" ? SaveType.SAV : SaveType.SAVESTATE;
            if(v.length == 0)
                return;

            if(!c.romLoaded) {
                Menu.message.show("Load a ROM before saving.","No ROM Loaded");
                return;
            }

            if(!c.mbcHandler && type == SaveType.SAV) {
                Menu.alert.show("This ROM only supports save states.");
                return false;
            }

            this.save(v, c.mbcHandler?.ram ?? null, type, c.getTitle());

            localSaveButton.click(); // redraw saves
        }, null, null, "save", "import from device", ()=> {
            document.getElementById('inputSaveFile').click();
        });

        m.addChoices([".sav", "Save State"], "save_type", "Format");
        m.setInfo(
            `<b style="font-size: 1.1rem;" >Save Types:</b>
            <div class="div-separator">
                <b>Save States</b> work by storing the current state of the emulator.
                These saves are larger in size but allows any ROM to save.
                <b style="font-size: 0.85em;">Note: these are less stable than the .sav format</b>
                <br>
                <br>
                <b>.sav</b> works by storing the Gameboy's current RAM. This is a stable way to save data but requires saving in-game first.
                Not all ROMs support this method (in instances without RAM)
            </div>
            `
        );

        m.show();
    }

    /**
     * Attach to button event to delete a localStorage save.
     * @param {ButtonEvent} e
     */
    this.deleteSelf = function(e) {
        key = this.value
        Menu.message.show(
            `Delete <a style="color:var(--ui-accent);">${SaveManager.getSaveString(key)}</a>?`,
            "Are You Sure?",
            true,
            null,
            function() {
                if(_delKey)
                    delete localStorage[_delKey];

                _delKey = null;

                // visually delete item.
                for(let i in saveButtonDiv.children) {
                    if(saveButtonDiv.children[i].value == key) {
                        saveButtonDiv.removeChild(saveButtonDiv.children[i]);
                        break;
                    }
                }

            }
        );

        _delKey = key;

    }

    /**
    * Loads a key into MBC ram
    * @param {String} key key name in localStorage
    */
   this.injectLocalStorage = function(key) {
        // loading from localStorage
        const data = SaveManager.getSave(key);
        const type = SaveManager.getType(key);

        if(!data) {
            // this should never be called
            Menu.message.show(`Could not find <b style="color:green;">${key}</b>.`, "Internal Error", false, null, State.pop);
            return;
        }

        State.pop();

        if(type == SaveType.SAV) {
            MBC1.useSaveData(data);
        } else {
            if(c.romLoaded) {
                if(!c.loadSaveState(data)) {
                    Menu.message.show(`Save state is incompatible with the current emulator version.`, `Save state is out of date`);
                    return;
                }
            } else {
                Menu.message.show(`Save States cannot be loaded until a ROM is running.`, `Unable to Load`);
                return;
            }
        }

        Menu.alert.show(`Loaded <b style="color: var(--ui-accent);">${this.getSaveString(key)}</b>.`);

   }


    /**
    * Called when the `importTextButton` button is pressed
    */
    this.importJSON = function() {
        const m = new PromptMenu("Import JSON", "JSON string", /.+/g, 9999999, (v) => {
            let data;

            try {
                data = JSON.parse(v.toLowerCase());
            } catch {
                Menu.message.show("Could not import data.", "Invalid JSON");
                return;
            }

            if(!data || !('label' in data) || !('ram' in data)) {
                Menu.message.show("Could not import data.", "Invalid JSON");
                return;
            }

            const ram = SaveManager.unpack(data["ram"]);
            const name = data['label'].toUpperCase();

            this.save(name, ram, SaveType.SAV, name);
        });

        m.setInfo(
            `<b>Importing JSON Data:</b><br>
            <div class="div-separator">
                Some browsers do not allow for the downloading of files.
                In these cases, save files will be exported as a JSON object.
                Although these objects are incompatible with other emulators,
                it allows for cross-browser transfers.
            </div>
            `
        );

        m.show();
    }
}


/**
 * @returns NodeList
 */
function getDeleteButtons() {
    return document.getElementsByName("deleteButton");
}

/**
 * Load from local storage
 * - Creates a list of buttons that correspond to all localStorage saves
 */
localLoadButton.addEventListener('click', function() {

    // prevent the menu from reappearing if it is already active
    if(popupMenu.style.display == "block")
        return;

    hideElement(plusButton);

    SaveManager.populateSaveHTML(function() {
        const key = this.value;
        SaveManager.injectLocalStorage(key);
    });

    State.push(MainState.SaveMenu);
})

/**
 * Downloads the current MBC's RAM to a desktop
 *  - only works from a destkop web browser
 * @param {String} name file name
 * @param {Uint8Array} data
 */
function downloadSave(name, data){
    const a = document.getElementById('saveA');

    // save file
    let blob = new Blob([data]);
    a.href = window.URL.createObjectURL(blob, {type: "application/pdf"});
    a.download = name + ".sav";
    a.click();
}