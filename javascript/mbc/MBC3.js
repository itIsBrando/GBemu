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
        ];

        this.rtc = new RTC();

        this.isLatched = false;
        this.latch = 0;
    }

    reset() {
        this.rtc.reset();
    }

    handleExtraData() {
        const size = getRAMSize(this.ramSize, this.mbcNumber);
        const array = Array.from(externalSave);

        this.ram = externalSave;
        array.splice(0, size);
        
        // `array` now contains the remaining data needed for RTC
        CPU.LOG(`importing RTC regs: ${array}`);
        
        // @todo finish importing the registers
    }

    acceptsWrite(addr) {
        return (addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }

    acceptsRead(addr) {
        return (addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }
    
    write8(address, byte) {
        // 0x0000-0x1FFF RAM enable
        if(address < 0x2000) {
            this.ramEnable = (byte & 0x0A) != 0;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            byte &= 0x7F;
            if(byte == 0)
                byte = 1;
            this.bank = byte;
        // 0x4000-0x5FFF RAM bank or RTC
        } else if(address < 0x6000) {
            this.ramBank = byte;
        // 0x6000-0x7FFF Latch Clock Data
        } else if(address < 0x8000) {
            // do some RTC stuff
            if(this.latch == 0 && byte == 1) {
                if(this.isLatched) {
                    this.rtc.unlatch();
                    this.isLatched = false;
                } else {
                    this.rtc.latch();
                    this.isLatched = true;
                }
            }
            this.latch = byte;
        // RAM
        } else if(address >= 0xA000 && address < 0xC000)
        {
            // ramEnable doubles up as an RTC enable
            // if ramBank>3, then we are trying to use RTC, not RAM
            const addr = address - 0xA000 + (this.ramBank * 0x2000);
            
            if(this.ramBank > 3) {
                this.rtc.write(this.ramBank, byte);
            } else if(this.ramBank <= 3 && addr < this.ram.length) {
                this.ram[addr] = byte;
            }
        }
    }
    
    read8(address) {
        // ROM bank 0
        if(address < 0x4000) {
            return this.getROMByte(address, 0);
        // banks 01-7f
        } else if(address < 0x8000) {
            return this.getROMByte(address - 0x4000, this.bank);
        // RAM A000-BFFF or RTC register
        } else if(address >= 0xA000 && address < 0xC000)
        {
            if(!this.ramEnable)
                return 0xFF;
                
            if(this.ramBank <= 3)
                return this.ram[address - 0xA000 + (this.ramBank * 0x2000)];
            else
                return this.rtc.read(this.ramBank);
        }

        return 0xFF;
    }
    
    getROMByte(addr, bank) {
        const off = addr + (bank * 0x4000);
        
        if(off > this.rom.length)
            return 0xFF;
        
        return this.rom[off];
    }
}
