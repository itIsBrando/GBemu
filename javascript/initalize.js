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


const powerA = document.getElementById("powerConsumption");

function run() {
    const totalIteration = c.speed * 0x400000 / 1000 * INTERVAL_SPEED;

    c.haltedCycles = 0;

    while(c.currentCycles < totalIteration)
    {
        if(c.execute() == false) break;
    }

    powerA.innerHTML = "power consumption: " + (1 - c.haltedCycles / c.currentCycles);

    c.currentCycles -= totalIteration;
}
