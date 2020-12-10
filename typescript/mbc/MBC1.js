var useExternalSaveFile = false;
var externalSave = null;

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
            showMessage("Unknown MBC" + mbc + ".", "Internal error");
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
        this.TOTAL_BANKS = Math.floor(rom.length / 0x4000);
        this.ramBankAddress = 0; // RAM address for the bank number
        this.romBankAddress = 0; // ROM address for the bank number
        this.initRAM();
        this.ramBank = 0;
        this.bank = 1;

        this.mode = 0; // determine whether we read from ROM or RAM

        console.log("RAM size: 0x" + this.ramSize);
        console.log("ROM size: 0x" + this.romSize + " Size: " + rom.length);
        console.log("Total Banks: " + this.TOTAL_BANKS);
    }

    /**
     * If an external save is loaded, then that will be used or
     *   RAM will be allocated
     */
    initRAM() {
        if(useExternalSaveFile) {
            this.ram = externalSave;
            if(externalSave.length != getRAMSize(this.ramSize, this.mbcNumber))
                showMessage("External save size does not match the required amount in the ROM.", "Save Incompatible");
        } else
            this.ram = new Uint8Array(getRAMSize(this.ramSize, this.mbcNumber));
    }

    /**
     * 
     * @param {ArrayBuffer} array raw array of the save data
     */
    static useSaveData(array) {
        useExternalSaveFile = true;
        externalSave = new Uint8Array(array);
        console.log("using external save file");
        if(c.isRunning)
            restartEmulation();
    }

    /**
     * Sets the lower 5 bits of the bank number for MBC1
     * @param {Number} n bank
     */
    setLowROMBank(n) {
        this.bank = (this.bank & 0x60) | (n & 0x1F);

        this.bank %= this.TOTAL_BANKS;

        if(this.bank == 0 || this.bank == 0x20 || this.bank == 0x40 || this.bank == 0x60)
            this.bank++;
    }

    /**
     * Sets the upper 3-bits of the bank number
     * @param {Number} n bank
     */
    setHighROMBank(n) {
        this.bank = (this.bank & 0x1F) | ((n & 0x3) << 5)

        this.bank %= this.TOTAL_BANKS;

        if(this.bank == 0 || this.bank == 0x20 || this.bank == 0x40 || this.bank == 0x60)
            this.bank++;
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
            this.ramEnable = ((byte & 0x0F) == 0x0A) && this.ramSize != 0;
            return false;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            
            this.setLowROMBank(byte);
            
            return false;
        // 0x4000-0x5FFF RAM bank or upper bits of ROM bank
        } else if(address < 0x6000) {
            // set RAM bank if RAM size is 32K
            if(this.mode == 1)
                this.ramBank = byte & 3;
            // set bank upper bit if ROM size is greater than 1MB
            else {
                this.setHighROMBank(byte);
            }
            return false;
        // 0x6000-0x7FFF Banking mode select
        } else if(address < 0x8000)
        {
            if(this.ramSize == 3) {
                this.mode = byte & 1;
                if(this.mode == 1)
                {
                    this.bank &= 0x1f;
                } else {
                    this.ramBank = 0;
                }
            } else
                console.log("Attempted to change MBC1 to mode1");
            return false;
        // RAM
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            // only allow writing if RAM is enabled
            if(this.ramEnable)
            {
                address -= 0xA000;
                if(this.mode == 0)
                {
                    this.ram[address] = byte;
                } else {
                    this.ram[address + this.ramBank * 0x2000] = byte;
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

        // banks 01-7f
        if(address < 0x8000 && address >= 0x4000) {
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