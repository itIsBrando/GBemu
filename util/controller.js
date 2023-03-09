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


// document.addEventListener('keyup', function(event) {
//     const key = event.key.toLowerCase();

//     if(key == 'o' && (navigator.userAgent.match("Safari") ? event.metaKey: event.ctrlKey)) {
//         event.preventDefault();
//         inputForm.click()
//         return;
//     }
// });


 document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();

    if((navigator.userAgent.match("Safari") ? event.metaKey : event.ctrlKey)) {
        if(key == 'o' || key == 'r' || key == 'd') {
            event.preventDefault();
            return;
        }
    } else if(KeyBinding.isAssigning) {
        event.preventDefault();
        KeyBinding.setKey(key);
        return;
    }

    const binding = KeyBinding.bindings[key];
    if(binding) {
        if(binding == "FAST")
            c.speed = c.FastForwardSpeed;
        else if(binding == "FULLSCREEN")
            requestFullscreen();
        else
            gamepadButtons[binding] = true;
    }
});


/**
 * Key Released
 * @param {KeyboardEvent} event 
 */
document.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();

    if((navigator.userAgent.match("Safari") ? event.metaKey : event.ctrlKey)) {
        switch(key) {
            case 'o': // open file
                inputForm.click();
                break;
            case 'r': // reset game
                restartEmulation();
                break;
            case 'd': // open debugger
                Debug.start();
        }
        
        event.preventDefault();
        return;
    }

    const binding = KeyBinding.bindings[key];
    if(binding) {
        if(binding == "FAST")
            c.speed = 1;
        else
            gamepadButtons[binding] = false;
    }

});

class Controller {
    static DEADZONE = 0.5;
    static useGamepad = false;

    /**
     * 0 -> A
     * 1 -> B
     * 11 -> button to the right of xbox logo. three lines
     */
    static getGamepadDPAD() {
        const gp = navigator.getGamepads()[0];
        if(!gp)
            return -1;
        
        gamepadButtons["RIGHT"] = gp.buttons[15].pressed || (gp.axes[0] > this.DEADZONE);
        gamepadButtons["LEFT"] = gp.buttons[14].pressed || (gp.axes[0] < -this.DEADZONE);
        gamepadButtons["DOWN"] = gp.buttons[13].pressed || (gp.axes[1] > this.DEADZONE);
        gamepadButtons["UP"] = gp.buttons[12].pressed || (gp.axes[1] < -this.DEADZONE);

        // manage fast forward
        if(gp.buttons[6].pressed || gp.buttons[7].pressed) {
            const v = Math.max(gp.buttons[6].value, gp.buttons[7].value) * 8;
            c.speed = Math.max(1, v);
        } else {
            c.speed = 1;
        }
    }

    static getGamepadBUTTONS() {
        const gp = navigator.getGamepads()[0];
        if(!gp)
            return -1;

        gamepadButtons["A"] = gp.buttons[0].pressed;

        gamepadButtons["B"] = gp.buttons[1].pressed;

        gamepadButtons["START"] = gp.buttons[9].pressed;

        gamepadButtons["SELECT"] = gp.buttons[8].pressed;
    }

    /**
     * @param {boolean} isDPAD true if you want to check L,R,U,P or A,B,START,SELECT
     * @param type source of input
     */
    static getButtons(isDPAD) {
        if(this.useGamepad) {
            if(isDPAD) {
                Controller.getGamepadDPAD();
            } else {
                Controller.getGamepadBUTTONS();
            }
        }

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

const gamepadConnected = document.getElementById('gamepadConnected');


window.addEventListener("gamepadconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    Menu.alert.show(`Gamepad connected: ${gp.id}`);
    Controller.useGamepad = true;
    gamepadConnected.checked = true;
    gp.mapping = 'standard';
});


window.addEventListener("gamepaddisconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    Menu.alert.show(`Gamepad disconnected.`);
    Controller.useGamepad = false;
    gamepadConnected.checked = false;
});


// function time() {
//     const gp = navigator.getGamepads()[0];
//     if(!gp)
//         return;
//     for(let i = 0; i < gp.buttons.length; i++) {
//         if(gp.buttons[i].value > 0 || gp.buttons[i].pressed)
//             Menu.alert.show(`${i}: pressed`);
//     }
// }
// setInterval(time, 500);

/**
 * Chrome android:
 * 2->x
 * 3->y
 * 8->"select"
 * 9->"start"
 * 14->dpad left
 * 15->dpad right
 * 12->dpad up
 * 13->dpad down
 */