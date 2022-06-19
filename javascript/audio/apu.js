const APU_FREQ = 4194304 / 512;
var audio;

class APU {
    static master_enable = Settings.get_core("sound", false) == 'true';

    static init() {
        audio = new AudioContext({rampleRate: 44100});
    }

    static set_button_text() {
        document.getElementById('sndButton').innerHTML = this.master_enable ? "yes" : "no";
    }

    constructor(cpu) {
        this.cpu = cpu;
        this._enabled = false; // set by the gameboy @see APU.enabled

        this.step = 0;
        this.cycles = 0;

        this.c1 = new Channel1();


        audio.suspend();
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(v) {
        this._enabled = v;

        if(v) {
            audio.resume();
            return;
        }

        this.c1.enabled = false;
        audio.suspend();
    }

    tick(cycles) {
        if(!APU.master_enable)
            return;

        this.c1.tick(cycles);


        this.cycles += cycles;
        if(this.cycles >= APU_FREQ) {
            this.cycles -= APU_FREQ;
            this.advanceStep();
        }
    }

    advanceStep() {
        switch(this.step) {
            case 0:
                this.tickLength();
                break;
            case 2:
                this.tickLength();
                this.tickSweep();
                break;
            case 4:
                this.tickLength();
                break;
            case 6:
                this.tickLength();
                this.tickSweep();
                break;
            case 7:
                // this.clockVolume();
                break;
        }

        if(++this.step >= 8)
            this.step = 0;
    }

    accepts(addr) {
        return addr >= 0xFF10 && addr <= 0xFF3F;
    }

    write8(addr, byte) {
        if(!APU.master_enable)
            return;
        
        if(this.c1.accepts(addr))
            this.c1.write8(addr, byte);

        switch(addr & 0xFF) {
            case 0x26: // NR52 sound on/off
                this.enabled = UInt8.getBit(byte, 7);
                break;
        }
    }

    read8(addr) {
        if(this.c1.accepts(addr))
            return this.c1.read8(addr)

        switch(addr & 0xFF) {
            case 0x26: // @todo add other channels and update mask
                const reg = (this.enabled << 7) | this.c1.enabled;
                if(!this.enabled)
                    return 0x7F;
                
                return reg | (0x7E);
        }

        return 0xFF;
    }

    tickLength() {
        this.c1.tickLength();
    }

    tickSweep() {
        // @TODO
    }


    static toggle() {
        APU.master_enable = !APU.master_enable;

        if(APU.master_enable) {
            showMessage("This feature is NOT fully supported and is not designed for public use", "Experimental Feature");
        } else {
            c.apu.enabled = false;
        }

        APU.set_button_text();
        
        Settings.set_core("sound", APU.master_enable);
    }
}


APU.set_button_text();