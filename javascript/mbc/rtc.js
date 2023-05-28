class RTC {
    constructor() {
        this.latchedStart = 0;
        this.registerTime = 0;
        
        this.latSeconds = 0;
        this.latMinutes = 0;
        this.latHours = 0;
        this.latDays = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;
        
        this.isHalted = false;
        this.date = new Date();
        this.clockStart = this.date.getTime();
    }

    
    /**
     * latches data using actual time.
     */
    latchRTC() {
        this.latchedStart = this.date.getTime();
    }
    
    unlatchRTC() {
        this.latchedStart = 0;
    }
    
    setHalt(h) {
        if(h && !this.isHalted) {
            this.latchRTC();
            this.latSeconds = this.seconds;
            this.latMinutes = this.minutes;
            this.latHours = this.hours;
            this.latDays = this.days;
            this.unlatchRTC();
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
                this.seconds = val;
                break;
            case 0x9:
                this.minutes = val;
                break;
            case 0xA:
                this.hours = val;
                break;
            case 0xB:
                this.days &= 0x100;
                this.days |= val;
                break;
            case 0xC:
                this.days &= 0xFF;
                this.days |= (val & 1) << 8;
                this.isHalted = UInt8.getBit(val, 6);
                break;
        }
    }
    
    read(i) {
        switch(i) {
            case 0x8:
                return this.seconds;
            case 0x9:
                return this.minutes;
            case 0xA:
                return this.hours;
            case 0xB:
                return this.days & 0xFF;
            case 0xC:
                let out = (this.days & 0x100) >> 8;
                return out | (this.isHalted ?  0x40 : 0);
            default:
                return 0xFF;
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

    getDayCounter() {
        return this.currentTime() % (60 * 60 * 24 * 512) / (60 * 60 * 24);
    }


    currentTime() {
        let now = 0;

        if(this.latchedStart == 0) {
            now = this.date.getTime();
        } else {
            now = this.latchedStart;
        }

        return (now - this.clockStart) / 1000 + this.registerTime;
    }
}