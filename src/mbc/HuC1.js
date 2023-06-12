class HuC1 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);

        // enabled IR when ramEnable = false, otherwise RAM is enabled
        this.ramEnable = true;
    }

    reset() {
        this.rtc.reset();
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
        // 0x0000-0x1FFF IR/RAM enable
        if(address < 0x2000) {
            this.ramEnable = byte != 0x0e;
        // 0x2000-0x3FFF ROM bank number
        } else if(address < 0x4000) {
            this.bank = byte % this.TOTAL_BANKS;
        // 0x4000-0x5FFF RAM bank
        } else if(address < 0x6000) {
            this.ramBank = byte % this.RAM_BANKS;
        // 0x6000-0x7FFF Nothing
        } else if(address < 0x8000) {
            return;
        // RAM/IR
        } else if(address >= 0xA000 && address < 0xC000) {
            // ramEnable doubles up as an RTC enable
            // if ramBank>3, then we are trying to use RTC, not RAM
            const addr = address - 0xA000 + (this.ramBank * 0x2000);

            if(this.ramEnable) {
                this.ram[addr] = byte;
            } else {
                // IR write. does nothing as we do not emulate it.
            }
        }
    }

    read8(address) {
        // ROM bank 0
        if(address < 0x4000) {
            return this.getROMByte(address, 0);
        // banked rom
        } else if(address < 0x8000) {
            return this.getROMByte(address - 0x4000, this.bank);
        // RAM A000-BFFF or RTC register
        } else if(address >= 0xA000 && address < 0xC000) {
            if(this.ramEnable)
                return this.ram[address - 0xA000 + (this.ramBank * 0x2000)];
            else
                return 0xc0; // read IR data
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
