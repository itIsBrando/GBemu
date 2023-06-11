const QUEUE_CYCLES = 4_194_304 / 44000;

class Channel3 {
        
    constructor(parent) {
        this.parent = parent; // APU
        this._enabled = false;
        this.buffer = parent.audioCtx.createBuffer(1, 8192, parent.audioCtx.sampleRate);
        this.gainNode = parent.audioCtx.createGain();
        
        this.gainNode.gain.value = 0;
        
        this.queue = new Float32Array(this.buffer.length);
        this.queue_index = 0;
        this.queue_cycles = 0;
        
        /**
         * NR10:
         *  exxxxxxx
         * e=enable
         */
        
        /**
         * NR11:
         *  llllllll
         * l= length timer (w)
         */
        this.length_timer = 0;

        /**
         * NR12:
         *  xvvxxxxx
         * v= output level
         */
        this.output_level = 0;
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

        this.length_ticks = 0; // runs at 256hz
        this.frequency_timer = 0;
        this.wave_offset = 0;
        this.wave = new Uint8Array(16);
    }

    accepts(addr) {
        return (addr >= 0xff1a && addr <= 0xff1e)
         || (addr >= 0xff30 && addr <= 0xff3f);
    }

    tick(cycles) {
        this.length_ticks += cycles;
        this.queue_cycles += cycles;

        if(this.length_ticks >= 256) {
            this.length_ticks -= 256;
            this.tick_length();
        }


        if(this.queue_cycles >= QUEUE_CYCLES) {
            let s = this.getSample();

            this.queue_cycles -= QUEUE_CYCLES;
            s = (s + (s - 0xf)); // >> volshift
            s /= 0xf;
            // step queue
            this.queue[this.queue_index++] = s;
            if(this.queue_index > this.queue.length) {
                this.queue_index = 0;
                this.playBuffer();
            }
        }

        // freq
        this.frequency_timer -= cycles;
        if(this.frequency_timer <= 0) {
            this.frequency_timer += (2048 - this.wavelength) << 1;

            this.wave_offset++;
            this.wave_offset &= 0x1f;
        }
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x1a:
                this.enabled = UInt8.getBit(byte, 7);
                break;
            case 0x1b:
                this.length_timer = byte;
                break;
            case 0x1c:
                this.output_level = UInt8.getRange(byte, 5, 2);
                break;
            case 0x1d:
                this.setWavelengthLow(byte);
                break;
            case 0x1e:
                this.length_enable = Boolean(UInt8.getBit(byte, 6));
                this.setWavelengthHigh(byte);
                if(UInt8.getBit(byte, 7)) {
                    // @todo this is restart thing
                }
                break;
            default:
                if((addr & 0xf0) == 0x30) {
                    this.wave[addr & 0xf] = byte;
                }
        }

    }


    read8(addr) {
        switch(addr & 0xFF) {
            case 0x1a:
                return 0xff; // @todo is this readable???
            case 0x1b:
                return 0xff;
            case 0x1c:
                return 0xff; // @todo is this readable??
            case 0x1d:
                return 0xff;
            case 0x1e:
                return (this.length_enable << 6) | 0b1011111;
            default:
                return this.wave[addr & 0xf];
        }
    }


    tick_length() {
        if(this.length_enable)
            this.sound_length++;

        if(this.sound_length >= 64)
            this.enabled = false;

    }

    set enabled(v) {
        if(v == false)
            this.gainNode.gain.value = 0;
        else
            this.gainNode.gain.value = 1;
        this._enabled = v;
    }

    get enabled() {
        return this._enabled;
    }

    getFrequency() {
        return 65536 / (2048 - this.wavelength);//(2048 - this.wavelength) * 4;
    }

    setWavelength(w) {
        this.wavelength = w & 0x7ff;
    }

    setWavelengthLow(f) {
        this.setWavelength((this.wavelength & 0x700) | (f & 0xFF));
    }
    
    setWavelengthHigh(f) {
        this.setWavelength((this.wavelength & 0xff) | ((f & 0x7) << 8));
    }

    getSample() {
        return this.wave[this.wave_offset >> 1] >> (!(this.wave_offset & 1) * 4);
    }

    playBuffer() {
        let source = this.parent.audioCtx.createBufferSource();
        source.buffer = this.buffer;
        source.connect(this.gainNode).connect(this.parent.audioCtx.destination);
        // source.start();

        // this.buffer.copyToChannel(this.queue, 0);
    }


    /**
     * Sets the volume of the channel. Updates AudioContext
     * @param {Number} v 0-15
     * @todo
     */
    setVolume(v) {
        this.gainNode.gain.value = 0; // 6.66 * (v & 0xf);
    }

}