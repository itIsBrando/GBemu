


class HDMA {
    constructor(cpu) {
        this.parent = cpu;

        this.source = 0;        // ff51-52
        this.destination = 0,   // ff53-54
        this.len = 0;           // ff55 b0-7
        this.enable = false;
        this.hasCopied = false; // @todo rename this to be more descriptive. This gets set after the HDMA has occured for this current hblank

        this.cycles = 0;
    }

    export() {
        return {
            source: this.source,
            destination: this.destination,
            len: this.len,
            enable: this.enable,
            hasCopied: this.hasCopied,
            cycles: this.cycles
        };
    }

    import(data) {
        const d = data["hdma"];
        
        this.source = d.source;
        this.destination = d.destination;
        this.len = d.len;
        this.enable = d.enable;
        this.hasCopied = d.hasCopied;
        this.cycles = d.cycles;
    }


    accepts(addr) {
        return addr >= 0xff51 && addr <= 0xff55;
    }


    write8(addr, byte) {
        switch(addr) {
            case 0xff51:
                // HDMA src high
                this.source &= 0xF0;
                this.source |= byte << 8;
                break;
            case 0xff52:
                // HDMA src low
                this.source &= 0xFF00;
                this.source |= byte & 0xF0;
                break;
            case 0xff53:
                // HDMA dest high
                this.destination &= 0xFF;
                this.destination |= 0x8000 | ((byte & 0x1F) << 8);
                break;
            case 0xff54:
                // HDMA dest low
                this.destination &= 0xFF00;
                this.destination |= 0x8000 | (byte & 0xF0);
                break;
            case 0xff55:
                this.HDMATransfer(byte);
                break;
        }
    }


    read8(address) {
        switch(address) {
            case 0xff51:
            case 0xff52:
            case 0xff53:
            case 0xff54:
                return 0xff;
            case 0xff55:
                return (this.enable ? 0 : 0x80) | (this.len & 0x7f);
        }
    }


    /**
     * Performs an DMA to OAM transfer for GBC
     * Bit 7 - 0 = general purpose DMA. All data is done at once.
     *       - 1 = HBlank DMA. 0x10 bytes are transferred at H-blank (LY in range of 0-143)
     * Bit 0-6 - length of the transfer. Range is 0x10-0x800 bytes
     * @param {UInt8} data
     */
    HDMATransfer(data) {
        const cpu = this.parent;
        const mode = UInt8.getBit(data, 7);
        const length = data & 0x7F;

        if(!cpu.cgb)
            return;

        // if we are in the middle of a HDMA Transfer but we want to stop it.
        if(!mode && this.enable)
        {
            this.enable = false;
            CPU.LOG("STOPPED HMDA:" + hex(c.read8(0xff55)));
            return;
        }

        if(!mode)
        {
            for(let i = 0; i < (length + 1) * 0x10; i++) {
                const byte = cpu.read8(this.source++);
                cpu.write8(this.destination++, byte);
            }

            cpu.cycles += 32 * (length + 1);

            // reads to HDMA5 will be 0xff
            this.enable = false;
            this.len = 0x7f;
        } else {
            this.enable = true;
            this.len = length;
        }

        CPU.LOG(`hdma mode:${Number(mode)}. Dest:${hex(this.destination, 4)}. Src: ${hex(this.source, 4)}. Len: ${(length + 1) * 0x10}`);
    }

    shouldTransfer() {
        return this.enable && !this.hasCopied && (this.parent.ppu.mode == PPUMODE.hblank || !this.parent.ppu.lcdEnabled);
    }

    tick(cycles) {
        this.cycles += cycles;
        
        if(this.cycles < 0x20)
            return;

        this.cycles = 0;
            
        for(let i = 0; i < 0x10; i++)
            this.parent.write8(this.destination + i, this.parent.read8(this.source + i));
            
        this.destination += 0x10;
        this.source += 0x10;
        this.hasCopied = true;

        // when HDMA ends
        if(this.len-- === 0) {
            this.enable = false;
            this.len = 0x7f;
        }
    }
}