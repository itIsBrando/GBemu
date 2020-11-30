"use strict"

const INTERVAL_SPEED = 8;
var c = new CPU();

// passed: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
/**
 * Failed:
 *  - mem_timing
 */


document.getElementById("timerStop").onclick = function() {
    clearInterval(c.timer);
}


document.getElementById("timerStep").onclick = function() {
    clearInterval(c.timer);
    console.log("0x"+c.pc.v.toString(16) + " execute: 0x" + c.read8(c.pc.v).toString(16));
    c.execute();
}


/**
 * 
 * @param {ArrayBuffer} rom 
 */
function startEmulation(rom) {
    clearInterval(c.timer);
    c.initialize();
    c.loadROM(rom);
    
    c.timer = setInterval(run, INTERVAL_SPEED);


};

function run() {
    const totalIteration = c.speed * 0x400000 / 1000 * INTERVAL_SPEED;
    while(c.currentCycles < totalIteration)
    {
        if(c.execute() == false) break;
    }

    c.currentCycles -= totalIteration;
}