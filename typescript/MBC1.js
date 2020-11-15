// RAM banking not implemented
// modification of 'this.ramBank' occurs, but this.read8 does not recognize it
class MBC1 {
    constructor(rom) {
        this.rom = rom;
        this.ramEnable = false;
        this.ramBank = 0;
        this.bank = 1;

        this.mode = 0; // determine whether we read from ROM or RAM
    }
    
    /**
     * Overrides the cpu.write8 function
     * @param {CPU} cpu 
     * @param {UInt16} address 
     * @param {UInt8} byte 
     * @returns true if the CPU should allow the write to happen, otherwise false
     */
    write8(cpu, address, byte) {

        // RAM enable
        if(address < 0x2000) {
            if(byte & 0x0A == 0x0A)
                this.ramEnable = true;
            else
                this.ramEnable = false;
            return false;
        } else if(address < 0x4000) {
            // ROM bank number (2000-3FFF)
            byte &= 0x1F;
            if(byte == 0) byte++;
            this.bank = (this.bank & 0x60) | byte;
            return false;
        // RAM bank or upper bits of ROM bank
        } else if(address < 0x6000) {
            // set RAM bank or upper 2 bits of the ROM bank
            if(this.mode == 1)
                this.ramBank = byte & 3;
            else
                this.bank = (this.bank & 0x1F) + (byte & 0x3) << 5

            return false;
        } else if(address < 0x8000)
        {
            this.mode = byte & 1;
            return false;
        // RAM
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            // only allow writing if RAM is enabled
            return this.ramEnable;
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
                return cpu.mem.cram[address - 0xA000];
            else
                return 0xFF;
        }

        return null;
    }


    
}