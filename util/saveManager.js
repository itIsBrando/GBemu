
class SaveStorage {
    /**
     * 
     * @param {String} label Label text so user knows what save this is
     * @param {Uint8Array} data RAM data
     */
    constructor(label, data)
    {
        this.label = label;
        this.ram = data;
    }
}

function _canSave()
{
    if(_delKey)
    {
        localStorage.setItem(_delKey["key"], _delKey["data"]);
        showMessage("<b style='color:green;'>" + _delKey["key"] + "</b> saved successfully. You can safely close this webpage", "Success");
    }

    _delKey = null
}


const localSaveButton = document.getElementById('localSaveButton');
const localLoadButton = document.getElementById('localLoadButton');
const popupMenu = document.getElementById('popup');
const plusButton = document.getElementById('plusButton');
const saveEditButton = document.getElementById('saveEditButton');
const saveButtonDiv = document.getElementById('saveButtonDiv');


/**
 * Shows the popup menu
 * - does nothing if this menu is already open
 * @param {String} title header string
 * @param {String} buttonText text to display to the user
 * @returns false if the menu is already open
 */
function showPopupMenu(title, buttonText) {
    if(popupMenu.style.display == "block")
        return false;
    
    showElement(popupMenu);
    FrontEndMenu.showOverlay();
}


function hidePopupMenu() {
    hideElement(popupMenu);
    FrontEndMenu.hideOverlay();

    // now we must delete buttons from popup menu
    saveButtonDiv.innerHTML = "";
}


/**
 * Shows the pop up menu for saving to localStorage
 */
localSaveButton.addEventListener('click', function() {
    hideElement(saveEditButton);
    showElement(plusButton);
    
    SaveManager.populateSaveHTML(function() {
        hidePopupMenu();

        if(c.mbcHandler)
            SaveManager.save(this.value, c.mbcHandler.ram, readROMName());
        else
        showMessage("ROM does not support saving.", "Could not Save");
        
    });

    if(!showPopupMenu("Save Name", "Save"))
        return;
});


/**
 * Populates the text form with the name of a localStorage key
 */
const pasteLabel = function() {
    SaveManager.injectLocalStorage(this.value);
    hidePopupMenu();
}


function hideElement(e) {
    e.style.display = 'none';
}

function showElement(e, style = 'block') {
    e.style.display = style;
}



var SaveManager = new function() {
    /**
     * 
     * @param {Uint8Array} arr 
     */
    this.pack = function(arr) {
        let str = "";

        for(let i = 0; i < arr.length; i++)
        {
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
     * @returns null if not found, otherwise a Uint8Array of the save data
     */
    this.getSave = function(key) {
        const data = localStorage.getItem(key);
    
        if(!data)
            return null;
            
        const obj = JSON.parse(data);
        const arr = new Array();

        const unpacked = this.unpack(obj.ram);

        // using new, condensed format
        if(unpacked != null)
            return unpacked
    
        // add each element to our array
        for(let i in obj.ram)
        {
            arr.push(obj.ram[i]);
        }
    
        return new Uint8Array(arr);
    }


    /**
     * Saves a savefile to localStorage
     * - reports an error if ROM does not have external RAM
     * - does not warn about overriding an existing savefile
     * @param {String} key becomes the key for localStorage
     * @param {String} ROMName optional name of the ROM
     * @param {Uint8Array} arr array containing saveable data
     */
    this.save = function(key, arr, ROMName = "import") {
        const ram = SaveManager.pack(arr);
        let data = JSON.stringify(new SaveStorage(ROMName, ram));

        // prevent user from overwriting a savefile unintentionally
        if(key in localStorage)
        {
            showMessage(
                "Is it okay to overwrite <b style='color:green;'>" + key + "</b>?",
                "Save Already Exists",
                true,
                null,
                _canSave
            );
            _delKey = {key, data};
        } else {
            localStorage.setItem(key, data);
            showMessage(`<b style='color:green;'>${key}</b> saved successfully. You can safely close this webpage`, "Success");
        }

    }


    this.populateSaveHTML = function(onLabelClick) {
        const saveButtonDiv = document.getElementById('saveButtonDiv');

        const keys = Object.keys(localStorage);
        let hasSaves = false;
    
        for(let i in keys) {
            // some settings should not be shown
            if(keys[i].startsWith("__core_"))
                continue;
            
            const btn = document.createElement("button");
            const obj = JSON.parse(localStorage[keys[i]]);
            btn.className = "menubtn";
            btn.style.width = "100%";
            btn.innerHTML = `<h3>${keys[i]}</h3><code style="font-size:x-small;">${obj.label}</code>` + "<button class='x-btn' style='visibility:hidden;' name='deleteButton'>&times;</button>";
            btn.value = keys[i];
            btn.onclick = onLabelClick;
            saveButtonDiv.appendChild(btn);
    
            hasSaves = true;
        }
    
        if(!hasSaves) {
            saveButtonDiv.innerHTML = "<b>NO FILES SAVED</b>"
        } else {
            // Add an onclick event for each delete button
            const btns = getDeleteButtons();
    
            btns.forEach(function(curVal) {
                curVal.onclick = SaveManager.deleteSelf;
            })
        }
        
    
    }


    /**
     * Called by the `+` button in `id=popup`
     */
    this.addSave = function() {
        const m = PromptMenu.new("Save Name", "Title", /\w+/g, 20, (v) => {
            if(v.length == 0)
                return;

            if(!c.mbcHandler) {
                showMessage("ROM does not support saving.", "Could not Save");
                return;
            }
            
            this.save(v, c.mbcHandler.ram, readROMName());
            hidePopupMenu();
        });

        PromptMenu.show(m);
    }

    /**
     * Attach to button event to delete a localStorage save.
     * @param {ButtonEvent} e 
     */
    this.deleteSelf = function(e) {
        e.stopPropagation();
        key = this.parentElement.value
        showMessage(
            `Delete <b style="color:green;">${key}</b>?`,
            "Are You Sure?",
            true,
            null,
            function() {
                if(_delKey)
                    delete localStorage[_delKey];
            
                _delKey = null;
                hidePopupMenu();
                localLoadButton.click();
                saveEditButton.innerHTML = "edit";
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
   
       if(!data)
           showMessage("Could not find <b style=\"color:green;\">" + key + "</b> in local storage.", "Error");
       else
       {
           MBC1.useSaveData(data);
           showMessage("Loaded <b style=\"color:green;\">" + key + "</b>.", "Completed");
       }
   }


    /**
    * Called when the `importTextButton` button is pressed
    */
    this.importJSON = function() {
        const m = PromptMenu.new("JSON Save", "JSON string", /.+/g, null, (v) => {
            let data;

            try {
                data = JSON.parse(v.toLowerCase());
            } catch {
                showMessage("Could not import data.", "Invalid JSON", );
                return;
            }

            if(!data || !('label' in data) || !('ram' in data)) {
                showMessage("Could not import data.", "Invalid JSON", );
                return;
            }

            const ram = SaveManager.unpack(data["ram"]);
            const name = data['label'].toUpperCase();
            
            this.save(name, ram, name);
        });

        PromptMenu.show(m);
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
            e.style.visibility = 'visible';
        else
            e.style.visibility = 'hidden';
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

    SaveManager.populateSaveHTML(pasteLabel);
    // iterate through each value in `localStorage`
    //  and create a button for each entry
    showPopupMenu("Save Name", "Load");
})


const exportSaveButton = document.getElementById('exportSaveButton');

// save file to computer
exportSaveButton.onclick = function() {
    if(!c.mbcHandler || c.mbcHandler.ramSize == 0)
    {
        showMessage("This ROM does not have a RAM chip", "No RAM");
        return;
    }

    // do saving

    // if we are mobile or embeded app, we cannot download files
    if(true || window.navigator.standalone) {
        let str = SaveManager.pack(c.mbcHandler.ram);
        const data = JSON.stringify(new SaveStorage(readROMName(), str));

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
    const name = readROMName() + ".sav"
    const a = document.getElementById('saveA');

    // save file
    let blob = new Blob([c.mbcHandler.ram]);
    a.href = window.URL.createObjectURL(blob);
    a.download = name;
    a.click();
}