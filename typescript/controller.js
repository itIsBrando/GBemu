var gamepadButtons = {
    "A": false,
    "B": false,
    "START": false,
    "SELECT": false,
    "LEFT": false,
    "RIGHT": false,
    "UP": false,
    "DOWN": false,
}


/**
 * Key Pressed
 * @param {KeyboardEvent} event 
 */
document.onkeydown = function(event) {
    switch(event.key.toLowerCase()) {
        case "s":           gamepadButtons["A"] = true; break;
        case "a":           gamepadButtons["B"] = true; break;
        case "enter":       gamepadButtons["START"] = true; break;
        case "shift":       gamepadButtons["SELECT"]= true; break;
        case "arrowleft":   gamepadButtons["LEFT"] = true; break;
        case "arrowright":  gamepadButtons["RIGHT"] = true; break;
        case "arrowup":     gamepadButtons["UP"]    = true; break;
        case "arrowdown":   gamepadButtons["DOWN"]  = true; break;
        case "f": requestFullscreen(); break;
        case "d": c.speed = c.FastForwardSpeed; break;
    }
}


/**
 * Key Released
 * @param {KeyboardEvent} event 
 */
document.onkeyup = function(event) {
    switch(event.key.toLowerCase()) {
        case "s":           gamepadButtons["A"] = false; break;
        case "a":           gamepadButtons["B"] = false; break;
        case "enter":       gamepadButtons["START"] = false; break;
        case "shift":       gamepadButtons["SELECT"]= false; break;
        case "arrowleft":   gamepadButtons["LEFT"] = false; break;
        case "arrowright":  gamepadButtons["RIGHT"] = false; break;
        case "arrowup":     gamepadButtons["UP"]    = false; break;
        case "arrowdown":   gamepadButtons["DOWN"]  = false; break;
        case "d": c.speed = 1; break;
    }
}


class Controller {
    /**
     * 
     * @param {boolean} isDPAD true if you want to check L,R,U,P or A,B,START,SELECT
     */
    static getButtons(isDPAD) {
        if(!isDPAD)
        {
            let a = Number(gamepadButtons["A"]);
            let b = Number(gamepadButtons["B"]) << 1;
            let select = Number(gamepadButtons["SELECT"]) << 2;
            let start = Number(gamepadButtons["START"]) << 3;
            return 0xFF ^ a ^ b ^ start ^ select;
        } else
        {
            let r = Number(gamepadButtons["RIGHT"]);
            let l = Number(gamepadButtons["LEFT"]) << 1;
            let u = Number(gamepadButtons["UP"]) << 2;
            let d = Number(gamepadButtons["DOWN"]) << 3;
            return 0xFF ^ l ^ r ^ u ^ d;
        }
    }
}