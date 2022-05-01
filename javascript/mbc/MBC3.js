// needs RTC support

class MBC3 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);

        this.date = new Date();
        this.regs = [
            0,      // seconds
            0,      // minutes
            0,      // hours
            0,      // lower 8-bits of day counter (0-ff)
            0,      // upper 1-bit of day counter
                    //  - bit 0: MSB of counter
                    //  - bit 6: Halt (0=active, 1=stopped)
                    //  - bit 7: Day Counter carry (1=overflow)
        ]

        this.latSeconds = 0;
        this.latMinutes = 0;
        this.latHours = 0;
        this.latDays = 0;
        
        this.isHalted = false;
        this.start = this.date.getTime();
    }
    
    /**
     * Overrides the cpu.write8 function
     * @param {CPU} cpu 
     * @param {UInt16} address 
     * @param {UInt8} byte 
     * @returns true if the CPU should allow the write to happen, otherwise false
     */
    write8(cpu, address, byte) {

        // 0x0000-0x1FFF RAM enable
        if(address < 0x2000) {
            this.ramEnable = (byte & 0x0A) != 0;
            return false;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            byte &= 0x7F;
            if(byte == 0) byte = 1;
            this.bank = byte;
            return false;
        // 0x4000-0x5FFF RAM bank or RTC
        } else if(address < 0x6000) {
            this.ramBank = byte;
            return false;
        // 0x6000-0x7FFF Latch Clock Data
        } else if(address < 0x8000)
        {
            // do some RTC stuff
            byte &= 0x1;
            if(this.latch == 0 && byte == 1)
            {
                this.latchRTC();
            }
            this.latch = byte;
            return false;
        // RAM
        } else if(address >= 0xA000 && address < 0xC000)
        {
            // ramEnable doubles up as an RTC enable
            // if ramBank>3, then we are trying to use RTC, not RAM
            if(this.ramEnable && this.ramBank >= 0x08 && this.ramBank <= 0x0C) {
                this.setRTC(this.ramBank, byte);
            // only allow writing if RAM is enabled
            //  and we are not looking at RTC
            } else if(this.ramEnable && this.ramBank <= 3) {
                this.ram[address - 0xA000 + (this.ramBank * 0x2000)] = byte;
            }

            return false;
        }

        return true;
    }
    
    /**
     * Overrides the cpu.write8 function
     * @param {CPU} cpu 
     * @param {UInt16} address
     * @returns the byte of memory if possible, or NULL
     */
    read8(cpu, address) {
        // ROM bank 0
        if(address < 0x4000) {
            return null
        // banks 01-7f
        } else if(address < 0x8000) {
            return this.rom[(this.bank * 0x4000) + address - 0x4000];
        // RAM A000-BFFF or RTC register
        } else if(address >= 0xA000 && address < 0xC000)
        {
            if(this.ramEnable && this.ramBank <= 3)
                return this.ram[address - 0xA000 + (this.ramBank * 0x2000)];
            else if(this.ramEnable && this.ramBank >= 0x8 && this.ramBank <= 0xC)
                return this.getRTC(this.ramBank);
            else
                return 0xFF;

        }

        return null;
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
            this.start = this.date.getTime();
        }
    }
    
    setRTC(i, val) {
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
    
    getRTC(i) {
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
    
    get seconds() {
        return this.getTimeInSeconds() % 60;
    }
    
    get minutes() {
        return (this.getTimeInSeconds() % (60 * 60)) / 60;
    }
    
    get hours() {
        return (this.getTimeInSeconds() % (60 * 60 * 24)) / (60 * 60);
    }
    
    get days() {
        return (this.getTimeInSeconds() % (60 * 60 * 24 * 512)) / (60 * 60 * 24);
    }
    
    set seconds(sec) {
        if(this.isHalted)
            this.latSeconds = sec;
    }
    
    
    set minutes(min) {
        if(this.isHalted)
            this.latMinutes = min;
    }
    
    
    set hours(hours) {
        if(this.isHalted)
            this.latHours = hours;
    }
    
    set days(days) {
        if(this.isHalted)
            this.latDays = days;
    }
    
    
    getTimeInSeconds() {
        let sec = 0;
        
        if(this.latchedStart == 0) {
            sec = this.date.getTime();
        } else {
            sec = this.latchedStart;
        }
        
        return Math.floor(sec - this.start) / 1000;
    }
}