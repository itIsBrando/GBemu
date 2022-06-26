class MBC5 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);
        this.bank = 1;
        this.romBankAddress = 0x4000;
    }

    acceptsWrite(addr) {
        return (addr < 0x6000)
         || (addr >= 0xA000 && addr <= 0xC000);
    }

    acceptsRead(addr) {
        return (addr >= 0x4000 && addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }

    write8(address, byte) {

        // 0x0000-0x1FFF RAM enable (MBC1)
        if(address < 0x2000) {
            if(this.ramSize != 0)
                this.ramEnable = (byte & 0x0A) != 0;
 
        // 0x2000-0x2FFF low byte of ROM bank
        } else if(address < 0x3000) {
            this.bank = (this.bank & 0x100) | byte;
            this.romBankAddress = this.bank * 0x4000;
        // 0x3000-0x3FFF upper BIT of ROM bank
        } else if(address < 0x4000) {
            byte &= 1;
            this.bank = (this.bank & 0xFF) | (byte << 8);
            this.romBankAddress = this.bank * 0x4000;
        // 0x4000-0x5FFF RAM bank
        } else if(address < 0x6000) {
            this.ramBank = byte & 0x0F;
            this.ramBankAddress = this.ramBank * 0x2000;
        } else if(address >= 0xA000 && address < 0xC000)
        {
            // only allow writing if RAM is enabled
            if(this.ramEnable)
                this.ram[address - 0xA000 + this.ramBankAddress] = byte;
            else
                CPU.LOG("Illegal write to RAM while disabled", true);
        }
    }
    
    read8(address) {

        if(address >= 0x4000 && address < 0x8000) {
            return this.rom[address - 0x4000 + this.romBankAddress];
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address < 0xC000)
        {
            if(this.ramEnable)
                return this.ram[address - 0xA000 + this.ramBankAddress];
            else
                return 0xFF;
        }

        return 0xFF;
    }


    
}