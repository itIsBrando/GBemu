class RTC {
    constructor() {
        this.latchedStart = 0;
        this.registerTime = 0;
        
        this.latSeconds = 0;
        this.latMinutes = 0;
        this.latHours = 0;
        this.latDays = 0;

        this.isHalted = false;
        this.date = new Date();
        this.clockStart = this.date.getTime();
    }


    reset() {
        this.clockStart = this.date.getTime();
        this.isHalted = false;
    }
    
    /**
     * latches data using actual time.
     */
    latch() {
        this.latchedStart = this.date.getTime();
    }
    
    unlatch() {
        this.latchedStart = 0;
    }
    
    setHalt(h) {
        if(h && !this.isHalted) {
            this.latch();
            this.latSeconds = this.getSeconds();
            this.latMinutes = this.getMinutes();
            this.latHours = this.getHours();
            this.latDays = this.getDays();
            this.unlatch();
        } else if(!h && this.isHalted) {
            this.registerTime = this.latSeconds + this.latMinutes * 60 +
                this.latHours * 60 * 60 + this.latDays * 60 * 60 * 24;

            this.clockStart = this.date.getTime();
        }

        this.isHalted = h;
    }
    
    write(i, val) {
        switch(i) {
            case 0x8:
                this.setSeconds(val);
                break;
            case 0x9:
                this.setMinutes(val);
                break;
            case 0xA:
                this.setHours(val);
                break;
            case 0xB:
                this.setDays((this.getDays() & 0x100) | val);
                break;
            case 0xC:
                this.setHalt(UInt8.getBit(val, 6));
                if(UInt8.getBit(val, 7))
                    this.clearCounterOverflow();

                val = (val & 1) << 8;
                this.setDays((this.getDays() & 0xff) | val);
                break;
        }
    }

    /**
     * 
     * @returns {Boolean} true when day counter >= 512 days
     */
    dayCounterOverflow() {
        return this.currentTime() >= 60 * 60 * 24 * 512;
    }

    clearCounterOverflow() {
        while(this.dayCounterOverflow())
            this.registerTime -= 60 * 60 * 24 * 512;
    }
    
    read(i) {
        switch(i) {
            case 0x8:
                return this.getSeconds();
            case 0x9:
                return this.getMinutes();
            case 0xA:
                return this.getHours();
            case 0xB:
                return this.getDays() & 0xff;
            case 0xC:
                let out = 0x3e;
                out |= (this.getDays() >> 8) & 1;
                out |= this.dayCounterOverflow() ? 0x80 : 0; 
                return out | (this.isHalted ?  0x40 : 0);
            default:
                return 0xff;
        }
    }

    getSeconds() {
        return this.currentTime() % 60;
    }

    getMinutes() {
        return (this.currentTime() % (60 * 60)) / 60;
    }

    getHours() {
        return (this.currentTime() % (60 * 60 * 24)) / (60 * 60);
    }

    getDays() {
        return this.currentTime() % (60 * 60 * 24 * 512) / (60 * 60 * 24);
    }

    setSeconds(v) {
        if(this.isHalted)
            this.latSeconds = v;
    }

    setMinutes(v) {
        if(this.isHalted)
            this.latMinutes = v;
    }

    setHours(v) {
        if(this.isHalted)
            this.latHours = v;
    }

    setDays(v) {
        if(this.isHalted)
            this.latDays = v;
    }


    currentTime() {
        let now;

        if(this.latchedStart == 0) {
            now = this.date.getTime();
        } else {
            now = this.latchedStart;
        }

        return Math.floor((now - this.clockStart) / 1000) + this.registerTime;
    }
}