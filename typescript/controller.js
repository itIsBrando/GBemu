const buttonA = document.getElementById("controllerA");
const buttonB = document.getElementById("controllerB");
const buttonStart = document.getElementById("controllerStart");
const buttonUp = document.getElementById("controllerUp");
const buttonDown = document.getElementById("controllerDown");

let _a = false;
let _b = false;
let _start = false;
let _select = false;

let _left = false;
let _right = false;
let _up    = false;
let _down  = false;

buttonStart.onmousedown = function() {
    _start = true;
};

buttonStart.onmouseup = function() {
    _start = false;
};

buttonA.onmousedown = function() {
    _a = true;
};

buttonA.onmouseup = function() {
    _a = false;
};

buttonB.onmousedown = function() {
    _b = true;
};

buttonB.onmouseup = function() {
    _b = false;
};

buttonUp.onmousedown = function() {
    _up = true;
};

buttonUp.onmouseup = function() {
    _up = false;
};

buttonDown.onmousedown = function() {
    _down = true;
};

buttonDown.onmouseup = function() {
    _down = false;
};

/**
 * Key Pressed
 * @param {KeyboardEvent} event 
 */
document.onkeydown = function(event) {
    switch(event.key.toLowerCase()) {
        case "s":           _a = true; break;
        case "a":           _b = true; break;
        case "enter":       _start = true; break;
        case "shift":       _select= true; break;
        case "arrowleft":   _left = true; break;
        case "arrowright":  _right = true; break;
        case "arrowup":     _up    = true; break;
        case "arrowdown":   _down  = true; break;
    }
}


/**
 * Key Released
 * @param {KeyboardEvent} event 
 */
document.onkeyup = function(event) {
    switch(event.key.toLowerCase()) {
        case "s":           _a = false; break;
        case "a":           _b = false; break;
        case "enter":       _start = false; break;
        case "shift":       _select= false; break;
        case "arrowleft":   _left = false; break;
        case "arrowright":  _right = false; break;
        case "arrowup":     _up    = false; break;
        case "arrowdown":   _down  = false; break;
    }}


class Controller {
    /**
     * 
     * @param {boolean} isDPAD true if you want to check L,R,U,P or A,B,START,SELECT
     */
    static getButtons(isDPAD) {
        if(!isDPAD)
        {
            let a = Number(_a);
            let b = Number(_b) << 1;
            let select = Number(_select) << 2;
            let start = Number(_start) << 3;
            return 0xFF ^ a ^ b ^ start ^ select;
        } else
        {
            let r = Number(_right);
            let l = Number(_left) << 1;
            let u = Number(_up) << 2;
            let d = Number(_down) << 3;
            return 0xFF ^ l ^ r ^ u ^ d;
        }
    }
}