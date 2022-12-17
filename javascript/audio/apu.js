

class APU {
    static master_enable = Settings.get_core("sound", false) == 'true';
    static master_vol_multiplier = 4; // half of max output

    static set_button_text() {
        document.getElementById('sndButton').innerHTML = APU.master_enable ? "yes" : "no";
    }

    constructor(cpu) {
        this.cpu = cpu;
        this._enabled = false; // set by the gameboy @see APU.enabled
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.c1_vol = 0;
        this.c2_vol = 0;
        this.c3_vol = 0;

        this.c1 = new Channel1(this);
        this.c2 = new Channel2(this);
        this.c3 = new Channel3(this);

        this.audioCtx.suspend();
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(v) {
        this._enabled = v;

        if(v) {
            this.audioCtx.resume();
            return;
        }

        this.c1.enabled = false;
        this.c2.enabled = false;
        this.c3.enabled = false;
        this.audioCtx.suspend();
    }


    mute() {
        this.c1.setVolume(0);
        this.c2.setVolume(0);
        this.c3.setVolume(0);
    }

    unmute() {
        this.c1.setVolume(this.c1_vol);
        this.c2.setVolume(this.c2_vol);
        this.c3.setVolume(this.c3_vol);
    }

    tick(cycles) {
        if(!APU.master_enable)
            return;

        this.c1.tick(cycles);
        this.c2.tick(cycles);
        // this.c3.tick(cycles);
    }


    accepts(addr) {
        return addr >= 0xFF10 && addr <= 0xFF3F;
    }

    write8(addr, byte) {
        if(!APU.master_enable)
            return;
        
        if(this.c1.accepts(addr)) {
            this.c1.write8(addr, byte);
        } else if(this.c2.accepts(addr)) {
            this.c2.write8(addr, byte);
        } else if(this.c3.accepts(addr)) {
            this.c3.write8(addr, byte);
        }

        switch(addr & 0xFF) {
            case 0x24: // NR50 master vol & VIN panning
                // @todo
                // note that VIN can be ignored since we don't use ch5
                break;
            case 0x25: // NR51 sound panning
                // @todo
                break;
            case 0x26: // NR52 sound on/off
                this.enabled = UInt8.getBit(byte, 7);
                break;
        }
    }

    read8(addr) {
        if(this.c1.accepts(addr))
            return this.c1.read8(addr);
        else if(this.c2.accepts(addr))
            return this.c2.read8(addr);
        else if(this.c3.accepts(addr))
            return this.c3.read8(addr);

        switch(addr & 0xFF) {
            case 0x26: // @todo add other channels and update mask
                if(!this.enabled)
                    return 0x7F;

                let reg = (this.enabled << 7) | 0x70;
                reg |= this.c1.enabled ? 1 : 0;
                reg |= this.c2.enabled ? 2 : 0;
                reg |= this.c3.enabled ? 4 : 0;
                // reg |= this.c4.enabled ? 8 : 0;
                
                return reg;
        }

        return 0xFF;
    }

    static toggle() {
        APU.master_enable = !APU.master_enable;

        if(APU.master_enable) {
            Menu.message.show("This feature is NOT fully supported and is not designed for general use", "Experimental Feature");
            c.apu.audioCtx.resume();
        } else {
            c.apu.enabled = false;
        }

        APU.set_button_text();
        
        Settings.set_core("sound", APU.master_enable);
    }
}


APU.set_button_text();