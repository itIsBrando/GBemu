const PPUMODE = {
    hblank:      0,
    vblank:      1,
    scanlineOAM: 2,
    scanlineVRAM:3,
}

class PPU {
    /**
     * Creates a PPU object to be used in conjuction with a CPU object
     * @param {CPU} cpu parent
     */
    constructor(cpu) {

        this.parent = cpu;
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

        // CGB registers
        this.cgb = {
            bgi: 0,     // ff68 background palette index
            obji: 0,    // ff6A object palette index
            bgPal: new Uint8Array(0x40),
            objPal: new Uint8Array(0x40),
            bgAutoInc: false,
            objAutoInc: false,
            vbank: 0,   // VRAM bank 0-1
            svbk: 1,    // WRAM bank 0-3
            rgbBG: [],  // actual representation of `bgPal`
            rgbOBJ:[],

            // some registers
            HDMASrc: 0, // ff53
            HDMADest:0, // ff54
        }
        
        this.reset();
    }

    /**
     * Resets palettes
     */
    reset() {
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

        this.cgb.bgAutoInc = 0;
        this.cgb.objAutoInc = 0;
        this.cgb.bgi = 0;
        this.cgb.obji = 0;
        this.cgb.vbank = 0;
        this.cgb.svbk = 1;
        this.cgb.bgPal.fill(0);
        this.cgb.objPal.fill(0);
        this.HDMADest = 0;
        this.HDMASrc = 0;

        /**
         * These are both 3D arrays
         * rgbOBJ[0-7] grabs the first palette
         * rgbOBJ[x][0] grabs the first color of a palette
         * rgbOBJ[x][y][0] grabs the 'red' intensity of a palette
         * 
         * they are 8x4x3
         *  - num of palettes
         *  - num of colors in each palette
         *  - rgb of the color
         */
        this.cgb.rgbOBJ = [
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        ];

        this.cgb.rgbBG = [
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        ];

        this.regs.lcdc = 0;
        this.regs.stat = 0;
        this.regs.scy = 0;
        this.regs.scx = 0;
        this.regs.scanline = 0;
        this.regs.syc = 0;
        this.regs.bgp = 0;
        this.regs.obj0 = 0;
        this.regs.obj1 = 0;
        
        this.lcdEnabled = true;
    }
    
    /**
     * Safely gets the flags byte of a tile in VRAM
     * @note CGB Mode only
     * @param {UInt16} address points to a tile. Should be an address of in the tile map
     * @returns flag byte
     */
    getTileAttributes(address) {
        if(!this.parent.cgb)
            return 0;

        return this.parent.mem.vram[address - 0x8000 + 0x2000];
    }

    /**
     * 
     * @param {Number} tile 0-255
     * @returns 
     */
    getBGTileAddress(tile) {
        // check for signed tile
        if(this.tileBase == 0x9000 && tile > 127)
            tile -= 256;
        return this.tileBase + 16 * tile;   
    }

    /**
     * Represents the base address of the tiles based on lcdc register
     */
    get tileBase() {
        // 9000 is signed displacement
        return UInt8.getBit(this.regs.lcdc, 4) === false ? 0x9000 : 0x8000;
    }

    /**
     * Represents the base address of the map based on lcdc register
     */
    get mapBase() {
        return UInt8.getBit(this.regs.lcdc, 3) ? 0x9C00 : 0x9800;
    }
    
    get winBase() {
        return UInt8.getBit(this.regs.lcdc, 6) ? 0x9C00 : 0x9800;
    }

    get lcdEnabled() {
        return (this.regs.lcdc & 0x80) != 0;
    }

    set lcdEnabled(v) {
        if(v == true)
            this.regs.lcdc |= 0x80;
        else
            this.regs.lcdc &= 0x7F;
    }

    /**
     * Safely checks current VRAM bank
     * @returns 1 if we are using first VRAM bank, otherwise 0
     */
    getVRAMBank() {
        if(this.parent.cgb && this.cgb.vbank)
            return 1;
        return 0;
    }

    step(cpu) {
        this.regs.stat &= 252;

        if(!this.lcdEnabled) {
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
                    this.checkCoincidence();
                }
                break;
            case PPUMODE.scanlineVRAM:
                if(this.cycles >= 172) {
                    this.mode = PPUMODE.hblank
                    this.cycles -= 172;
                    cpu.renderer.renderScanline(this, cpu);
                    // check for hblank interrupt in rSTAT
                    if(UInt8.getBit(this.regs.stat, 3))
                        cpu.requestInterrupt(InterruptType.lcd);
                }
                break;
            case PPUMODE.hblank:
                if(this.cycles >= 204) {
                    this.regs.scanline++;
                    if(this.regs.scanline > 143) {
                        this.mode = PPUMODE.vblank;
                        cpu.renderer.renderSprites(this, cpu);
                        cpu.requestBufferCopy();
                        cpu.requestInterrupt(InterruptType.vBlank);
                        // check for vblank interrupt in rSTAT
                        if(UInt8.getBit(this.regs.stat, 3))
                            cpu.requestInterrupt(InterruptType.lcd);
                        
                            this.checkCoincidence();
                    } else {
                        this.mode = PPUMODE.scanlineOAM;
                        // check for OAM interrupt
                        //  who on earth would use this interrupt?
                        if(UInt8.getBit(this.regs.stat, 5))
                            cpu.requestInterrupt(InterruptType.lcd);
                    }
                    this.cycles -= 204;
                }
                break;
            case PPUMODE.vblank:
                if(this.cycles >= 456) {
                    this.checkCoincidence();
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

    checkCoincidence() {
        // reset coincidence flag
        this.regs.stat &= 0xFB;

        if(this.regs.syc == this.regs.scanline)
        {
            // coincidence interrupt
            if(UInt8.getBit(this.regs.stat, 6)) {
                this.parent.requestInterrupt(InterruptType.lcd);
            }
            // set coincidence flag
            this.regs.stat |= 0x04;
        } 
    }

}