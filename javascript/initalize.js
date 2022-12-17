"use strict"
const INTERVAL_SPEED = 8;

var c = new CPU();

/**
 * @param {ArrayBuffer} rom
 */
function startEmulation(rom) {
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

    c.apu.mute();
    clearInterval(c.timer);
    c.timer = null;
    setLEDStatus(false);
    
};


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

    c.timer = setInterval(run, INTERVAL_SPEED);
    c.apu.unmute();
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
let frames = 0;

function run() {
    const totalIteration = c.speed * 0x400000 / 1000 * INTERVAL_SPEED;

    c.haltedCycles = 0;

    while(c.currentCycles < totalIteration)
    {
        if(c.execute() == false) break;
    }

    if(c.powerConsumptionShown && (frames++ & 7) == 3)
        powerConsumption.innerHTML = "power consumption:" + (100 - Math.floor(c.haltedCycles * 100 / c.currentCycles));

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