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

    this.show = function() {
        const versionElem = document.getElementById('version');

        if(caches) {
            caches.keys().then(
                (keys) => {
                    versionElem.innerHTML = keys[0] || 'gbemu (offline incompatible)';
                }
            );
        }

        if(Settings.get_temp("change_status_bar", "false") == "true")
            Themes.set_theme_color("#dddddd");

        showElement(MainDiv);
        pauseEmulation();
    }

    this.hide = function() {
        hideElement(MainDiv);
        Themes.setStatusBar();
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

const BorderButton = document.getElementById('BorderButton');

BorderButton.addEventListener('click', function() {
    let cur = Settings.get_temp('bordershown', 'true');
    const v = document.getElementById('viewport');

    cur = !(cur == 'true');

    if(cur == true) {
        this.innerText = 'yes';
        v.className = 'viewport';
    } else {
        this.innerText = 'no';
        v.className = 'viewport viewport-full';
    }

    Settings.set_temp('bordershown', cur);
});

const vars = Settings.parse_url();
Settings.set_core('pwa', vars['pwa'] || 'false');