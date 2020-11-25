
/**
 * Only has 512x4 bits of nonbankable RAM
 */
class MBC2 extends MBC1 {
    constructor(rom, mbc) {
        super(rom, mbc);
    }

    /**
     * Overrides the cpu.write8 function
     * @param {CPU} cpu 
     * @param {UInt16} address 
     * @param {UInt8} byte 
     * @returns true if the CPU should allow the write to happen, otherwise false
     */
    write8(cpu, address, byte) {

        // 0x0000-0x3FFF RAM enable and ROM bank number
        if(address < 0x4000) {
            if(UInt8.getBit(address, 8) == 1) {
                // set ROM bank
                byte &= 0x0F;
                if(byte == 0) byte++;
                this.bank = byte & 0x0F;
            } else
                // set RAM bank
                this.ramEnable = byte == 0x0A;
                
            return false;
        // 0xA000-0xA1FF RAM 
        } else if(address >= 0xA000 && address <= 0xA1FF)
        {
            // only allow writing if RAM is enabled
            if(this.ramEnable)
            {
                byte &= 0x0F;
                this.ram[address- 0xA000] = byte;
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

        // 0x4000-0x7FFF banks 01-0F (mbc1)
        if(address >= 0x4000 && address < 0x8000) {
            address -= 0x4000;
            return this.rom[this.bank * 0x4000 + address];
        // RAM A000-BFFF
        } else if(address >= 0xA000 && address <= 0xBFFF)
        {
            if(this.ramEnable)
            {
                address -= 0xA000;
                return this.ram[address + this.ramBank] & 0x0F;
            }
            else
            {
                return 0xFF;
            }
        }

        return null;
    }


    
}