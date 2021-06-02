class MBC5 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);
        this.bank = 1;
        this.romBankAddress = 0x4000;
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
            if(this.ramSize != 0)
                this.ramEnable = (byte & 0x0F) == 0x0A;
 
            return false;
        // 0x2000-0x2FFF low byte of ROM bank
        } else if(address < 0x3000) {
            this.bank = (this.bank & 0x100) | byte;
            this.romBankAddress = this.bank * 0x4000;
            return false;
        // 0x3000-0x3FFF upper BIT of ROM bank
        } else if(address < 0x4000) {
            byte &= 1;
            this.bank = (this.bank & 0xFF) | (byte << 8);
            this.romBankAddress = this.bank * 0x4000;
            return false;
        // 0x4000-0x5FFF RAM bank
        } else if(address < 0x6000) {
            this.ramBank = byte & 0x0F;
            this.ramBankAddress = this.ramBank * 0x2000;
            return false;
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            // only allow writing if RAM is enabled
            if(this.ramEnable)
                this.ram[address - 0xA000 + this.ramBankAddress] = byte;
            else
                console.log("Illegal write to RAM while disabled");
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

        if(address >= 0x4000 && address <= 0x7FFF) {
            address -= 0x4000;
            return this.rom[address + this.romBankAddress];
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            if(this.ramEnable)
                return this.ram[address - 0xA000 + this.ramBankAddress];
            else
                return 0xFF;
        }

        return null;
    }


    
}