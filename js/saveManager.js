
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
        localStorage.setItem(key, data);
        showMessage("\"" + key + "\" saved successfully. You can safely close this webpage", "Success");
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
    console.log(popupMenu.style.display);

    if(popupMenu.style.display == "block")
        return false;
    
    popupMenu.style.display = "block";
    // set title
    document.getElementById('popup-title').innerHTML = title;
    popupSubmitButton.innerText = buttonText;
    
    // give focus to the text input
    localSaveName.value = null;
    localSaveName.focus();
}

function hidePopupMenu() {
    popupMenu.style.display = "none";

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
    if(!showPopupMenu("Save Name", "Save"))
        return;
    localSaveName.placeholder = readROMName() || "ROM NAME";
});

/**
 * When we press the "load" or "save button"
 */
popupSubmitButton.addEventListener('click', function() {
    const name = localSaveName.value;

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
        localStorage.setItem("import", name.toString());
        
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
        if(c.isRunning)
            c.mbcHandler.initRAM();
        showMessage("Loaded <b style=\"color:green;\">" + key + "</b> successfully.", "Completed");
    }
}

/**
 * Load from local storage
 * - Creates a list of buttons that correspond to all localStorage saves
 */
localLoadButton.addEventListener('click', function() {
    localSaveName.placeholder = "LABEL NAME";

    // prevent the menu from reappearing if it is already active
    if(popupMenu.style.display == "block")
        return;

    const lbl = document.createElement("a");
    const lineBreak = document.createElement("hr");
    lineBreak.id = "delete";
    lineBreak.style = "margin: 0px; border-width 5px;"
    lbl.innerHTML = "<b>Saved Files</b>";
    lbl.id = "delete";
    popupMenu.appendChild(lbl);
    popupMenu.appendChild(lineBreak);

    // iterate through each value in `localStorage`
    //  and create a button for each entry
    const keys = Object.keys(localStorage);
    for(let i in keys)
    {
        const btn = document.createElement("button");
        const obj = JSON.parse(localStorage[keys[i]]);
        btn.id = "delete";
        btn.className = "menubtn";
        btn.innerHTML = "<b>NAME:</b> <code>" + keys[i] + " </code><b>ROM:</b> <code>" + obj.label + "</code>";
        btn.value = keys[i];
        btn.onclick = pasteLabel;
        popupMenu.appendChild(btn);
    };
    
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