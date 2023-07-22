const emuDiv = document.getElementById('settingsEmuDiv');
const cntrDiv = document.getElementById('settingsCntrDiv');
const miscDiv = document.getElementById('settingsMiscDiv');


var CoreSetting = new function() {
    this.registeredNames = [];
    this.indexes = {};
    this.possibleValues = {};
    this.onchanges = {}; /* Dictionary of functions */

    /**
     * @param {String} name
     * @param {Dictionary} possibleValues
     * @param {Number} initialValueIndex
     * @param {Function} onchange optional callback function called opon changing and registration. Passes the current setting's index as a parameter
     */
    this.register = function(name, possibleValues, initialValueIndex, onchange=null) {
        if(this.registeredNames.includes(name)) {
            return "Setting already registered";
        }

        this.registeredNames.push(name);
        this.possibleValues[name] = possibleValues;
        this.onchanges[name] = onchange;

        const curValue = Settings.get_core(name);
        if(curValue === null) {
            this.indexes[name] = initialValueIndex;
        } else {
            this.indexes[name] = Math.max(0, possibleValues.indexOf(curValue));
        }

        if(onchange)
            onchange(this.indexes[name]);
    }

    this.next = function(name) {
        let i = this.indexes[name];
        i++;
        if(i >= this.possibleValues[name].length)
            i = 0;

        this.indexes[name] = i;

        const val = this.getVal(name);
        Settings.set_core(name, val);

        if(this.onchanges[name])
            this.onchanges[name](this.indexes[name]);

        return val;
    }

    this.setVal = function(name, val) {
        const i = this.possibleValues[name].indexOf(val);

        if(i == -1) {
            this.indexes[name] = 0;
            return `Value ${val} no in ${name}`;
        }

        this.indexes[name] = i;
        Settings.set_core(name, val);
    }

    this.getVal = function(name) {
        const i =  this.indexes[name];

        return this.possibleValues[name][i];
    }
}


var Settings = new function() {
    const CORE_PREFIX = "__core_";
    const MainDiv = document.getElementById('SettingsDiv');

    /**
     * Gets an option from local storage. If it could it was not found, then create it and set it equal to `def`
     * @param {String} key
     * @param {any?} def default value
     */
    this.get_core = function(key, def = null) {
        key = CORE_PREFIX + key;
        const value = localStorage.getItem(key);

        if(value !== null)
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
     * Gets all of the variables in the URL
     * @returns a dictionary of var/vals
     */
    this.parse_url = function() {
        let vars = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

    /**
     * Deletes a Setting item from `localStorage` if present
     * @param {String} key item to remove
     */
    this.del_core = function(key) {
        delete localStorage[CORE_PREFIX + key];
    }

    this.set_temp = function(key, value) {
        sessionStorage.setItem(CORE_PREFIX + key, value);
    }

    this.get_temp = function(key, def = null) {
        const val = sessionStorage.getItem(CORE_PREFIX + key);

        if(val == null)
            return def;

        return val;
    }

    /**
     * @param {String} key
     * @returns true if the key is part of the internal settings
     */
    this.isSetting = function(key) {
        return key.startsWith(CORE_PREFIX);
    }

    this.showing = function() {
        return MainDiv.style.display != "none";
    }

    this.setMenu = function(str) {
        hideElement(emuDiv);
        hideElement(cntrDiv);
        hideElement(miscDiv);

        if(str === 'cntr') {
            showElement(cntrDiv, 'flex');
        } else if(str === 'misc') {
            showElement(miscDiv, 'flex');
        } else { // 'emu'
            showElement(emuDiv, 'flex');
        }
    }

    this.getStorageSize = function() {
        let len = 0;
        for(let keys in localStorage) {
            if(localStorage.hasOwnProperty(keys)) {
                len += localStorage[keys].length;
            }
        }

        // in kibibytes
        return len / 512;
    }

    this.show = function() {
        const versionElem = document.getElementById('version');
        const settingsStorage = document.getElementById('settingsStorage');
        const kbUsed = Settings.getStorageSize();

        settingsStorage.innerHTML = `
            ${(kbUsed / 1024).toFixed(2)}MiB / 5MiB<br>${(kbUsed / (5 * 1024) * 100).toFixed(1)}%`;

        if('caches' in window) {
            caches.keys().then(
                (keys) => {
                    versionElem.innerHTML = keys[0] || 'gbemu';
                }
            );
        } else {
             versionElem.innerHTML = 'gbemu (latest)';
        }

        Themes.setSettingsBar();

        Settings.setMenu('emu');

        pauseEmulation();

        showElementFadeIn(MainDiv, 'grid');
    }

    this.hide = function() {
        Renderer.frameSkip = Renderer.frameSkipAmount = Number(getCheckedRadio("FrameSkip"));

        resumeEmulation();

        KeyBinding.hide();
        hideElementFadeOut(MainDiv);
        Themes.setStatusBar();
    }
}


const AutoLoadButton = document.getElementById('AutoLoadButton');

AutoLoadButton.addEventListener('click', function() {
    let current = Settings.get_core("autoload");

    if(current == null)
        current = true;
    else
        current = !(current == 'true' ? true : false);

    this.checked = current;

    Settings.set_core("autoload", current);
})

AutoLoadButton.checked = Settings.get_core("autoload", 'true') == 'true' ? true : false;

const BorderButton = document.getElementById('BorderButton');

BorderButton.addEventListener('click', function() {
    let cur = Settings.get_core('bordershown', 'true');
    const v = document.getElementById('viewport');

    cur = !(cur == 'true');

    if(cur == true) {
        this.checked = true;
        v.className = 'viewport';
    } else {
        this.checked = false;
        v.className = 'viewport viewport-full';
    }

    Settings.set_core('bordershown', cur);
});


if(Settings.get_core('bordershown') == 'false') {
    BorderButton.click();
    BorderButton.click();
}

const vars = Settings.parse_url();
Settings.set_core('pwa', vars['pwa'] || 'false');