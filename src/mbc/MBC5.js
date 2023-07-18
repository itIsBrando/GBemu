class MBC5 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);
        this.bank = 1;
        this.romBankAddress = 0x4000;

        this.supportsRumble = rom[0x147] >= 0x1c && rom[0x147] <= 0x1e;
        this.rumbleEnabled = false;
    }


    export() {
        return {
            bank: this.bank,
            ramBank: this.ramBank,
            ramBankAddress: this.ramBankAddress,
            romBankAddress: this.romBankAddress,
            hasRumble: this.supportsRumble,
            rumbleEna: this.rumbleEnabled,
        };
    }

    import(data) {
        const d = data["mbc"];

        this.bank = d.bank;
        this.ramBank = d.ramBank;
        this.ramBankAddress = d.ramBankAddress;
        this.romBankAddress = d.romBankAddress;
        this.supportsRumble = d.hasRumble;
        this.rumbleEnabled = d.rumbleEna;
    }

    acceptsWrite(addr) {
        return (addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }

    acceptsRead(addr) {
        return (addr >= 0x4000 && addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }


    /**
     * Sets the lower 8 bits of the bank number
     * @param {Number} n bank
     */
    setLowROMBank(n) {
        this.bank = (this.bank & 0x100) | n;
        this.bank %= this.TOTAL_BANKS;

        this.romBankAddress = this.bank * 0x4000;
    }

    /**
     * Sets the upper bit of the bank number
     * @param {Number} n bank
     */
    setHighROMBank(n) {
        n &= 1;
        this.bank = (this.bank & 0xFF) | (n << 8);
        this.bank %= this.TOTAL_BANKS;

        this.romBankAddress = this.bank * 0x4000;
    }

    write8(address, byte) {

        // 0x0000-0x1FFF RAM enable (MBC1)
        if(address < 0x2000) {
            this.ramEnable = (byte & 0x0A) != 0 && this.ramSize != 0;
        // 0x2000-0x2FFF low byte of ROM bank
        } else if(address < 0x3000) {
            this.setLowROMBank(byte);
        // 0x3000-0x3FFF upper BIT of ROM bank
        } else if(address < 0x4000) {
            this.setHighROMBank(byte);
        // 0x4000-0x5FFF RAM bank
        } else if(address < 0x6000) {
            this.ramBank = byte & (this.supportsRumble ? 0x7 : 0x0f);
            this.ramBankAddress = this.ramBank * 0x2000;

            // rumble on supported devices
            this.rumbleEnabled = UInt8.getBit(byte, 3);
            this.rumble();
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

    rumble() {
        if(!this.supportsRumble || !this.rumbleEnabled)
            return;

        this.vibrate();
        setTimeout(this.rumble, 6);
    }


    vibrate() {
        Controller.vibrate();
    }



}