class MBC7 extends MBC5 {
    constructor(rom, mbc) {
        super(rom, mbc);

        this.ramEnable2 = false;
        this.eeprom = new EEPROM(this);
    }

    acceptsWrite(addr) {
        return (addr < 0x6000)
         || (addr >= 0xa000 && addr < 0xc000);
    }

    acceptsRead(addr) {
        return (addr >= 0x4000 && addr < 0x8000)
         || (addr >= 0xa000 && addr < 0xc000);
    }

    write8(address, byte) {
        // 0x0000-0x1FFF RAM enable (MBC1)
        if(address < 0x2000) {
            this.ramEnable = byte == 0x0a;
        // 0x2000-0x3FFF set ROM bank
        } else if(address < 0x4000) {
            this.bank = byte % this.TOTAL_BANKS;
            this.romBankAddress = this.bank * 0x4000;
        // 0x4000-0x5FFF RAM enable 2
        } else if(address < 0x6000) {
            if(this.ramEnable)
                this.ramEnable2 = byte == 0x40;
        } else if(address >= 0xa000 && address < 0xc000) {
            // EEPROM
            if(this.isRAMEnabled())
                this.eeprom.write(address, byte);
        }
    }
    

    read8(address) {
        if(address >= 0x4000 && address < 0x8000) {
            return super.read8(address);
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address < 0xC000) {
            if(this.isRAMEnabled())
                return this.eeprom.read(address);
            else
                return 0xff;
            
        } else if(address >= 0xb000 && address < 0xc000) {
            return 0xff;
        }

        return 0xff;
    }


    isRAMEnabled() {
        return this.ramEnable && this.ramEnable2;
    }
}