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

 document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();

    if((navigator.userAgent.match("Safari") ? event.metaKey : event.ctrlKey)) {
        if(key == 'o' || key == 'r' || key == 'd' || key == ',') {
            event.preventDefault();
            return;
        }
    } else if(state == MainState.KeyboardAssign) {
        event.preventDefault();
        KeyBinding.setKey(key);
        return;
    }

    const binding = KeyBinding.bindings[key];
    if(binding && state == MainState.Main) {
        if(binding == "FAST")
            c.speed = c.FastForwardSpeed;
        else if(binding == "FULLSCREEN")
            requestFullscreen();
        else if(binding == "PAUSE")
            pauseToggle();
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

    if(state == MainState.Main && (navigator.userAgent.match("Safari") ? event.metaKey : event.ctrlKey)) {
        switch(key) {
            case 'o': // open file
                inputForm.click();
                break;
            case 'r': // reset game
                restartEmulation();
                break;
            case 'd': // open debugger
                State.push(MainState.DebugMenu);
                break;
            case ',': // open settings
                State.push(MainState.SettingsMenu);
                break;
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
    static hapticStrength = 1;
    static gp = null;
    static gamepadMap = {
        'A': 0,
        'B': 1,
        'START':    9,
        'SELECT':   8,
        'RIGHT':    15,
        'LEFT':     14,
        'DOWN':     13,
        'UP':       12,
    };

    static vibrate(ms=6) {
        ms *= this.hapticStrength;

        if(this.gp && 'vibrationActuator' in Controller.gp) {
            this.gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: ms * 4,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0,
            });
        } else if('vibrate' in navigator) {
            navigator.vibrate(ms);
        }
    }

    /**
     * 0 -> A
     * 1 -> B
     * 11 -> button to the right of xbox logo. three lines
     */
    static getGamepadDPAD() {
        this.gp = navigator.getGamepads()[0];
        if(!this.gp)
            return -1;

        gamepadButtons["RIGHT"] = this.lookupGamepadKey('RIGHT') || (this.gp.axes[0] > this.DEADZONE);
        gamepadButtons["LEFT"] = this.lookupGamepadKey('LEFT') || (this.gp.axes[0] < -this.DEADZONE);
        gamepadButtons["DOWN"] = this.lookupGamepadKey('DOWN') || (this.gp.axes[1] > this.DEADZONE);
        gamepadButtons["UP"] = this.lookupGamepadKey('UP') || (this.gp.axes[1] < -this.DEADZONE);

        // manage fast forward
        if(this.gp.buttons[6].pressed || this.gp.buttons[7].pressed) {
            const v = Math.max(this.gp.buttons[6].value, this.gp.buttons[7].value) * 8;
            c.speed = Math.max(1, v);
        } else {
            c.speed = 1;
        }
    }

    static lookupGamepadKey(key) {
        return this.gp.buttons[this.gamepadMap[key]].pressed;
    }

    static getGamepadBUTTONS() {
        this.gp = navigator.getGamepads()[0];

        if(!this.gp)
            return -1;

        gamepadButtons["A"] = this.lookupGamepadKey('A');
        gamepadButtons["B"] = this.lookupGamepadKey('B');
        gamepadButtons["START"] = this.lookupGamepadKey('START');
        gamepadButtons["SELECT"] = this.lookupGamepadKey('SELECT');
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


window.addEventListener("gamepadconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];

    Menu.alert.show(`Gamepad connected: ${gp.id}`);
    gp.mapping = 'standard'
    Controller.useGamepad = true;
    Controller.gp = gp;
});


window.addEventListener("gamepaddisconnected", (e) => {
    const gp = navigator.getGamepads()[e.gamepad.index];
    Menu.alert.show(`Gamepad disconnected.`);
    Controller.useGamepad = false;
    Controller.gp = null;
});


document.getElementById('gpDeadzoneSlider').addEventListener('input', (e) => {
    Controller.DEADZONE = e.target.value;
    Menu.alert.show(`Deadzone set to ${e.target.value * 100}%`, 1000);
});



// @todo add ability to remap controls


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