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
    const key = event.key.toLowerCase();
    if(FrontEndKeyBinding.isAssigning)
    {
        event.preventDefault();
        FrontEndKeyBinding.setKey(key);
        return;
    }


    switch(key) {
        case "=": restartEmulation(); break;
        default:
            const binding = FrontEndKeyBinding.bindings[key];
            if(binding)
            {
                if(binding == "FAST")
                    c.speed = c.FastForwardSpeed;
                else
                    gamepadButtons[binding] = true;

            }
    }
}


/**
 * Key Released
 * @param {KeyboardEvent} event 
 */
document.onkeyup = function(event) {
    const key = event.key.toLowerCase();

    const binding = FrontEndKeyBinding.bindings[key];
    if(binding) {
        if(binding == "FAST")
            c.speed = 1;
        else
            gamepadButtons[binding] = false;
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