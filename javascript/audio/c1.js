class Channel1 {

    constructor(parent) {
        this.parent = parent; // APU
        this._enabled = false;

        this.wave_duty = 0;
        this.sound_length = 0;

        this.freq = 0;
        this.freqTimer = 0;
        this.timed = false;
        this.reset = false;

        this.nr10 = 0;
        this.nr11 = 0;
        this.nr14 = 0;

        this.sweep_timer = 0;
        this.sweep_enabled = 0;
        this.sweep_time = 0;
    }

    accepts(addr) {
        return addr >= 0xFF10 && addr <= 0xFF14;
    }

    tick(cycles) {
        if(this.reset) {
            this.enabled = true;

            this.freqTimer = this.getFrequency();
            this.reset = false;

            this.sound_length = 64 - (this.nr11 & 0x1F);
        }


        this.freqTimer -= cycles;
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x10:
                this.nr10 = byte;
                break;
            case 0x11:
                this.wave_duty = UInt8.getRange(byte, 6, 2);
                this.nr11 = byte;
                break;
            case 0x12:
                break;
            case 0x13:
                this.setFreqLow(byte)
                break;
            case 0x14:
                this.reset = UInt8.getBit(byte, 7);
                this.timed = UInt8.getBit(byte, 6);
                this.nr14 = byte;
                this.setFreqHigh(byte);
                synth.triggerAttack(131072 / (2048 - this.freq), now);
                break;

        }

    }

    tickLength() {
        if(this.timed)
            this.sound_length--;

        if(this.sound_length == 0)
            this.enabled = false;

        
    }

    set enabled(v) {
        if(v == false)
            synth.triggerRelease();
        this._enabled = v;
    }

    get enabled() {
        return this._enabled;
    }

    tickSweep() {
        this.sweep_timer--;

        if(this.sweep_timer < 0) {
            this.resetSweep();

            if(this.sweep_enabled && this.sweep_time > 0) {
                const newFreq = this.getSweepTimer();

                if(newFreq < 2048 && this.sweep_amount > 0) {
                    this.freq = newFreq
                    this.freqTimer = this.getFrequency();
                }
            }
        }
    }

    resetSweep() {
        this.sweep_timer = UInt8.getRange(this.nr10, 4, 3);

        if(this.sweep_timer == 0)
            this.sweep_timer = 8;
    }

    getSweepTimer() {
        const newFreq = 0;

        if(newFreq > 2048)
            this.enabled = false;

        return newFreq;
    }

    read8(addr) {
        switch(addr & 0xFF) {
            case 0x10:
                return this.nr10;
            case 0x11:
                return (this.wave_duty << 6) | 0x3F;
            case 0x12:
                return this.nr12;
            case 0x14:
                return this.nr14 | 0xBF;
        }

        return 0xFF;
    }

    getFrequency() {
        return (2048 - this.freq) * 4;
    }

    setFreqLow(f) {
        this.freq = (this.freq & 0x300) | (f & 0xFF);
    }
    
    setFreqHigh(f) {
        this.freq = (this.freq & 0xFF) | ((f & 0x3) << 8);
    }

}