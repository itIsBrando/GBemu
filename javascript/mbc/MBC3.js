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

        this.latchedRegs = [
            0, 0, 0, 0, 0
        ]
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
                this.regs[this.ramBank - 0x8] = byte;
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
                return this.latchedRegs[this.ramBank - 0x8];
            else
                return 0xFF;

        }

        return null;
    }

    /**
     * latches data using actual time.
     */
    latchRTC() {
        this.latchedRegs[0] = this.date.getSeconds();
        this.latchedRegs[1] = this.date.getMinutes();
        this.latchedRegs[2] = this.date.getHours();
        this.latchedRegs[3] = this.date.getDate(); // gets day
    }
}