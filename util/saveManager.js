
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


/**
 * Saves a savefile to localStorage
 * - reports an error if ROM does not have external RAM
 * - does not warn about overriding an existing savefile
 * @param {String} key name of save
 */
function saveToLocal(key) {
    if(c.mbcHandler)
    {
        const ram = c.mbcHandler.ram;
        let data = JSON.stringify(new SaveStorage(readROMName(), ram));

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
            showMessage("<b style='color:green;'>" + key + "</b> saved successfully. You can safely close this webpage", "Success");
        }
    } else {
        showMessage("ROM does not support saving.", "Saving Error");
    }
}


/**
 * Reads a locally stored save
 * @param {String} key name of save
 */
function readFromLocal(key) {
    const data = localStorage.getItem(key);
    if(!data)
        return null;
    const obj = JSON.parse(data);
    const arr = new Array();

    // add each element to our array
    for(let i in obj.ram)
    {
        arr.push(obj.ram[i]);
    }

    return new Uint8Array(arr);
}


const localSaveButton = document.getElementById('localSaveButton');
const localLoadButton = document.getElementById('localLoadButton');
const localSaveName = document.getElementById('localSaveName');
const popupMenu = document.getElementById('popup');
const popupSubmitButton = document.getElementById('submitSaveName');
const saveEditButton = document.getElementById('saveEditButton');


localSaveName.onkeydown = function(event) {
    if(event.keyCode === 13)
    {
        event.preventDefault();
        popupSubmitButton.click();
    }
}
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
    
    popupMenu.style.display = "block";
    FrontEndMenu.showOverlay();
    // set title
    // document.getElementById('popup-title').innerHTML = title;
    popupSubmitButton.innerText = buttonText;
    
    // give focus to the text input
    localSaveName.value = null;
    localSaveName.focus();
}


function hidePopupMenu() {
    popupMenu.style.display = "none";
    FrontEndMenu.hideOverlay();

    // now we must delete buttons from popup menu
    if(popupSubmitButton.innerText != "Save") {
        for(let i = 0; i < popupMenu.children.length; i++)
        {
            if(popupMenu.children[i].id == "delete") {
                popupMenu.removeChild(popupMenu.children[i]);
                i--;
            }
        }
    }
}


/**
 * Shows the pop up menu for saving to localStorage
 */
localSaveButton.addEventListener('click', function() {
    showElement(localSaveName);
    showElement(popupSubmitButton);
    hideElement(saveEditButton);

    if(!showPopupMenu("Save Name", "Save"))
        return;
    
    localSaveName.placeholder = readROMName() || "ROM NAME";
});


/**
 * When we press the "load" or "save button"
 */
popupSubmitButton.addEventListener('click', function() {
    const name = localSaveName.value.toUpperCase();

    switch(popupSubmitButton.innerText.toLowerCase())
    {
    case "save":
        if(name.length > 0)
            saveToLocal(name);
        break;
    case "load":
        // loading from localStorage
        injectLocalStorage(name);
        break;
    case "load json":
        // import from clipboard JSON
        localStorage.setItem("import", name.toLowerCase());
        
        showMessage("Import successful. Now you can load this save from the menu.", "Success");
        break;
    }

    hidePopupMenu();
});


/**
 * Populates the text form with the name of a localStorage key
 */
function pasteLabel() {
    localSaveName.value = this.value;
    hidePopupMenu();

    injectLocalStorage(this.value);
}


function hideElement(e) {
    e.style.display = 'none';
}

function showElement(e) {
    e.style.display = 'block';
}

/**
 * Loads a key into MBC ram
 * @param {String} key key name in localStorage
 */
function injectLocalStorage(key) {
    // loading from localStorage
    const data = readFromLocal(key);
    if(!data)
        showMessage("Could not find <b style=\"color:green;\">" + key + "</b> in local storage.", "Error");
    else
    {
        MBC1.useSaveData(data);
        showMessage("Loaded <b style=\"color:green;\">" + key + "</b> successfully.", "Completed");
    }
}


let _delKey;

const _del = function() {
    if(_delKey)
        delete localStorage[_delKey];

    _delKey = null;
    hidePopupMenu();
    localLoadButton.click();
}


/**
 * Button event that deletes a localStorage save.
 * @param {Event} e Event
 */
function saveManagerDeleteSelf(e) {
    e.stopPropagation();
    key = this.parentElement.value
    showMessage(
        "Delete <b style='color:green;'>" + key + "</b>?",
        "Are You Sure?",
        true,
        null,
        _del
    );
    _delKey = key;
    
    saveEditButton.innerHTML = "edit";
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
            showElement(e);
        else
            hideElement(e);
    });
});


/**
 * Load from local storage
 * - Creates a list of buttons that correspond to all localStorage saves
 */
localLoadButton.addEventListener('click', function() {
    localSaveName.placeholder = "LABEL NAME";

    // prevent the menu from reappearing if it is already active
    if(popupMenu.style.display == "block")
        return;

    const lineBreak = document.createElement("hr");

    // hide text entry
    hideElement(localSaveName);
    hideElement(popupSubmitButton);
    showElement(saveEditButton);


    lineBreak.id = "delete";
    lineBreak.style = "margin: 0px; border-width 5px;"

    popupMenu.appendChild(lineBreak);

    // iterate through each value in `localStorage`
    //  and create a button for each entry
    const keys = Object.keys(localStorage);
    let hasSaves = false;

    for(let i in keys)
    {
        // some settings should not be shown
        if(keys[i].startsWith("__core_"))
            continue;
        
        const btn = document.createElement("button");
        const obj = JSON.parse(localStorage[keys[i]]);
        btn.id = "delete";
        btn.className = "menubtn";
        btn.style.width = "100%";
        btn.innerHTML = "<b>NAME:</b> <code>" + keys[i] + " </code><b>ROM:</b> <code>" + obj.label + "</code>" + "<button class='x-btn' style='display:none;' name='deleteButton'>&times;</button>";
        btn.value = keys[i];
        btn.onclick = pasteLabel;
        popupMenu.appendChild(btn);

        hasSaves = true;
    }

    if(!hasSaves)
    {
        const l = document.createElement("b");
        l.id = "delete";
        l.innerHTML = "<b>NO FILES SAVED</b>"
        popupMenu.appendChild(l);
    } else
    {
        // Add an onclick event for each delete button
        const btns = getDeleteButtons();

        btns.forEach(function(curVal) {
            curVal.onclick = saveManagerDeleteSelf;
        })
    }
    
    showPopupMenu("Save Name", "Load");
})


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

/**
 * Imports a savefile based on the text from a clipboard
 */
document.getElementById('importTextButton').onclick = function() {
    showPopupMenu("Paste Clipboard", "Load JSON");
};