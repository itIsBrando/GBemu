
let Accel = new function() {
    let touchAccelerometer = document.getElementById('touchAccelerometer');
    const accelNip = touchAccelerometer.children[0];
    let dx = 0, dy = 0;
    let pressed = false;

    this.init = function() {

    }

    this.moveTo = function(x, y) {
        x = Math.max(Math.min(x, 30), -30);
        y = Math.max(Math.min(y, 30), -30);

        this.dx = -x / 60;
        this.dy = -y / 60;
        accelNip.style.left = `calc(30px - 10px + ${x}px)`;
        accelNip.style.top = `calc(30px - 10px + ${y}px)`;
    }

    this.show = function() {
        showElement(touchAccelerometer);
        this.addEvents();
    }

    this.hide = function() {
        hideElement(touchAccelerometer);
        this.removeEvents();
    }

    this.mouseEnd = function() {
        accelNip.style.transition = 'all 0.2s'
        Accel.moveTo(0, 0);
        Accel.pressed = false;
    }

    this.mouseStart = function() {
        Accel.pressed = true;
    }

    /**
     * @param {MouseEvent} e
     */
    this.mouseMove = function(e) {
        const accelRect = touchAccelerometer.getBoundingClientRect();

        if(Accel.pressed) {
            accelNip.style.transition = 'all 0s'
            Accel.moveTo(e.clientX - accelRect.x - 30, e.clientY - accelRect.y - 30);
        }
    }

    this.addEvents = function() {
        window.addEventListener('mousemove', this.mouseMove);
        window.addEventListener('mouseup', this.mouseEnd);
        touchAccelerometer.addEventListener('mousedown', this.mouseStart);

        // let this bad boy work on touch screen devices
        if(hasTouchscreen()) {
            touchAccelerometer.addEventListener('touchstart', this.mouseStart);
            window.addEventListener('touchmove', (e) => {
                Accel.mouseMove(e.touches[0]);
            });
            window.addEventListener('touchend', this.mouseEnd);
        }

        this.mouseEnd();
    }

    this.removeEvents = function() {
        window.removeEventListener('mousemove', this.mouseMove);
        window.removeEventListener('mouseup', this.mouseEnd);
        touchAccelerometer.removeEventListener('mousedown', this.mouseStart);
    }
}
