const touchControls = document.getElementById('touchControls');

const buttonA = document.getElementById("controllerA");
const buttonB = document.getElementById("controllerB");
const buttonStart = document.getElementById("controllerStart");
const buttonSelect = document.getElementById("controllerSelect");
const buttonUp = document.getElementById("controllerUp");
const buttonDown = document.getElementById("controllerDown");
const buttonRight = document.getElementById("controllerRight");
const buttonLeft = document.getElementById("controllerLeft");
const buttonFF = document.getElementById("controllerFastForward");
const dpad = document.getElementById("dpadButtons");



/**
 * Returns a number between 0.0-1.0 of the relative position the touch is between `elem`
 * @param {HTMLElement} elem element to check position in
 * @param {Touch} touch
 */
function getRelativePosition(elem, touch) {
    const rect = elem.getBoundingClientRect();
    return {
        x: Math.min(1, Math.max(0, (touch.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (touch.clientY - rect.top) / rect.height))
    };
}



// dpad buttons are handled differently
const buttonElements = [
    buttonA,
    buttonB,
    buttonStart,
    buttonSelect,
    buttonFF,
];

const squareSample = document.getElementById("sampleSVG");
const smallSample = document.getElementById("smallSampleSVG");

const ids = [
        "A",
        "B",
        "START",
        "SELECT",
        "FF",
        "UP",
        "DOWN",
        "RIGHT",
        "LEFT",
]

// show regular buttons
for(let i = 0; i < buttonElements.length; i++) {
    buttonElements[i].id = ids[i];
    buttonElements[i].innerHTML = (ids[i] == "SELECT" || ids[i] == "START") ? smallSample.innerHTML : squareSample.innerHTML;
    buttonElements[i].addEventListener('touchstart', touchStart);
    buttonElements[i].addEventListener('touchend', touchEnd);
    buttonElements[i].addEventListener('touchcancel', touchEnd);
    buttonElements[i].addEventListener('touchmove', touchMove);
}


/**
 * Checks to see if the current device has a touchscreen
 * @returns true if it does, otherwise false
 */
function hasTouchscreen() {
    return 'ontouchstart' in window;
}


/**
 * Handles touch movement
 *  Disables buttons when they move out of viewpoint
 * @param {Event} event
 */
function touchMove(event) {
    event.preventDefault();
    const touches = event.changedTouches;
    for(let i = 0; i < touches.length; i++)
    {
        let touch = touches[i];
        let target = touch.target;
        let rect = target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if(x < 0 || y < 0 || x > rect.width || y > rect.height) {
            gamepadButtons[target.id] = false;
        } else {
            gamepadButtons[target.id] = true;
        }
    }

}

function doVibration() {
    if('vibrate' in navigator && Dpad.vibrationEnable)
        navigator.vibrate(1);
}

/**
 * Handles touch movement
 *  - Enables button
 * @param {Event} event
 */
function touchStart(event) {
    event.preventDefault();

    doVibration();

    if(this.id == "FF")
        c.speed = c.FastForwardSpeed;
    else
        gamepadButtons[this.id] = true;

}


/**
 * Handles touch movement (FOR non-directional pad buttons only)
 *  - Disables button
 * @param {Event} event
 */
function touchEnd(event) {
    event.preventDefault();

    if(this.id == "FF")
        c.speed = 1;
    else
        gamepadButtons[this.id] = false;
}


/**
 * Sets the dpad button `elem` to be pressed
 * @param {HTMLElement} elem
 * @param {String} key key of gamepadButtons to enable
 */
function touchDPADSet(elem, key) {
    const bot = elem.getElementsByClassName("dpad-button-bottom").item(0);
    const top = elem.getElementsByClassName("dpad-button-top").item(0);

    if(!bot.classList.contains("dpad-button-bottom-active"))
        bot.classList.add("dpad-button-bottom-active");
    if(!top.classList.contains("dpad-button-top-active"))
        top.classList.add("dpad-button-top-active");


    if(!gamepadButtons[key]) {
        gamepadButtons[key] = true;
        doVibration();
    }
}


/**
 * Sets the dpad button `elem` to be unpressed
 * @param {HTMLElement} elem
 */
function touchDPADReset(elem, key) {
    const bot = elem.getElementsByClassName("dpad-button-bottom").item(0) || elem.getElementsByClassName("gamepad-button-bottom").item(0);
    const top = elem.getElementsByClassName("dpad-button-top").item(0) || elem.getElementsByClassName("gamepad-button-top").item(0);

    if(bot.classList.contains("gamepad-button-bottom"))
    {
        bot.classList.remove("gamepad-button-bottom");
        top.classList.remove("gamepad-button-top");
        bot.classList.add("dpad-button-bottom");
        top.classList.add("dpad-button-top");
    }

    if(bot.classList.contains("dpad-button-bottom-active"))
        bot.classList.remove("dpad-button-bottom-active");
    if(top.classList.contains("dpad-button-top-active"))
        top.classList.remove("dpad-button-top-active");

    gamepadButtons[key] = false;
}

/**
 * Handles touch movement for the dPad
 * @param {TouchEvent} event
 * @param {boolean} state true to enable button, false to clear all
 */
function touchDPAD(event, state) {
    event.preventDefault();

    // this graphically updates the DPAD button
    if(state == false) {
        touchDPADReset(buttonDown, "LEFT");
        touchDPADReset(buttonUp, "RIGHT");
        touchDPADReset(buttonLeft, "UP");
        touchDPADReset(buttonRight, "DOWN");
        return;
    }

    const xy = getRelativePosition(dpad, event.targetTouches[0]);
    const x = xy.x, y = xy.y;

    // sets button state and graphical state
    if(x <= 0.33) {
        touchDPADSet(buttonLeft, 'LEFT');
        touchDPADReset(buttonRight, 'RIGHT');
    } else if(x >= 0.66) {
        touchDPADSet(buttonRight, 'RIGHT');
        touchDPADReset(buttonLeft, 'LEFT');
    } else {
        touchDPADReset(buttonRight, 'RIGHT');
        touchDPADReset(buttonLeft, 'LEFT');
    }

    if(y >= 0.66) {
        touchDPADSet(buttonDown, 'DOWN');
        touchDPADReset(buttonUp, 'UP');
    } else if(y <= 0.33) {
        touchDPADSet(buttonUp, 'UP');
        touchDPADReset(buttonDown, 'DOWN');
    } else {
        touchDPADReset(buttonUp, 'UP');
        touchDPADReset(buttonDown, 'DOWN');
    }

}


const controlsToggle = document.getElementById('controlsToggle');

// touch controls
controlsToggle.addEventListener('click', function() {
    const isShown = touchControls.style.display != "none";

    if(isShown)
        hideElement(touchControls);
    else
        showElement(touchControls);

    this.checked = !isShown;
});

document.getElementById('vibrationToggle').addEventListener('click', (e)=>{
    Dpad.vibrationEnable = e.target.checked;

    if(Dpad.vibrationEnable && !('vibrate' in navigator)) {
        Menu.message.show("Vibration not supported on this device.");
        e.target.click();
        return;
    }

    doVibration();
});


// @todo bundle button features
var Dpad = new function() {
    let vibrationEnable = false;

    this.init = function() {
        // show dpad buttons
        const d = [
            buttonUp,
            buttonDown,
            buttonRight,
            buttonLeft,
        ];

        for(let i = 0; i < d.length; i++) {
            d[i].id = ids[i + 5];
            d[i].innerHTML = squareSample.innerHTML;
            d[i].getElementsByClassName('gamepad-button-bottom').item(0).classList = ['dpad-button-bottom'];
            d[i].getElementsByClassName('gamepad-button-top').item(0).classList = ['dpad-button-top'];
        }

        // add event listeners to DPAD
        dpad.addEventListener('touchstart', function(event) {
            touchDPAD(event, true);
        });
        dpad.addEventListener('touchmove', function(event) {
            touchDPAD(event, true);
        });
        dpad.addEventListener('touchend', function(event) {
            touchDPAD(event, false);
        });
        dpad.addEventListener('touchcancel', function(event) {
            touchDPAD(event, false);
        });

        // auto enable if using a touch device
        if(hasTouchscreen())
            controlsToggle.click();

    }
}


let t = null;

document.getElementById('touchPadding').addEventListener('input', (e) => {
    const div = document.getElementById('SettingsDiv');
    touchControls.style.bottom = `calc(env(safe-area-inset-bottom) + ${e.target.value}%)`;
    div.style.opacity = "0.8";

    if(t) {
        clearTimeout(t);
        t = null;
    }

    t = setTimeout(() => {div.style.opacity = "1"; t = null;}, 600);

});