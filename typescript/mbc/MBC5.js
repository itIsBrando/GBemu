class MBC5 extends MBC1{
    constructor(rom) {
        super(rom);
    }

    /**
     * Overrides the cpu.write8 function
     * @param {CPU} cpu 
     * @param {UInt16} address 
     * @param {UInt8} byte 
     * @returns true if the CPU should allow the write to happen, otherwise false
     */
    write8(cpu, address, byte) {

        // 0x0000-0x1FFF RAM enable (MBC1)
        if(address < 0x2000) {
            if((byte & 0x0A) == 0x0A && this.ramSize != 0)
                this.ramEnable = true;
            else
                this.ramEnable = false;
            return false;
        // 0x2000-0x2FFF low byte of ROM bank
        } else if(address < 0x3000) {
            this.bank = (this.bank & 0x100) | byte;
        // 0x3000-0x3FFF upper BIT of ROM bank
        } else if(address < 0x4000) {
            this.bank = (this.bank & 0xFF) | (byte & 0x1);
            return false;
        // 0x4000-0x5FFF RAM bank
        } else if(address < 0x6000) {
            this.ramBank = byte & 0x0F;
            return false;
        // 0x6000-0x7FFF Banking mode select
        } else if(address < 0x8000)
        {
            this.mode = byte & 1;
            return false;
        // RAM
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            // only allow writing if RAM is enabled
            if(this.ramEnable)
            {
                if(this.mode == 0)
                {
                    this.ram[address- 0xA000] = byte;
                } else {
                    this.ram[address - 0xA000 + this.ramBank * 0x2000];
                }
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

        // ROM
        if(address < 0x4000) {
            return null // this.rom[address];
        // banks 00-1FF (mbc1)
        } else if(address < 0x8000) {
            address -= 0x4000;
            return this.rom[this.bank * 0x4000 + address];
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            if(this.ramEnable)
            {
                address -= 0xA000;
                if(this.mode == 0)
                {
                    return this.ram[address];
                } else {
                    return this.ram[address + (this.ramBank * 0x2000)];
                }
            }
            else
            {
                return 0xFF;
            }
        }

        return null;
    }


    
}