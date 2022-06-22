
var Settings = new function() {
    const CORE_PREFIX = "__core_";
    /**
     * Gets an option from local storage. If it could it was not found, then create it and set it equal to `def`
     * @param {String} key
     * @param {any?} def default value
     */
    this.get_core = function(key, def = null) {
        key = CORE_PREFIX + key;
        const value = localStorage.getItem(key);
        
        if(value)
            return value;

        localStorage.setItem(key, def);
        return def;
    }

    /**
     * Sets a localStorage key
     * @param {String} key 
     * @param {String} value 
     */
    this.set_core = function(key, value) {
        localStorage.setItem(CORE_PREFIX + key, value);
    }

    /**
     * Deletes a Setting item from `localStorage` if present
     * @param {String} key item to remove
     */
    this.del_core = function(key) {
        delete localStorage[CORE_PREFIX + key];
    }

    /**
     * @param {String} key 
     * @returns true if the key is part of the internal settings
     */
    this.isSetting = function(key) {
        return key.startsWith(CORE_PREFIX);
    }

    const MainDiv = document.getElementById('SettingsDiv');

    this.show = function() {
        showElement(MainDiv);
        pauseEmulation();
    }

    this.hide = function(){ 
        hideElement(MainDiv);
        resumeEmulation();
    }
}


const AutoLoadButton = document.getElementById('AutoLoadButton');

AutoLoadButton.addEventListener('click', function() {
    let current = Settings.get_core("autoload");

    if(current == null)
        current = true;
    else
        current = !(current == 'true' ? true : false);

    if(current == true) {
        this.innerText = "yes";
    } else {
        this.innerText = "no";
    }

    Settings.set_core("autoload", current);
})

AutoLoadButton.innerHTML = Settings.get_core("autoload", 'true') == 'true' ? 'yes' : 'no';