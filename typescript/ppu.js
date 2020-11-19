const PPUMODE = {
    hblank:      0,
    vblank:      1,
    scanlineOAM: 2,
    scanlineVRAM:3,
}

class PPU {
    constructor() {

        this.mode = PPUMODE.vblank;
        this.cycles = 0;
    
        this.regs = {
            lcdc: 0, // ff40
            stat: 0, // ff41
            scy: 0, // ff42 scroll Y
            scx: 0, // ff43 scroll X
            scanline: 0, // FF44
            syc: 0, // ff45 scanline compare
            dma: 0, // ff46 dma transfer address
            bgp: 0, // ff47 background palette
            obj0: 0,// ff48
            obj1: 0,// ff49
            wy: 0, // ff4a window Y
            wx: 0  // ff4b window X
        }
        
        this.obj0Pal = [
            [3,3,3],
            [3,3,3],
            [3,3,3],
            [3,3,3],
        ];
        this.obj1Pal = [
            palette[3],
            palette[2],
            palette[1],
            palette[0],
        ];
        this.bgPal = [
            palette[0],
            palette[1],
            palette[2],
            palette[3],
        ];
    }

    /**
     * Represents the base address of the tiles based on lcdc register
     */
    get tileBase() {
        // 9000 is signed displacement
        return UInt8.getBit(this.regs.lcdc, 4) == 0 ? 0x9000 : 0x8000;
    }

    /**
     * Represents the base address of the map based on lcdc register
     */
    get mapBase() {
        return UInt8.getBit(this.regs.lcdc, 3) == 1 ? 0x9C00 : 0x9800;
    }

    step(cpu) {
        this.regs.stat &= 252;
        if(this.regs.lcdc & 0x80 == 0) {
            this.regs.stat |= PPUMODE.vblank;
            return;
        }

        this.cycles += cpu.cycles;

        switch(this.mode)
        {
            case PPUMODE.scanlineOAM:
                if(this.cycles >= 80) {
                    this.mode = PPUMODE.scanlineVRAM
                    this.cycles -= 80;
                    // scanline equivalence
                    this.checkCoincidence(cpu);
                }
                break;
            case PPUMODE.scanlineVRAM:
                if(this.cycles >= 172) {
                    this.mode = PPUMODE.hblank
                    this.cycles -= 172;
                    cpu.renderer.renderScanline(this, cpu);
                    // check for hblank interrupt in rSTAT
                    if(UInt8.getBit(this.regs.stat, 3) == 1)
                        cpu.requestInterrupt(InterruptType.lcd);
                }
                break;
            case PPUMODE.hblank:
                if(this.cycles >= 204) {
                    this.regs.scanline++;
                    if(this.regs.scanline > 143) {
                        this.mode = PPUMODE.vblank;
                        cpu.renderer.renderSprites(this, cpu);
                        cpu.renderer.drawBuffer();
                        cpu.requestInterrupt(InterruptType.vBlank);
                        // check for vblank interrupt in rSTAT
                        if(UInt8.getBit(this.regs.stat, 3) == 1)
                            cpu.requestInterrupt(InterruptType.lcd);
                        
                            this.checkCoincidence(cpu);
                    } else {
                        this.mode = PPUMODE.scanlineOAM;
                        // check for OAM interrupt
                        //  who on earth would use this interrupt?
                        if(UInt8.getBit(this.regs.stat, 5) == 1)
                            cpu.requestInterrupt(InterruptType.lcd);
                    }
                    this.cycles -= 204;
                }
                break;
            case PPUMODE.vblank:
                if(this.cycles >= 456) {
                    this.checkCoincidence(cpu);
                    this.regs.scanline++;
                    if(this.regs.scanline > 153) {
                        this.regs.scanline = 0;
                        this.mode = PPUMODE.scanlineOAM;
                    }

                    this.cycles -= 456;
                }
                break;
        }

        this.regs.stat |= this.mode;
    }

    checkCoincidence(cpu) {
        // reset coincidence flag
        this.regs.stat &= 0xFB;

        if(this.regs.syc == this.regs.scanline)
        {
            // coincidence interrupt
            if(UInt8.getBit(this.regs.stat, 6) == 1)
            {
                cpu.requestInterrupt(InterruptType.lcd);
            }
            // set coincidence flag
            this.regs.stat |= 0x04;
        } 
    }
}