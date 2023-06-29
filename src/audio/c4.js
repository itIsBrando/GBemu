class Channel4 extends Channel1 {
    constructor(parent) {
        super(parent);

        this.lfsr = 0x7fff;
        this.lfsr_width_is_byte = false;
        this.clock_shift = 0;
        this.clock_div = 0;
        this.freq = 0;

        this.cycles = 0;
    }

    createAudioNodes(audioCtx) {
        this.oscillator = audioCtx.createConstantSource();
        this.gainNode = audioCtx.createGain();
        this.panNode = audioCtx.createStereoPanner();

        this.gainNode.gain.value = 0;
        this.panNode.pan.value = 0;

        this.oscillator.connect(this.gainNode).connect(this.panNode).connect(audioCtx.destination);
        this.oscillator.start();
    }


    accepts(addr) {
        return (addr >= 0xff20 && addr <= 0xff23);
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x20:
                this.length_timer = 0x3f - (byte & 0x3f);
                break;
            case 0x21:
                this.env_pace_shadow = byte & 0x07;
                this.env_direction = (byte & 0x08) ? Envelope.UP : Envelope.DOWN;
                this.env_volume_shadow = (byte & 0xf0) >> 4;

                this.dac_enabled = (byte & 0xf8)!= 0;

                if(!this.dac_enabled) {
                    this.enabled = false;
                }
                break;
            case 0x22:
                // vvv 0=15bits, 1= 7bits
                this.lfsr_width_is_byte = (byte & 0x8) != 0;
                this.clock_shift = (byte & 0xf0) >> 4;
                this.clock_div = byte & 0x7;
                break;
            case 0x23:
                this.length_enable = UInt8.getBit(byte, 6);

                if(byte & 0x80)
                    this.trigger();
                break;
        }
    }

    read8(addr) {
        switch(addr & 0xFF) {
            case 0x20: // NR41
                return 0xff;
            case 0x21: // NR42
                return (this.env_volume << 4) | (this.env_direction << 3) | this.env_pace;
            case 0x22: // NR43
                return 0x00 | (this.clock_shift << 4) | (this.lfsr_width_is_byte << 3) | this.clock_div;
            case 0x23: // NR44
                return 0xbf | (this.length_enable << 6);
        }
    }

    getFrequency() {
        const divisors = [8, 16, 32, 48, 64, 80, 96, 112];
        return divisors[this.clock_div] << this.clock_shift;
    }

    /**
     * Must override parent
     * @param {Number} w
     */
    setWavelength(w) {

    }


    tick(cycles) {
        if(!this.enabled)
            return;

        this.cycles += cycles;

        while(this.cycles >= this.freq) {
            const next_bit = (UInt8.getBit(this.lfsr, 0) ^ UInt8.getBit(this.lfsr, 1)) | 0;
            this.cycles -= this.freq;

            this.lfsr >>= 1;

            // change bit 15 to next bit
            this.lfsr |= next_bit << 14;

            // change bit 7 if lfsr is 7-bit mode
            if(this.lfsr_width_is_byte) {
                this.lfsr |= next_bit << 6;
            }
        }

        if(this.lfsr_lsb & 1) {
            this.oscillator.offset.value = -1;
        } else {
            this.oscillator.offset.value = 1;
        }
    }

    trigger() {
        this.enabled = true;
        this.envelope_enabled = this.env_pace !== 0;
        this.env_volume = this.env_volume_shadow;

        this.setVolume(this.env_volume);

        this.freq = this.getFrequency();
        this.lfsr = 0x7fff;
        this.cycles = 0;

        if(this.length_timer === 0)
            this.length_timer = 64;

        // obscure behavior
        if(this.env_pace_shadow === 0) {
            this.env_pace = 8;
        } else {
            this.env_pace = this.env_pace_shadow;
        }

        if(!this.dac_enabled)
            this.enabled = false;

    }


    /**
     * Sets the volume of the channel. Updates AudioContext
     * @param {Number} v 0-15
     */
    setVolume(v) {
        if(!this.dac_enabled || !APU.master_enable)
            v = 0;

        // this.gainNode.gain.value = 0.05 * (v & 0xf);
        this.gainNode.gain.value = 0;
    }


}