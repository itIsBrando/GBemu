const SaveType = {
    SAVESTATE: "SS",
    SAV: "SAV",
};

class SaveStorage {
    static enableImage = false;
    /**
     * 
     * @param {String} label Label text so user knows what save this is
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
        if(!SaveStorage.enableImage)
            return;
        
        this.img = canvas.toDataURL('image/jpg');
    }

    static getFormattedTime() {
        const d = new Date();
        const t = d.toDateString().match(/ .+/).toString().trim();

        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}\r${t}`;
    }

    static set_button_text() {
        const PrevImgButton = document.getElementById('PrevImgButton');

        PrevImgButton.innerHTML = SaveStorage.enableImage ? "yes" : "no";
    }

    static togglePreview() {
        SaveStorage.enableImage = !SaveStorage.enableImage;

        Settings.set_core("savePreviews", SaveStorage.enableImage);
        SaveStorage.set_button_text();
    }

    static init() {
        SaveStorage.enableImage = Settings.get_core("savePreviews", "true") == "true";
        SaveStorage.set_button_text();
    }
}


function saveButtonClick(name) {
    if(c.mbcHandler)
        SaveManager.save(name, c.mbcHandler.ram, c.readROMName());
    else
        Menu.message.show("ROM does not support saving.", "Could not Save", false, null, SaveManager.hide());
    
}


function _canSave()
{
    const type = SaveManager.getType(_delKey);
    delete localStorage[_delKey];
    SaveManager.save(SaveManager.getSaveString(_delKey), c.mbcHandler.ram, type, c.readROMName());

    _delKey = null;
    SaveManager.hide();
}


const localSaveButton = document.getElementById('localSaveButton');
const localLoadButton = document.getElementById('localLoadButton');
const popupMenu = document.getElementById('popup');
const plusButton = document.getElementById('plusButton');
const saveEditButton = document.getElementById('saveEditButton');
const saveButtonDiv = document.getElementById('saveButtonDiv');

/**
 * Shows the pop up menu for saving to localStorage
 */
localSaveButton.addEventListener('click', function() {
    hideElement(saveEditButton);
    showElement(plusButton);
    
    saveButtonDiv.innerHTML = '';
    
    // This will only get called when the save already exists
    SaveManager.populateSaveHTML(function() {
        if(c.mbcHandler && c.romLoaded) {
            Menu.message.show(
                `Is it okay to overwrite <b style='color:green;'>${SaveManager.getSaveString(this.value)}</b>?`,
                "Save Already Exists",
                true,
                null,
                _canSave
            );
            
            _delKey = this.value; // save for `_canSave`. this is a poor implementation
        } else {
            Menu.message.show("No ROM is loaded or ROM does not support saving.", "Could Not Save");
        }
    });

    if(!SaveManager.show())
        return;
});


var SaveManager = new function() {
    this.CUR_VERSION = "0.1.0"; // version of save format
    
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


    this.getSuffix = function(key) {
        const match = key.match(/ .*/);
        return match ? match[0] : '';
    }

    this.addSuffix = function(key) {
        return key + ' ' + c.readROMName();
    }

    this.rmSuffix = function(key) {
        return key.replace(/ .*/, '');
    }

    this.getSaveString = function(key) {
        return this.rmSuffix(key);
    }

    /**
     * Saves a savefile to localStorage
     * - reports an errors
     * @param {String} name becomes the key (which will include a suffix) for localStorage
     * @param {String} ROMName optional name of the ROM
     * @param {SaveType} type either savestate or .sav format
     * @param {Uint8Array} arr array containing saveable data
     */
    this.save = function(name, arr, type, ROMName = "import") {
        const data = type == SaveType.SAV ? this.pack(arr) : c.createSaveState();
        const s = new SaveStorage(ROMName, data, type);

        s.populateImage();
        let json = JSON.stringify(s);

        localStorage.setItem(this.addSuffix(name), json);
        Menu.alert.show(
            `<b style='color:green;'>${name}</b> saved successfully. You can safely close this webpage`,
            5000
        );
    }

    
    /**
     * @note does nothing if this menu is already open
     * @returns false if the menu is already open
     */
    this.show = function() {
        if(popupMenu.style.display == "block")
            return false;
        
        showElement(popupMenu);
        Themes.setSettingsBar();

        pauseEmulation();

    }


    this.hide = function() {
        Themes.setStatusBar();
        
        hideElement(popupMenu);

        resumeEmulation();

        // now we must delete buttons from popup menu
        saveButtonDiv.innerHTML = "";
    }

    
    this.showing = function() {
        return popupMenu.style.display != "none";
    }

    this.populateSaveHTML = function(onLabelClick) {
        const saveButtonDiv = document.getElementById('saveButtonDiv');
        const keys = Object.keys(localStorage);
        const romName = c.readROMName();
        let hasSaves = false;
    
        for(let i in keys) {
            // some settings should not be shown
            if(Settings.isSetting(keys[i]))
                continue;

            const obj = JSON.parse(localStorage[keys[i]]);

            if(romName != null && romName != obj.label)
                continue;
            
            const btn = document.createElement("button");
            btn.className = "menubtn save-menu-button";
            btn.type = "button";
            btn.innerHTML = `
                <img width="160" height="144" style="grid-row: 1 / 3;"></img>
                <h2>${this.getSaveString(keys[i])}</h2>
                <button type="button" class='x-btn x-btn-animated' style="background-color:orangered;" name='deleteButton'>&times;</button>
                <code style="font-size: 0.75rem; padding-right: 0.75rem;">${romName == null ? obj.label : obj.time}</code>
                <code style="font-size: 0.6rem; border-radius: 2px; background-color:black; color: ${obj.type == SaveType.SAVESTATE ? 'gold' : 'lightblue'}; width:100%;">${obj.type || "SAV"}</code>
            `;
            btn.value = keys[i];
            btn.onclick = onLabelClick;
            const can = btn.getElementsByTagName('img')[0];

            if(obj.img) {
                const im = decodeURI(obj.img);
                can.src = im;
            }


            saveButtonDiv.appendChild(btn);
    
            hasSaves = true;
        }
    
        if(!hasSaves) {
            saveButtonDiv.innerHTML = `<code>no files saved</code>`;
        } else {
            // Add an onclick event for each delete button
            const btns = getDeleteButtons();
    
            btns.forEach(function(curVal) {
                curVal.onclick = SaveManager.deleteSelf;
            });

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
        const m = new PromptMenu("Save Name", "Name", /[0-9A-Za-z]+/g, 20, (v, state) => {
            const type = state.save_type.checked == ".sav" ? SaveType.SAV : SaveType.SAVESTATE;
            if(v.length == 0)
                return;
            
            if(!c.romLoaded) {
                Menu.message.show("Load a ROM before saving.","No ROM Loaded");
                return;
            }

            if(!c.mbcHandler && type == SaveType.SAV) {
                Menu.message.show("ROM does not support saving.", "Could not Save");
                return;
            }

            
            this.save(v, c.mbcHandler?.ram ?? null, type, c.readROMName());

            localSaveButton.click(); // redraw saves
        });

        m.addChoices([".sav", "Save State"], "save_type", "Save Type:");
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
        e.stopPropagation();
        key = this.parentElement.value
        Menu.message.show(
            `Delete <b style="color:green;">${SaveManager.getSaveString(key)}</b>?`,
            "Are You Sure?",
            true,
            null,
            function() {
                if(_delKey)
                    delete localStorage[_delKey];
            
                _delKey = null;
                SaveManager.hide();
                saveEditButton.innerHTML = "edit";
                localLoadButton.click();
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
   
       if(!data)
           Menu.message.show(`Could not find <b style="color:green;">${key}</b>.`, "Internal Error", false, null, SaveManager.hide);
       else {
           SaveManager.hide();
           if(type == SaveType.SAV) {
               MBC1.useSaveData(data);
           } else {
               if(c.romLoaded)
                   c.loadSaveState(data);
                else {
                    Menu.message.show(`Cannot load Save State until a ROM is loaded.`, `Load ROM`);
                    return;
                }
           }

           Menu.alert.show(`Loaded <b style="color:green;"> ${this.getSaveString(key)}</b>.`);
       }
   }


    /**
    * Called when the `importTextButton` button is pressed
    */
    this.importJSON = function() {
        const m = new PromptMenu("JSON Save", "JSON string", /.+/g, 9999999, (v) => {
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


saveEditButton.addEventListener('click', function() {
    const isEditing = this.innerHTML == "edit";

    this.innerHTML = isEditing == true ? "done" : "edit";

    const btns = getDeleteButtons();
    
    btns.forEach(function(e) {
        if(isEditing)
            e.classList.remove('x-btn-animated');
        else
            e.classList.add('x-btn-animated');
    });
});


/**
 * Load from local storage
 * - Creates a list of buttons that correspond to all localStorage saves
 */
localLoadButton.addEventListener('click', function() {

    // prevent the menu from reappearing if it is already active
    if(popupMenu.style.display == "block")
        return;

    // hide text entry
    showElement(saveEditButton);
    hideElement(plusButton);

    SaveManager.populateSaveHTML(function() {
        const key = this.value;
        SaveManager.injectLocalStorage(key);
    });
    
    SaveManager.show();
})


const exportSaveButton = document.getElementById('exportSaveButton');

// save file to computer
exportSaveButton.onclick = function() {
    if(!c.mbcHandler || c.mbcHandler.ramSize == 0)
    {
        Menu.message.show("This ROM does not have a RAM chip", "No RAM");
        return;
    }

    // do saving

    // if we are mobile or embeded app, we cannot download files
    if(window.navigator.standalone) {
        let str = SaveManager.pack(c.mbcHandler.ram);
        const data = JSON.stringify(new SaveStorage(c.readROMName(), str, SaveType.SAV));

        copyClipMenu(new String(data));
    } else {
        downloadSave();
    }

};



/**
 * Downloads the current MBC's RAM to a desktop
 *  - only works from a destkop web browser
 */
function downloadSave(){
    const name = c.readROMName() + ".sav"
    const a = document.getElementById('saveA');

    // save file
    let blob = new Blob([c.mbcHandler.ram]);
    a.href = window.URL.createObjectURL(blob);
    a.download = name;
    a.click();
}