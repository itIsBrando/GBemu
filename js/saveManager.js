
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


function showPopupMenu() {
    popupMenu.style.display = "block";
    // give focus to the text input
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
    // since we use this for both loading and saing, we must change some text
    popupSubmitButton.innerHTML = "Save";
    localSaveName.placeholder = readROMName() || "ROM NAME";
    showPopupMenu();
});

/**
 * When we press the "load" or "save button"
 */
popupSubmitButton.addEventListener('click', function() {
    const name = localSaveName.value;

    if(popupSubmitButton.innerText == "Save")
    {
        if(name.length > 0)
            saveToLocal(name);
    } else {
        // loading
        const data = readFromLocal(name);
        if(!data)
            showMessage("Could not find \'" + name + "\' in local storage.", "Error");
        else
        {
            MBC1.useSaveData(data);
            showMessage('\'' + name + "\', loaded successfully. Now load your ROM.", "Completed");
        }
    }

    hidePopupMenu();
});


/**
 * Populates the text form with the name of a localStorage key
 */
function pasteLabel() {
    localSaveName.value = this.value;
}

/**
 * Load from local storage
 * - Creates a list of buttons that correspond to all localStorage saves
 */
localLoadButton.addEventListener('click', function() {
    popupSubmitButton.innerHTML = "Load";
    localSaveName.placeholder = "LABEL NAME";

    const lbl = document.createElement("a");
    const lineBreak = document.createElement("hr");
    lineBreak.id = "delete";
    lineBreak.style = "margin: 0px; border-width 5px;"
    lbl.innerHTML = "<b>Saved Files</b>";
    lbl.id = "delete";
    popupMenu.appendChild(lbl);
    popupMenu.appendChild(lineBreak);

    // iterate through each value in `localStorage` and create a button for it
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

    showPopupMenu();
})