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
        this.oscillator = null;
        this.gainNode = null;
        this.panNode = null;

        this.createAudioNodes(parent.audioCtx);

        /**
         * NR10:
         *  xpppcsss
         * p= sweep Pace
         * d= sweep direction
         * s= sweep Slope
         */
        this.sweep_pace = 0; // 128Hz
        this.sweep_pace_shadow = 0;
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
        this.env_pace_shadow = 0;
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
    }

    createAudioNodes(audioCtx) {
        this.oscillator = audioCtx.createOscillator();
        this.gainNode = audioCtx.createGain();
        this.panNode = audioCtx.createStereoPanner();

        this.gainNode.gain.value = 0;
        this.panNode.pan.value = 0;
        this.oscillator.type = 'square';


        this.oscillator.connect(this.gainNode).connect(this.panNode).connect(audioCtx.destination);
        this.oscillator.start();
    }

    reset() {
        this.setVolume(0);
    }

    accepts(addr) {
        return addr >= 0xFF10 && addr <= 0xFF14;
    }

    calculateSweep() {
        // L(t+1) = L(t) + L(t)/2^n
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
        if(!this.enabled || !this.sweep_enable)
            return;

        if(--this.sweep_pace <= 0) {
            const w = this.calculateSweep();

            if(this.sweep_pace_shadow === 0) {
                this.sweep_pace = 8;
            } else {
                this.sweep_pace = this.sweep_pace_shadow;
                if(this.sweep_slope !== 0) {
                    this.setWavelength(w);
                }

                this.calculateSweep();
            }
        }

    }

    updateEnvelope() {
        // if envelope sweep is enabled
        if(!this.envelope_enabled)
            return;

        if(--this.env_pace <= 0) {
            if(this.env_pace_shadow === 0) {
                this.env_pace = 8;
            } else {
                const vol = this.env_volume + (this.env_direction == Envelope.UP ? 1 : -1);
                this.env_pace = this.env_pace_shadow;

                if(vol > 15 || vol < 0)
                    this.envelope_enabled = false;
                else
                    this.env_volume = vol;

                this.setVolume(this.env_volume);
            }
        }
    }


    write8(addr, byte) {
        switch(addr) {
            case this.NRx0:
                this.sweep_pace_shadow = UInt8.getRange(byte, 4, 3);
                this.sweep_direction = UInt8.getBit(byte, 3);
                this.sweep_slope = byte & 0x7;
                break;
            case this.NRx1:
                this.wave_duty = UInt8.getRange(byte, 6, 2);
                this.length_timer = 64 - (byte & 0x3f);
                break;
            case this.NRx2:
                this.env_volume_shadow = UInt8.getRange(byte, 4, 4);
                this.env_direction = UInt8.getBit(byte, 3) ? Envelope.UP : Envelope.DOWN;
                this.env_pace_shadow = byte & 7;
                this.dac_enabled = (byte & 0xf8) != 0;

                if(!this.dac_enabled)
                    this.enabled = false;

                break;
            case this.NRx3:
                this.setWavelengthLow(byte);
                break;
            case this.NRx4:
                const trigger = UInt8.getBit(byte, 7);
                const old_enable = this.length_enable;
                this.length_enable = UInt8.getBit(byte, 6);
                this.setWavelengthHigh(byte);

                const frame_sequencer_obscure_behavior = (this.parent.frame_sequencer & 1) === 0;

                if(frame_sequencer_obscure_behavior) {
                    if(!old_enable && this.length_enable && this.length_timer > 0) {
                        this.length_timer--;

                        if(!trigger && this.length_timer === 0) {
                            this.enabled = false;
                        }
                    }
                }

                if(trigger) {
                    this.trigger();

                    if(frame_sequencer_obscure_behavior && this.length_timer === 64 && this.length_enable) {
                        this.length_timer--;
                    }
                }

                break;

        }

    }


    trigger() {
        this.enabled = true;
        this.envelope_enabled = true;
        this.env_volume = this.env_volume_shadow;

        this.setVolume(this.env_volume);

        // obscure behavior
        if(this.sweep_pace_shadow === 0) {
            this.sweep_pace = 8;
        } else {
            this.sweep_pace = this.sweep_pace_shadow;
        }

        // obscure behavior
        if(this.env_pace_shadow === 0) {
            this.env_pace = 8;
        } else {
            this.env_pace = this.env_pace_shadow;
        }

        this.sweep_enable = this.sweep_slope || this.sweep_pace_shadow;

        if(this.length_timer === 0)
            this.length_timer = 64;

        if(this.sweep_slope !== 0)
            this.calculateSweep();

        if(!this.dac_enabled)
            this.enabled = false;
    }


    tick_length() {
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
        switch(addr) {
            case this.NRx0:
                return (this.sweep_pace_shadow << 4) | (this.sweep_direction << 3) | this.sweep_slope;
            case this.NRx1:
                return (this.wave_duty << 6) | 0x3F;
            case this.NRx2:
                return (this.env_volume_shadow << 4) | (this.env_direction << 3) | this.env_pace;
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
        this.oscillator.frequency.value = Math.max(Math.min(this.getFrequency(), this.oscillator.frequency.maxValue), this.oscillator.frequency.minValue);
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
        if(!this.dac_enabled || !APU.master_enable)
            v = 0;

        this.gainNode.gain.value = 0.02 * (v & 0xf) * APU.master_vol;
    }


    /**
     * Sets left/right channel panning
     * @param {Number} left left side panning
     * @param {Number} right side panning
     */
    setPan(left, right) {
        let v = 0;

        if(left)
            v -= 1;
        if(right)
            v += 1;

        this.panNode.pan.value = v;
    }

}