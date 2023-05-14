var useExternalSaveFile = false;
var externalSave = null;

/**
 * Gets the RAM size in bytes for a given ROM
 * @param {Number} size Raw RAM size byte from ROM
 * @param {Number} mbc MBC number
 */
function getRAMSize(size, mbc)
{
    const m1Sizes = [
        0, 2048, 8192, 32768, 524288, 131072
    ];
    switch(mbc) {
        case 1:
            return m1Sizes[size];
        case 2:
            return 512;
        case 3:
        case 5:
            return m1Sizes[size];
        default:
            Menu.message.show("Unknown MBC" + mbc + ".", "Internal error");
    }
}

class MBC1 {
    /**
     * Initializes RAM and ROM of MBC
     * @param {Uint8Array} rom full ROM file
     * @param {Number} mbc mbc number (1, 2, 3, 5)
     */
    constructor(rom, mbc) {
        this.mbcNumber = mbc;
        this.rom = rom;
        this.ramEnable = false;
        this.ramSize = rom[0x0149];
        this.romSize = rom[0x0148];
        this.ramBankAddress = 0; // RAM address for the bank number
        this.romBankAddress = 0x4000; // ROM address for the bank number
        this.initRAM();
        this.TOTAL_BANKS = Math.floor(rom.length / 0x4000);
        this.RAM_BANKS = Math.floor(this.ram.length / 0x2000);
        this.ramBank = 0;
        this.bank = 1;

        this.mode = 0; // determine whether we read from ROM or RAM

        this.overrideSizeCheck = false; // can be overriden in the debug menu @TODO

        CPU.LOG(`RAM size: ${hex(this.ramSize, 2)}`);
        CPU.LOG(`ROM size: ${hex(this.romSize, 2)} Size: ${hex(rom.length, 4)} bytes`);
        CPU.LOG(`Total Banks: ${this.TOTAL_BANKS}`);
    }

    /**
     * If an external save is loaded, then that will be used or
     *   RAM will be allocated
     */
    initRAM() {
        const expectedSize = getRAMSize(this.ramSize, this.mbcNumber);
        // if the user loaded an incompatible save, then do not use it
        if(useExternalSaveFile) {
            if(externalSave.length >= expectedSize || this.overrideSizeCheck) {
                this.ram = externalSave;
            } else {
                Menu.message.show("External save size does not match the required amount in the ROM.", "Save Incompatible");
                CPU.LOG("RAM with mismatching sizes was used.");
                CPU.LOG(`Attempted: ${hex(externalSave.length, 4, "$")} bytes, Expected: ${hex(expectedSize, 4, "$")} bytes`);
                useExternalSaveFile = false;
            }

            return;
        }

        this.ram = new Uint8Array(expectedSize);
    }

    export() {
        return {
            bank: this.bank,
            ramBank: this.ramBank,
            mode: this.mode,
            ramBankAddress: this.ramBankAddress,
            romBankAddress: this.romBankAddress,
        };
    }

    import(data) {
        const d = data["mbc"];
        
        this.bank = d.bank;
        this.ramBank = d.ramBank;
        this.mode = d.mode;
        this.ramBankAddress = d.ramBankAddress;
        this.romBankAddress = d.romBankAddress;
    }

    /**
     * Resets all MBC handlers
     */
    reset() {
        this.ramBankAddress = 0;
        this.romBankAddress = 0x4000;
        this.ramBank = 0;
        this.bank = 1;
        this.mode = 0;
    }

    /**
     * 
     * @param {ArrayBuffer} array raw array of the save data
     */
    static useSaveData(array) {
        useExternalSaveFile = true;
        externalSave = new Uint8Array(array);
        if(c.isRunning) {
            restartEmulation();
            c.mbcHandler.initRAM();
        }
    }

    /**
     * Sets the lower 5 bits of the bank number for MBC1
     * @param {Number} n bank
     */
    setLowROMBank(n) {
        this.bank = (this.bank & 0x60) | (n & 0x1F);

        if((this.bank & 0x1f) == 0)
            this.bank++;
        
        this.bank %= this.TOTAL_BANKS;
        
        this.romBankAddress = this.bank * 0x4000;
    }

    /**
     * Sets the upper 3-bits of the bank number
     * @param {Number} n bank
     */
    setHighROMBank(n) {
        this.bank = (this.bank & 0x1F) | ((n & 0x3) << 5)

        if((this.bank & 0x1f) == 0)
            this.bank++;

        this.bank %= this.TOTAL_BANKS;

        this.romBankAddress = this.bank * 0x4000;
    }

    acceptsWrite(addr) {
        return (addr < 0x8000)
         || (addr >= 0xA000 && addr < 0xC000);
    }

    acceptsRead(addr) {
        return (addr < 0x8000 && addr >= 0x4000)
         || (addr >= 0xA000 && addr < 0xC000);
    }

    write8(address, byte) {
        // 0x0000-0x1FFF RAM enable
        if(address < 0x2000) {
            this.ramEnable = ((byte & 0x0A) == 0x0A) && this.ramSize != 0;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            this.setLowROMBank(byte);
            
        // 0x4000-0x5FFF RAM bank or upper bits of ROM bank
        } else if(address < 0x6000) {
            // set RAM bank if RAM size is 32K
            if(this.mode == 1) {
                this.ramBank = (byte & 3) % this.RAM_BANKS;
                this.ramBankAddress = this.ramBank * 0x2000;
            // set bank upper bit if ROM size is greater than 1MB
            } else {
                this.setHighROMBank(byte);
            }
        // 0x6000-0x7FFF Banking mode select
        } else if(address < 0x8000) {
            if(this.ramSize == 3) {
                this.mode = byte & 1;
                if(this.mode == 1)
                {
                    this.bank &= 0x1f;
                    this.romBankAddress = this.bank * 0x4000;
                } else {
                    this.ramBank = 0;
                    this.ramBankAddress = 0;
                }
            } else
                CPU.LOG(`Attempted to change MBC1 to mode${this.mode}`);
        // RAM
        } else if(address >= 0xA000 && address <= 0xBFFF) {
            if(!this.ramEnable)
                return;
                
            address -= 0xA000;
            if(this.mode == 0)
            {
                this.ram[address] = byte;
            } else {
                this.ram[address + this.ramBankAddress] = byte;
            }
        }
    }
    
    read8(address) {

        // banks 01-7f
        if(address < 0x8000 && address >= 0x4000) {
            address -= 0x4000;
            return this.rom[this.romBankAddress + address];
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            if(!this.ramEnable)
                return 0xFF;

            address -= 0xA000;
            if(this.mode == 0)
            {
                return this.ram[address];
            } else {
                return this.ram[address + this.ramBankAddress];
            }
        }

        return 0xFF;
    }


    
}