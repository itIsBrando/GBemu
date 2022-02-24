"use strict"

const INTERVAL_SPEED = 8;
var c = new CPU();
var romLoaded = false;

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
    romLoaded = true;
    c.initialize();
    c.loadROM(rom);

    c.timer = setInterval(run, INTERVAL_SPEED);
};



/**
 * Pauses the CPU if it is running, otherwise does nothing.
 */
function pauseEmulation() {
    if(!c.isRunning)
         return;

    clearInterval(c.timer);
};


/**
 * Starts the CPU from a paused state
 * @see pauseEmulation
 */
function resumeEmulation() {
    if(romLoaded)
    	c.timer = setInterval(run, INTERVAL_SPEED);
}


/**
 * Restarts the game that is running
 */
function restartEmulation() {
    if(!c.isRunning || !romLoaded)
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

toggleDMGMode.onclick = function() {
    if(c.forceDMG == false)
    {
        toggleDMGMode.innerText = "Force DMG: yes";
    } else {
        toggleDMGMode.innerText = "Force DMG: no";
    }

    c.forceDMG = !c.forceDMG;
    localStorage.setItem("__core_ForceDMG", c.forceDMG);

    if(c.isRunning)
        showMessage("Reload the ROM to see an affect.", "Emulation Mode Changed");

}


const forceDMG = localStorage.getItem("__core_ForceDMG");

if(forceDMG) {
    c.forceDMG = !Boolean(forceDMG);
    toggleDMGMode.click();
}