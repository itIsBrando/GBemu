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

const buttonElements = [
    buttonA,
    buttonB,
    buttonStart,
    buttonSelect,
    buttonUp,
    buttonDown,
    buttonRight,
    buttonLeft,
    buttonFF,
];

const sampleButton = document.getElementById("sampleSVG");

const ids = [
        "A",
        "B",
        "START",
        "SELECT",
        "UP",
        "DOWN",
        "RIGHT",
        "LEFT",
        "FF"
]


for(let i = 0; i < buttonElements.length; i++) {
    buttonElements[i].id = ids[i];
    buttonElements[i].innerHTML = sampleButton.innerHTML;
    buttonElements[i].addEventListener('touchstart', touchStart);
    buttonElements[i].addEventListener('touchend', touchEnd);
    buttonElements[i].addEventListener('touchcancel', touchEnd);
    buttonElements[i].addEventListener('touchmove', touchMove);
}
// touchControls.addEventListener('touchmove', touchMove);

/**
 * Handles touch movement
 *  Disables buttons when they move out of viewpoint
 * @param {Event} event 
 */
function touchMove(event) {
    event.preventDefault();
    let touch = event.changedTouches[0];
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

/**
 * Handles touch movement
 *  - Enables button
 * @param {Event} event 
 */
function touchStart(event) {
    event.preventDefault();

    if(this.id == "FF") {    
        c.speed = c.FastForwardSpeed;
        return;
    }

    gamepadButtons[this.id] = true;
        
}

/**
 * Handles touch movement
 *  - Disables button
 * @param {Event} event 
 */
function touchEnd(event) {
    event.preventDefault();

    if(this.id == "FF") {
        c.speed = 1;
        return;
    }

    gamepadButtons[this.id] = false;
}
