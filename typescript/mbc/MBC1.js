var useExternalSaveFile = false;
var externalSave = null;

class MBC1 {
    constructor(rom) {
        this.rom = rom;
        this.ramEnable = false;
        this.ramSize = rom[0x0149];
        this.romSize = rom[0x0148];
        if(useExternalSaveFile)
            this.ram = externalSave;
        else
            this.ram = new Uint8Array(65536 << this.ramSize);
        this.ramBank = 0;
        this.bank = 1;

        this.mode = 0; // determine whether we read from ROM or RAM

        console.log("RAM size: 0x" + this.ramSize);
        console.log("ROM size: 0x" + this.romSize + "Size: " + rom.length);
    }

    /**
     * 
     * @param {ArrayBuffer} array raw array of the save data
     */
    static useSaveData(array) {
        useExternalSaveFile = true;
        externalSave = new Uint8Array(array);
        console.log("using external save file");
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
            if((byte & 0x0A) == 0x0A && this.ramSize != 0)
                this.ramEnable = true;
            else
                this.ramEnable = false;
            return false;
        // 0x2000-0x3FFF ROM bank number 
        } else if(address < 0x4000) {
            byte &= 0x1F;
            if(byte == 0 || byte == 0x20 || byte == 0x40 || byte == 0x60) byte++;
            this.bank = (this.bank & 0x60) | byte; // perserve the upper two bits that are controlled by another register
            return false;
        // 0x4000-0x5FFF RAM bank or upper bits of ROM bank
        } else if(address < 0x6000) {
            // set RAM bank if RAM size is 32K
            if(this.mode == 1)
                this.ramBank = byte & 3;
            // set bank upper bit if ROM size is greater than 1MB
            else
                this.bank = (this.bank & 0x1F) + ((byte & 0x3) << 5)
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
        // banks 01-7f
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