const touchControls = document.getElementById('touchControls');

const buttonA = document.getElementById("controllerA");
const buttonB = document.getElementById("controllerB");
const buttonStart = document.getElementById("controllerStart");
const buttonUp = document.getElementById("controllerUp");
const buttonDown = document.getElementById("controllerDown");
const buttonRight = document.getElementById("controllerRight");
const buttonLeft = document.getElementById("controllerLeft");

const buttonElements = [
    buttonA,
    buttonB,
    buttonStart,
    buttonUp,
    buttonDown,
    buttonRight,
    buttonLeft
];

for(let i = 0; i < buttonElements.length; i++) {
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
        gamepadButtons[target.name] = false;
    } else {
        gamepadButtons[target.name] = true;
    }
}

/**
 * Handles touch movement
 *  - Enables button
 * @param {Event} event 
 */
function touchStart(event) {
    event.preventDefault();
    gamepadButtons[this.name] = true;
}

/**
 * Handles touch movement
 *  - Disables button
 * @param {Event} event 
 */
function touchEnd(event) {
    event.preventDefault();
    gamepadButtons[this.name] = false;
}
