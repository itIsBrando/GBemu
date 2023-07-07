const PPUMODE = {
    hblank:      0,
    vblank:      1,
    scanlineOAM: 2,
    scanlineVRAM:3,
};

const PPUMODE_CYCLES = {
    0: 204,
    1: 456,
    2: 80,
    3: 172,
};

const ColorMode = {
    SCALED: 0,
    GAMMA: 1,
    DESATURATE: 2,
};

class PPU {
    /**
     * Creates a PPU object to be used in conjuction with a CPU object
     * @param {CPU} cpu parent
     */
    constructor(cpu) {

        this.parent = cpu;
        this.mode = PPUMODE.vblank;
        this.cycles = 0;
        this.statInterrupt = 0;
        this.colorMode = ColorMode.SCALED;

        this.regs = {
            lcdc: 0, // ff40
            stat: 0, // ff41
            scy: 0, // ff42 scroll Y
            scx: 0, // ff43 scroll X
            scanline: 0, // FF44
            syc: 0, // ff45 scanline compare (aka lyc)
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

            speed: 1, // CPU speed
            key1: 0, // ff4d
        }

        this.reset();
    }

    onPaletteChange() {
        let bg0 = this.regs.bgp;
        this.bgPal = [
            palette[(bg0 & 0b00000011)],
            palette[(bg0 & 0b00001100) >> 2],
            palette[(bg0 & 0b00110000) >> 4],
            palette[(bg0 & 0b11000000) >> 6]
        ];

        let o0 = this.regs.obj0;
        this.obj0Pal = [
            palette[(o0 & 0b00000011)],
            palette[(o0 & 0b00001100) >> 2],
            palette[(o0 & 0b00110000) >> 4],
            palette[(o0 & 0b11000000) >> 6]
        ];
        let o1 = this.regs.obj1;
        this.obj1Pal = [
            palette[(o1 & 0b00000011)],
            palette[(o1 & 0b00001100) >> 2],
            palette[(o1 & 0b00110000) >> 4],
            palette[(o1 & 0b11000000) >> 6]
        ];

        if(!this.parent.romLoaded) {
            this.parent.renderer.fillBuffer(0);
            this.parent.renderer.drawBuffer();
        }
    }

    /**
     * Resets palettes
     */
    reset() {
        this.cgb.bgAutoInc = 0;
        this.cgb.objAutoInc = 0;
        this.cgb.bgi = 0;
        this.cgb.obji = 0;
        this.cgb.vbank = 0;
        this.cgb.svbk = 1;
        this.cgb.bgPal.fill(0);
        this.cgb.objPal.fill(0);

        /**
         * These are both 3D arrays
         * rgbOBJ[0-7] grabs the first palette
         * rgbOBJ[x][0] grabs the first (of 4) color of a palette
         * rgbOBJ[x][y][0] grabs the 'red' intensity of a palette
         *
         * they are 8x4x3
         *  - num of palettes
         *  - num of colors in each palette
         *  - rgb of the color
         */
        for(let y = 0; y < 8; y++) {
            this.cgb.rgbBG[y] = [[], [], [], []];
            this.cgb.rgbOBJ[y] = [[], [], [], []];

            for(let x = 0; x < 4; x++) {
                this.cgb.rgbBG[y][x] = [0, 0, 0];
                this.cgb.rgbOBJ[y][x] = [0, 0, 0];
            }
        }

        this.regs.lcdc = 0;
        this.regs.stat = 0;
        this.regs.scy = 0;
        this.regs.scx = 0;
        this.regs.scanline = 0;
        this.regs.syc = 0;
        this.regs.bgp = 0;
        this.regs.obj0 = 0;
        this.regs.obj1 = 0;

        this.cgb.key1 = 0;
        this.cgb.speed_mode = 0;

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
     * @returns How fast the CPU is running (1 for normal mode and 2 for double speed)
     */
    getSpeedMultiplier() {
        return this.cgb.speed_mode + 1;
    }

    /**
     * Adjusts the speed of input cycles for CGB double speed mode.
     * @param {Number} cycles
     * @returns {Number} halves the input cycles if in double speed mode
     */
    getAdjustedCycles(cycles) {
        return cycles >> this.cgb.speed_mode;
    }

    /**
     *
     * @param {Number} tile 0-255
     * @returns
     */
    getBGTileAddress(tile) {
        // check for signed tile
        tile &= 255;
        if(this.tileBase == 0x9000 && tile > 127)
            tile -= 256;

        return this.tileBase + (tile << 4);
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
        if(v == true) {
            if(!this.lcdEnabled) {
                this.cycles = 0;
                this.mode = PPUMODE.hblank;
            }
            this.regs.lcdc |= 0x80;
        } else {
            this.regs.lcdc &= 0x7F;
            this.regs.scanline = 0;
        }
    }

    /**
     * Safely checks current VRAM bank
     * @returns 1 if we are using first VRAM bank, otherwise 0
     */
    getVRAMBank() {
        return this.cgb.vbank;
    }


    accepts(addr) {
        return (addr >= 0xFF40 && addr <= 0xFF50) | (addr >= 0xFF68 && addr <= 0xFF6B);
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x40:
                this.lcdEnabled = (byte & 0x80) == 0x80;
                this.regs.lcdc = byte;
                break;
            case 0x41:
                this.regs.stat = (byte & 0xF8) | 0x80;
                break;
            case 0x42:
                this.regs.scy = byte;
                break;
            case 0x43:
                this.regs.scx = byte;
                break;
            case 0x45:
                this.regs.syc = byte;
                break;
            case 0x46:
                this.regs.dma = byte;
                this.parent.DMATransfer(byte);
                break;
            case 0x47:
                this.regs.bgp = byte;
                this.bgPal = [
                    palette[(byte & 0b00000011)],
                    palette[(byte & 0b00001100) >> 2],
                    palette[(byte & 0b00110000) >> 4],
                    palette[(byte & 0b11000000) >> 6]
                ];
                break;
            case 0x48:
                this.regs.obj0 = byte;
                this.obj0Pal = [
                    palette[(byte & 0b00000011)],
                    palette[(byte & 0b00001100) >> 2],
                    palette[(byte & 0b00110000) >> 4],
                    palette[(byte & 0b11000000) >> 6]
                ];
                break;
            case 0x49:
                this.regs.obj1 = byte;
                this.obj1Pal = [
                    palette[(byte & 0b00000011)],
                    palette[(byte & 0b00001100) >> 2],
                    palette[(byte & 0b00110000) >> 4],
                    palette[(byte & 0b11000000) >> 6]
                ];
                break;
            case 0x4A:
                this.regs.wy = byte;
                break;
            case 0x4B:
                this.regs.wx = byte;
                break;
            case 0x4D:
                this.cgb.key1 = byte & 1;
                break;
            case 0x4F:
                // cgb only
                this.cgb.vbank = this.parent.cgb ? byte & 0x1 : 0;
                break;
            case 0x68:
                // cgb only (BCPS/BGPI)
                this.cgb.bgi = byte & 0x3F;
                this.cgb.bgAutoInc = (byte & 0x80) == 0x80;
                break;
            case 0x69:
                this.writeBGPal(byte);
                break;
            case 0x6A:
                // cgb only (OCPS/OBPI)
                this.cgb.obji = byte & 0x3F;
                this.cgb.objAutoInc = (byte & 0x80) == 0x80;
                break;
            case 0x6B:
                this.writeOBJPal(byte);
                break;
        }
    }

    // mode 2 and 3 cannot access OAM (fe00-fe9f)
    oamAccessible() {
        return !this.lcdEnabled || (this.mode != PPUMODE.scanlineOAM && this.mode != PPUMODE.scanlineVRAM);
    }

    vramAccessible() {
        return !this.lcdEnabled || (this.mode != PPUMODE.scanlineVRAM);
    }

    read8(addr) {
        switch (addr & 0xFF) {
            case 0x40:
                return this.regs.lcdc;
            case 0x41:
                return this.regs.stat;
            case 0x42:
                return this.regs.scy;
            case 0x43:
                return this.regs.scx;
            case 0x44:
                return this.regs.scanline;
            case 0x45:
                return this.regs.syc;
            case 0x46:
                return this.regs.dma;
            case 0x47:
                return this.regs.bgp;
            case 0x48:
                return this.regs.obj0;
            case 0x49:
                return this.regs.obj1;
            case 0x4A:
                return this.regs.wy;
            case 0x4B:
                return this.regs.wx;
            case 0x4D:
                if(this.parent.cgb)
                    return 0x7e | (this.cgb.key1 & 1) | (this.cgb.speed_mode << 7);
                else
                    return 0xff;
            case 0x68:
                // cgb only
                return this.parent.cgb ? this.cgb.bgi : 0xff;
            case 0x69:
                // cgb only
                return this.cgb.bgPal[this.cgb.bgi];
            case 0x6A:
                // cgb only
                return this.cgb.obji;
            case 0x6B:
                return this.cgb.objPal[this.cgb.obji];
            case 0x4F:
                if(this.parent.cgb)
                    return this.cgb.vbank | 0xFE;
                else
                    return 0xff;
            default:
                return 0xFF;
        }
    }

    step(cycles) {
        const cpu = this.parent;
        this.regs.stat &= 252;

        if(!this.lcdEnabled) {
            this.regs.stat |= PPUMODE.hblank;
            return;
        }

        this.cycles += cycles;

        do {

        switch(this.mode)
        {
            case PPUMODE.scanlineOAM:
                if(this.cycles >= 80) {
                    this.mode = PPUMODE.scanlineVRAM
                    this.cycles -= 80;
                }
                break;
            case PPUMODE.scanlineVRAM:
                if(this.cycles >= 172) {
                    this.mode = PPUMODE.hblank
                    this.parent.hdma.hasCopied = false;
                    cpu.renderer.renderScanline();
                    this.cycles -= 172;
                }
                break;
            case PPUMODE.hblank:
                if(this.cycles >= 204) {
                    this.regs.scanline++;
                    if(this.regs.scanline > 143) {
                        this.mode = PPUMODE.vblank;
                        cpu.requestBufferCopy();
                        cpu.requestInterrupt(InterruptType.vBlank);
                    } else {
                        this.mode = PPUMODE.scanlineOAM;
                    }
                    this.cycles -= 204;
                }
                break;
            case PPUMODE.vblank:
                if(this.cycles >= 456) {
                    this.regs.scanline++;
                    if(this.regs.scanline > 153) {
                        this.regs.scanline = 0;
                        this.mode = PPUMODE.scanlineOAM;
                        this.parent.renderer.internalWinOffset = 0;
                    }

                    this.cycles -= 456;
                }
                break;
        }
        } while (this.cycles >= PPUMODE_CYCLES[this.mode]);

        this.updateStatinterruptLine();

        this.regs.stat |= this.mode;
    }

    /**
     * STAT interrupt blocking
     */
    updateStatinterruptLine() {
        const prevLine = this.statInterrupt;
        this.statInterrupt = false;

        if(!this.lcdEnabled)
            return;

        if(this.mode == PPUMODE.scanlineOAM && UInt8.getBit(this.regs.stat, 5)) {
            this.statInterrupt = true;
        }

        if(this.mode == PPUMODE.hblank && UInt8.getBit(this.regs.stat, 3)) {
            this.statInterrupt = true;
        }

        if(this.mode == PPUMODE.vblank && UInt8.getBit(this.regs.stat, 4)) {
            this.statInterrupt = true;
        }

        if(this.updateCoincidence() && UInt8.getBit(this.regs.stat, 6)) {
            this.statInterrupt = true;
        }

        if(!prevLine && this.statInterrupt) {
            this.parent.requestInterrupt(InterruptType.lcd);
        }
    }

    updateCoincidence() {
        // reset coincidence flag
        this.regs.stat &= 0xFB;

        if(this.regs.syc == this.regs.scanline) {
            // set coincidence flag
            this.regs.stat |= 1 << 2;
            return true;
        } else {
            return false;
        }
    }


    translateColor(r, g, b) {
        r <<= 3, g <<= 3, b <<= 3;

        switch(this.colorMode) {
            case ColorMode.DESATURATE:
                const l = 0.3 * r + 0.6 * g + 0.1 * b;
                const f = 0.4;
                return [Math.floor(r + f * (l - r)), Math.floor(g + f * (l - g)), Math.floor(b + f * (l - b))];
            case ColorMode.GAMMA:
                r /= (0x1f * 8); // intensity (0-1)
                g /= (0x1f * 8); // intensity (0-1)
                b /= (0x1f * 8); // intensity (0-1)
                r **= 7/2;
                g **= 7/2;
                b **= 7/2;

                const tr = 0xff * r + 0xc1 * g + 0x3b * b;
                const tg = 0x71 * r + 0xd6 * g + 0xce * b;
                const tb = 0x45 * r + 0x50 * g + 0xff * b;
                return [tr, tg, tb];
            case ColorMode.SCALED:
            default:
                return [r, g, b];
        }
    }

    // must convert this modified palette into usable RGB
    updateBackgroundRGB(bgi, byte) {
        const palNum = bgi >> 3;
        const colorIndex = (bgi >> 1) & 3;

        if((bgi & 0x1) == 1)
            byte &= 0x7F;

        this.cgb.bgPal[bgi] = byte;
        // ^ this is only used for reading. Functionality is in `rgbBG`

        bgi &= 0xfffe;

        const rgb555 = UInt16.makeWord(this.cgb.bgPal[bgi + 1], this.cgb.bgPal[bgi]);

        const r = rgb555 & 0x1f;
        const g = UInt8.getRange(rgb555, 5, 5);
        const b = UInt8.getRange(rgb555, 10, 5);
        const colors = this.translateColor(r, g, b);

        this.cgb.rgbBG[palNum][colorIndex][0] = colors[0];
        this.cgb.rgbBG[palNum][colorIndex][1] = colors[1];
        this.cgb.rgbBG[palNum][colorIndex][2] = colors[2];
    }

    updateObjectRGB(obji, byte) {
        const palNum = obji >> 3;
        const colorIndex = (obji >> 1) & 3;

        this.cgb.objPal[obji] = (obji & 0x1) == 1 ? byte & 0x7f : byte;

        obji &= 0xfffe;

        const rgb555 = UInt16.makeWord(this.cgb.objPal[obji + 1], this.cgb.objPal[obji]);

        const r = rgb555 & 0x1f;
        const g = UInt8.getRange(rgb555, 5, 5);
        const b = UInt8.getRange(rgb555, 10, 5);
        const colors = this.translateColor(r, g, b);

        this.cgb.rgbOBJ[palNum][colorIndex][0] = colors[0];
        this.cgb.rgbOBJ[palNum][colorIndex][1] = colors[1];
        this.cgb.rgbOBJ[palNum][colorIndex][2] = colors[2];
    }

    writeBGPal(byte) {
        // cgb only
        const bgi = this.cgb.bgi;

        if(this.cgb.bgAutoInc)
        this.cgb.bgi = (this.cgb.bgi + 1) & 0x3F;

        if(!this.parent.cgb || this.mode == PPUMODE.scanlineVRAM)
            return;

        this.updateBackgroundRGB(bgi, byte);
    }

    writeOBJPal(byte) {
        // cgb only
        const obji = this.cgb.obji;

        if(this.cgb.objAutoInc)
            this.cgb.obji = (this.cgb.obji + 1) & 0x3F;

        if(!this.parent.cgb || this.mode == PPUMODE.scanlineVRAM)
            return;

        this.updateObjectRGB(obji, byte);
    }


    export() {
        return {
            regs: this.regs,
            mode: this.mode,
            cycles: this.cycles,
            cgb: this.cgb,
            obj0pal: this.obj0Pal,
            obj1pal: this.obj1Pal,
            bgPal: this.bgPal,

        };
    }

    import(data) {
        const ppu_data = data["ppu"];

        if(!ppu_data)
            return false;

        this.regs = ppu_data.regs;
        this.mode = ppu_data.mode;
        this.cycles = ppu_data.cycles;
        this.cgb = ppu_data.cgb;
        this.cgb.bgPal = Object.values(this.cgb.bgPal);
        this.cgb.objPal = Object.values(this.cgb.objPal);
        this.obj0Pal = ppu_data.obj0Pal;
        this.obj1Pal = ppu_data.obj1Pal;
        this.bgPal = ppu_data.bgPal;

        return true;
    }
}