const Sweep = {
    UP: false,
    DOWN: true,
};

const Envelope = {
    DOWN: false,
    UP: true,
};

const APU_CLK               = 4194304;
const SWEEP_STEP_LEN        = APU_CLK / 128;
const ENVELOPE_STEP_LEN     = APU_CLK / 64;
const LENGTH_STEP_LEN       = APU_CLK / 256;


class Channel1 {
    
    constructor(parent) {
        this.parent = parent; // APU
        this._enabled = false;
        this.oscillator = parent.audioCtx.createOscillator();
        this.gainNode = parent.audioCtx.createGain();

        this.gainNode.gain.value = 0;
        
        this.oscillator.type = 'square';
        this.oscillator.connect(this.gainNode).connect(parent.audioCtx.destination);
        this.oscillator.start();

        // this.wave = parent.audioCtx.createPeriodicWave(real, imag);

        /**
         * NR10:
         *  xpppcsss
         * p= sweep Pace
         * d= sweep direction
         * s= sweep Slope
         */
        this.sweep_pace = 0; // in 128Hz a tick
        this.sweep_pace_shadow = 0;
        this.sweep_pace_cycles = 8 * SWEEP_STEP_LEN;
        this.sweep_direction = Sweep.UP; // 0=>up | 1=>down
        this.sweep_slope = 0; // 0-7
        this.sweep_enable = false;
        
        /**
         * NR11:
         *  ddllllll
         * d= wave duty (rw)
         * l= length timer (w)
         */
        this.wave_duty = 0;
        this.length_timer = 0;
        // this.length_timer_shadow = 0;

        /**
         * NR12:
         *  vvvvvdpp
         * v= volume of envelope
         * d= envelope direction
         * pp = envelope pace
         */
        this.env_volume = 0;
        this.env_volume_shadow = 0;
        this.env_direction = Envelope.DOWN;
        this.env_pace = 0;
        /**
         * 
         * NR13:
         *  wwwwwwww
         * w= lower  byte of wavelength (w)
         */
        this.wavelength = 0;

        /**
         * 
         * NR14:
         *  tcxxxwww
         * t = trigger (w)
         * c = sound length enable (rw)
         * w= upper three bits of wavelength (w)
         */
        this.length_enable = false;

        this.envelope_enabled = false; // when volume == 0 or 15 then we stop update envelope
        this.dac_enabled = false;
        this.NRx0 = 0xff10;
        this.NRx1 = 0xff11;
        this.NRx2 = 0xff12;
        this.NRx3 = 0xff13;
        this.NRx4 = 0xff14;

        this.env_ticks = 0; // runs at 64Hz
        this.sweep_ticks = 0; // runs at 128Hz
        this.length_ticks = 0; // runs at 256hz
    }

    accepts(addr) {
        return addr >= 0xFF10 && addr <= 0xFF14;
    }

    calculateSweep() {
        let w = this.wavelength;
        const dw = w >> this.sweep_slope;

        w += this.sweep_direction == Sweep.UP ? dw : -dw;
        if(w > 0x7ff) {
            w = 0;
            this.enabled = false;
        }
            
        return w;
    }


    updateSweep() {
        this.sweep_ticks -= this.sweep_pace_cycles;

        // L(t+1) = L(t) + L(t)/2^n
        if(this.sweep_pace != 0) {
            const w = this.calculateSweep();
            if(this.sweep_slope != 0) {
                this.setWavelength(w);

            }
        }
        
        this.calculateSweep();
    }

    updateEnvelope() {
        this.env_ticks -= ENVELOPE_STEP_LEN * this.env_pace;
        // if envelope sweep is enabled
        if(!this.envelope_enabled)
            return;
        this.env_volume += this.env_direction == Envelope.UP ? 1 : -1;

        if(this.env_volume > 15 || this.env_volume < 0)
            this.envelope_enabled = false;
            
        this.env_volume &= 0xf;
        this.setVolume(this.env_volume);
    }


    tick(cycles) {
        this.env_ticks += cycles;
        this.length_ticks += cycles;
        this.sweep_ticks += cycles;
        
        if(this.env_pace != 0 && this.env_ticks >= ENVELOPE_STEP_LEN * this.env_pace) {
            this.updateEnvelope();
        }
        
        // sweep pace = sweep period
        // sweep slope = sleep shift
        if(this.enabled) {
            while(this.sweep_enable && this.sweep_ticks >= this.sweep_pace_cycles) {
                this.updateSweep();
            }
        }

        this.tick_length();
    }

    
    write8(addr, byte) {
        switch(addr) {
            case this.NRx0:
                this.sweep_pace_shadow = UInt8.getRange(byte, 4, 3);
                this.sweep_direction = UInt8.getBit(byte, 3);
                this.sweep_slope = byte & 0x7;

                this.sweep_pace_cycles = (this.sweep_pace_shadow == 0 ? 8 : this.sweep_pace_shadow) * SWEEP_STEP_LEN; // 128Hz
                break;
            case this.NRx1:
                this.wave_duty = UInt8.getRange(byte, 6, 2);
                this.length_timer = 64 - (byte & 0x3f);
                break;
            case this.NRx2:
                this.env_volume_shadow = UInt8.getRange(byte, 4, 4);
                this.env_direction = UInt8.getBit(byte, 3) ? Envelope.UP : Envelope.DOWN;
                this.env_pace = byte & 7;
                this.dac_enabled = (byte & 0xf8) > 0;
                if(!this.dac_enabled)
                    this.enabled = false;
                
                break;
            case this.NRx3:
                this.setWavelengthLow(byte);
                break;
            case this.NRx4:
                this.length_enable = Boolean(UInt8.getBit(byte, 6));
                this.setWavelengthHigh(byte);
                //trigger
                if(UInt8.getBit(byte, 7) && !this.enabled) {
                    this.trigger();
                }
                break;

        }

    }

    trigger() {
        this.envelope_enabled = true;
        this.env_volume = this.env_volume_shadow;
        this.sweep_pace = this.sweep_pace_shadow;
        
        this.setVolume(this.env_volume);
        this.env_ticks = 0;
        this.length_ticks = 0;
        this.sweep_ticks = 0;
        
        this.sweep_enable = this.sweep_slope || this.sweep_pace;
        
        if(this.length_timer == 0)
        this.length_timer = 64;
        
        if(this.sweep_slope != 0)
        this.calculateSweep();
        
        this.enabled = this.dac_enabled;
    }

    tick_length() {
        if(this.length_ticks < LENGTH_STEP_LEN) {
            return;
        }
        this.length_ticks -= LENGTH_STEP_LEN;

        if(!this.length_enable)
            return;

        this.length_timer--;

        if(this.length_timer <= 0) {
            this.length_timer = 0;
            this.enabled = false;
        }

    }

    set enabled(v) {
        if(v == false) {
            this.gainNode.gain.value = 0;
        }
        this._enabled = v;
    }

    get enabled() {
        return this._enabled;
    }


    read8(addr) {
        switch(addr & 0xFF) {
            case this.NRx0:
                return 0xff; // @todo  this is readable
            case this.NRx1:
                return (this.wave_duty << 6) | 0x3F;
            case this.NRx2:
                return 0xff; // @todo this is readble
            case this.NRx3:
                return 0xff;
            case this.NRx4:
                return (this.length_enable << 6) | 0b1011111;
        }

        return 0xFF;
    }

    getFrequency() {
        return 131072 / (2048 - this.wavelength);
    }

    setWavelength(w) {
        this.wavelength = w & 0x7ff;
        this.oscillator.frequency.value = this.getFrequency();
    }

    setWavelengthLow(f) {
        this.setWavelength((this.wavelength & 0x700) | (f & 0xFF));
    }
    
    setWavelengthHigh(f) {
        this.setWavelength((this.wavelength & 0xff) | ((f & 0x7) << 8));
    }


    /**
     * Sets the volume of the channel. Updates AudioContext
     * @param {Number} v 0-15
     */
    setVolume(v) {
        if(!this.dac_enabled)
            v = 0;
        
        this.gainNode.gain.value = 6 * (v & 0xf);
    }

}