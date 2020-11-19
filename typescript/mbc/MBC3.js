// needs RTC support

class MBC3 extends MBC1{
    constructor(rom) {
        super(rom);
        this.RTCEnable = false;
        this.RTCReg = 0; // index to the currently selected reg
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
            this.RTCEnable = this.ramEnable = (byte & 0x0A) == 0x0A;
            return false;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            byte &= 0x7F;
            if(byte == 0) byte++;
            this.bank = byte;
            return false;
        // 0x4000-0x5FFF RAM bank or RTC
        } else if(address < 0x6000) {
            // enable RTC
            if((byte >= 0x08) && (byte <= 0x0C)) {
                this.RTCReg = byte - 0x8;
                this.ramBank = -1; // a flag indicating that we are reading from RTC instead of RAM
            // set RAM bank if RAM size is 32K
            } else if(byte < 4) {
                this.ramBank = byte & 3;
            }
            return false;
        // 0x6000-0x7FFF Latch Clock Data
        } else if(address < 0x8000)
        {
            // do some RTC stuff
            return false;
        // RAM
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            if(this.RTCEnable && this.ramBank == -1) {
                this.regs[this.RTCReg] = byte;
                return false;
            // only allow writing if RAM is enabled
            //  and we are not looking at RTC
            } else if(this.ramEnable && this.ramBank >= 0)
            {
                this.ram[address - 0xA000 + this.ramBank * 0x2000];
                return false;
            }
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
            address -= 0x4000;
            return this.rom[this.bank * 0x4000 + address];
        // RAM A000-BFFF or RTC register
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            
            if(this.ramEnable && this.ramBank >= 0)
            {
                address -= 0xA000;
                return this.ram[address + (this.ramBank * 0x2000)];
            }
            else if(this.RTCEnable)
                return this.regs[this.RTCReg];
            else
            {
                return 0xFF;
            }
        }

        return null;
    }


    
}