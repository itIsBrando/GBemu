"use strict"

const INTERVAL_SPEED = 8;

var c = new CPU();

// passed: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
/**
 * Failed:
 *  - mem_timing
 */


/**
 * Begins the CPU.
 * - initializes a timer and begins running the ROM.
 * @param {ArrayBuffer} rom
 */
function startEmulation(rom) {
    clearInterval(c.timer);
    c.initialize();
    c.loadROM(rom);

    if(Debug.enabled)
        return;
        
    c.timer = setInterval(run, INTERVAL_SPEED);
    setLEDStatus(true);

    // this is an auto load feature. We will automatically load the save of first occurence of the rom name in localStorage
    //  this feature can be disabled by setting the `autoload` to `false` 
    if(Settings.get_core("autoload", 'true') == 'true') {
        const keys = SaveManager.getSavesFromName(readROMName());
        console.log(keys);

        if(keys.length == 0)
            return;
        
        SaveManager.injectLocalStorage(keys[0]);
    }
};



/**
 * Pauses the CPU if it is running, otherwise does nothing.
 */
function pauseEmulation() {
    if(!c.isRunning || c.timer == null)
        return;

    clearInterval(c.timer);
    c.timer = null;
    setLEDStatus(false);
    
};

function setLEDStatus(on) {
    const r = document.querySelector(':root');

    if(on) {
        r.style.setProperty("--power-led-color", "limegreen");

    } else {
        r.style.setProperty("--power-led-color", "red");
    }
}


/**
 * Starts the CPU from a paused state
 * @see pauseEmulation
 */
function resumeEmulation() {
    if(!c.romLoaded || c.timer != null)
        return;

    c.timer = setInterval(run, INTERVAL_SPEED);
    setLEDStatus(true);
}


/**
 * Restarts the game that is running
 */
function restartEmulation() {
    if(!c.isRunning || !c.romLoaded)
        return;


    clearInterval(c.timer);
    c.reset();
    c.timer = setInterval(run, INTERVAL_SPEED)

    if(Debug.enabled) {
        Debug.start();
    }
}


const powerConsumption = document.getElementById("powerConsumption");
let frames = 0;

function run() {
    const totalIteration = c.speed * 0x400000 / 1000 * INTERVAL_SPEED;

    c.haltedCycles = 0;

    while(c.currentCycles < totalIteration)
    {
        if(c.execute() == false) break;
    }

    if(c.powerConsumptionShown && (frames++ & 7) == 3)
        powerConsumption.innerHTML = "power consumption:" + (100 - Math.floor(c.haltedCycles * 100 / c.currentCycles));

    c.currentCycles -= totalIteration;
}



// toggle between emulating in DMG mode or attempting CGB mode
const toggleDMGMode = document.getElementById('toggleDMGMode');

function forceEmulationMode(dmgOnly) {
    c.forceDMG = dmgOnly;

    toggleDMGMode.innerText = c.forceDMG ? "DMG" : "GBC";

    Settings.set_core("dmgOnly", String(c.forceDMG));
    
    if(c.isRunning)
        showMessage("Reload the ROM to see an affect.", "Emulation Mode Changed");
    
}

toggleDMGMode.onclick = function() {
    forceEmulationMode(!c.forceDMG);
}


const f = Settings.get_core("dmgOnly");

if(f != null)
    forceEmulationMode(f == "true" ? true : false);