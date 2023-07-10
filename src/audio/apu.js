/**
 * Sound tests passed:
 * - 2 len ctr (ch1 and ch2)
 * - 3 trigger (ch1 and ch2)
 * - 4 sweep
 * - 7 len sweep period sync
 */
const sndButton = document.getElementById('sndButton');
const sndSlider = document.getElementById('sndSlider');

class APU {
    static master_enable = false; //Settings.get_core("sound", false) == 'true';
    static master_vol = 1;

    static set_button_text() {
        sndButton.checked = APU.master_enable;
    }

    constructor(cpu) {
        this.cpu = cpu;
        this._enabled = false; // set by the gameboy @see APU.enabled
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.c1_vol = 0;
        this.c2_vol = 0;
        this.c3_vol = 0;
        this.c4_vol = 0;

        this.NR50 = 0;
        this.NR51 = 0;

        this.c1 = new Channel1(this);
        this.c2 = new Channel2(this);
        this.c3 = new Channel3(this);
        this.c4 = new Channel4(this);

        this.apu_ticks = 0;
        this.frame_sequencer = 0;

        this.write8(0xff26, 0xf0);
        this.write8(0xff25, 0xf3);
        this.write8(0xff24, 0x77);

        this.audioCtx.suspend();
    }

    export() {
        // @todo
    }

    import(data) {
        const d = data["apu"];
        // @todo
    }

    reset() {
        this.apu_ticks = 0;
        this.frame_sequencer = 0;
        this.c1.reset();
        this.c2.reset();
        // this.c3.reset();
        this.c4.reset();
    }

    get enabled() {
        return this._enabled;
    }

    set enabled(v) {
        if(v) {
            if(!this._enabled) {
                this.frame_sequencer = 7;
            }
            this.audioCtx.resume();
        } else {
            this.c1.enabled = false;
            this.c2.enabled = false;
            this.c3.enabled = false;
            this.c4.enabled = false;
            this.audioCtx.suspend();
        }

        this._enabled = v;
    }


    mute() {
        this.c1.setVolume(0);
        this.c2.setVolume(0);
        this.c3.setVolume(0);
        this.c4.setVolume(0);
    }

    /**
     * @note this does nothing since `cx_vol` is always 0
     */
    unmute() {
        this.c1.setVolume(this.c1_vol);
        this.c2.setVolume(this.c2_vol);
        this.c3.setVolume(this.c3_vol);
        this.c4.setVolume(this.c4_vol);
    }

    tick(cycles) {
        if(!APU.master_enable || !this.enabled) {
            return;
        }

        this.apu_ticks += cycles;

        this.c4.tick(cycles);

        if(this.apu_ticks >= 8192) {
            this.apu_ticks -= 8192;
            this.clockSequencer();
        }
    }

    clockSequencer() {
        this.frame_sequencer++;
        this.frame_sequencer &= 7;

        switch(this.frame_sequencer) {
            case 0:
            case 4:
                this.c1.tick_length();
                this.c2.tick_length();
                this.c3.tick_length();
                this.c4.tick_length();
                break;
            case 2:
            case 6:
                this.c1.tick_length();
                this.c2.tick_length();
                this.c3.tick_length();
                this.c4.tick_length();

                this.c1.updateSweep();
                break;
            case 7:
                this.c1.updateEnvelope();
                this.c2.updateEnvelope();
                this.c4.updateEnvelope();
                break;
        }
    }


    accepts(addr) {
        return (addr >= 0xff10 && addr <= 0xff1e)
         || (addr >= 0xff20 && addr <= 0xff26)
          || (addr >= 0xff30 && addr <= 0xff3f);
    }

    // @todo WAVE RAM is readable and writable despite power state
    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x24: // NR50 master vol & VIN panning
                // @todo
                // note that VIN can be ignored since we don't use ch5
                // ^ wtf are you talking about (from brando in the future Mar 1, 2023)
                this.NR50 = byte;
                break;
                case 0x25: // NR51 sound panning
                // @todo
                this.NR51 = byte;
                this.c1.setPan(byte & 0x10, byte & 1);
                this.c2.setPan(byte & 0x20, byte & 2);
                this.c3.setPan(byte & 0x40, byte & 4);
                this.c4.setPan(byte & 0x80, byte & 8);
                break;
            case 0x26: // NR52 sound on/off
                this.enabled = UInt8.getBit(byte, 7);
                break;
            default:
                // block ALL writes if disabled
                if(!this.enabled)
                    return;

                if(this.c1.accepts(addr)) {
                    this.c1.write8(addr, byte);
                } else if(this.c2.accepts(addr)) {
                    this.c2.write8(addr, byte);
                } else if(this.c3.accepts(addr)) {
                    this.c3.write8(addr, byte);
                } else if(this.c4.accepts(addr)) {
                    this.c4.write8(addr, byte);
                }
        }
    }

    /**
     * Register reading from gbdev
     * @see https://gbdev.gg8.se/wiki/articles/Gameboy_sound_hardware
     */
    read8(addr) {
        switch(addr & 0xFF) {
            case 0x24:
                return this.NR50;
            case 0x25:
                return this.NR51;
            case 0x26:
                if(!this.enabled)
                    return 0x70;

                let reg = (this.enabled << 7) | 0x70;
                reg |= this.c1.enabled ? 1 : 0;
                reg |= this.c2.enabled ? 2 : 0;
                reg |= this.c3.enabled ? 4 : 0;
                reg |= this.c4.enabled ? 8 : 0;

                return reg;
            default:
                if(!this.enabled)
                    return 0xff;

                if(this.c1.accepts(addr))
                    return this.c1.read8(addr);
                else if(this.c2.accepts(addr))
                    return this.c2.read8(addr);
                else if(this.c3.accepts(addr))
                    return this.c3.read8(addr);
                else if(this.c4.accepts(addr))
                    return this.c4.read8(addr);
                else
                    return 0xFF;
        }

    }

    static setEnabled(turnOn) {
        APU.master_enable = turnOn;

        if(APU.master_enable) {
            c.apu.audioCtx.resume();
        } else {
            c.apu.enabled = false;
        }

        APU.set_button_text();

        Settings.set_core("sound", APU.master_enable);
    }

    static toggle() {
        APU.setEnabled(!APU.master_enable);
    }
}

sndSlider.addEventListener('change', (e) => {
    APU.master_vol = e.target.value;
    Menu.alert.show(`Volume set to ${APU.master_vol * 100}%`);
});

APU.set_button_text();