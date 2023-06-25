"use strict"
const INTERVAL_SPEED = 8;

const MainState = {
    Main: 0,
    Menu: 1,
    KeyboardAssign: 2,
}

var c = new CPU();
var state = MainState.Main;

/**
 * @param {ArrayBuffer} rom
 */
function startEmulation(rom) {
    if(c.isLoaded) {
        useExternalSaveFile = false;
    }

    state = MainState.Main;
    clearInterval(c.timer);
    c.initialize();
    c.loadROM(rom);

    if(Debug.enabled)
        return;

    c.timer = setInterval(run, INTERVAL_SPEED);
    setLEDStatus(true);

    /* this is an auto load feature. We will automatically load the save of first occurence of the rom name in localStorage
     this feature can be disabled by setting the `autoload` to `false`
     Savestates are never automatically loaded.
    */
    if(Settings.get_core("autoload", 'true') == 'true') {
        const keys = SaveManager.getSavesFromName(c.readROMName());

        for(let i = 0; i < keys.length; i++) {
            if(SaveManager.getType(keys[i]) != SaveType.SAVESTATE)
                SaveManager.injectLocalStorage(keys[i]);
        }
    }
};

function pauseEmulation() {
    if(!c.isRunning || c.timer == null)
        return;

    clearInterval(c.timer);
    c.timer = null;
    c.apu.mute();
    setLEDStatus(false);

};


function pauseToggle() {
    if(c.isRunning)
        pauseEmulation();
    else if(!c.isRunning && c.romLoaded)
        resumeEmulation();
}


function setLEDStatus(on) {
    const r = document.querySelector(':root');

    if(on) {
        r.style.setProperty("--power-led-color", "limegreen");

    } else {
        r.style.setProperty("--power-led-color", "red");
    }
}


function resumeEmulation() {
    if(!c.romLoaded || c.timer != null)
        return;

    c.apu.unmute();
    c.timer = setInterval(run, INTERVAL_SPEED);
    setLEDStatus(true);
}


function restartEmulation() {
    if(!c.isRunning || !c.romLoaded)
        return;

    Menu.alert.show("Reset ROM", 2500);
    clearInterval(c.timer);
    c.reset();
    c.timer = setInterval(run, INTERVAL_SPEED)

    if(Debug.enabled) {
        Debug.start();
    }
}


const powerConsumption = document.getElementById("powerConsumption");
let frames = 0, cur_time = 0;

function run() {
    const totalIteration = c.speed * c.ppu.getSpeedMultiplier() * 0x400000 / 1000 * INTERVAL_SPEED;

    c.haltedCycles = 0;

    while(c.currentCycles < totalIteration) {
        c.execute();
    }

    if(c.powerConsumptionShown && (frames++ % 125) == 0) {
        // @todo this math is likely incorrect
        const newTime = Date.now();
        const fps = 60 * c.speed / ((newTime - cur_time) / 1000);

        powerConsumption.innerHTML = `FPS: ${fps.toFixed(2)}`;
        cur_time = newTime;
    }

    c.currentCycles -= totalIteration;
}



const toggleDMGMode = document.getElementById('toggleDMGMode');

function forceEmulationMode(dmgOnly) {
    const isCGB = !dmgOnly;
    const chng = (dmg) => {
        c.forceDMG = dmg;
        toggleDMGMode.innerText = dmg ? "DMG" : "GBC";
        Settings.set_core("dmgOnly", String(dmg));
    };

    if(c.romLoaded) {
        Menu.message.show("To switch emulation modes, the ROM must be reset.<br>You will lose any unsaved progress", "Reset ROM?", true, null, ()=> {
            c.cgb = isCGB;
            c.reset();
            chng(dmgOnly);
        });
    } else {
        chng(dmgOnly);
    }

}

const f = Settings.get_core("dmgOnly", "false");

forceEmulationMode(f == "true" ? true : false);