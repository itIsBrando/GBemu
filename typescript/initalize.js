"use strict"

// implement this later, as firefox does not have ArrayBuffer.slice

// if(!ArrayBuffer.prototype.slice)
//     /**
//      * 
//      * @param {number} start 
//      */
//     Array.prototype.slice = function(start) {
        
//     }

var c = new CPU();

// passed: 1, 2, 3, 4, 5, 6, 7, 8, 10, 11
/**
 * Failed:
 *  - 9: 0xCB 0x00 undefined
 */


document.getElementById("timerStop").onclick = function() {
    clearInterval(c.timer);
    console.log("click");
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
    c.initialize();
    c.loadROM(new Uint8Array(rom));
    // c.mbcHandler = null;
    
    c.timer = setInterval(run, 100);


};

function run() {
    for(let i = 0; i < 70224; i++)
        if(c.execute() == false) break;

    // console.log("PC: 0x" + c.pc.v.toString(16));
}