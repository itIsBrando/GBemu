
var canvas = document.getElementById("screen");
let isFullscreen = false;

canvas.addEventListener('dblclick', (e) => {
    if(isFullscreen) {
        isFullscreen = false;
        if(!exitFullscreen())
            isFullscreen = requestFullscreen();
    } else {
        isFullscreen = requestFullscreen();
    }
});


// greenish palette
var palette = [
    [240, 255, 240],// lighest
    [170, 210, 170],// lighter
    [85, 145, 85],  // darker
    [0, 40, 0],     // darkest
];

class Renderer {
    static frameSkipAmount = 0;
    static frameSkip = 0;

    constructor(cpu) {
        this.context = canvas.getContext('2d');

        /** @TODO DONT flipping use this hacked together method for implementing obj-bg priority
         * This holds `color indexes` (0-3) of the respective pixel on the screen.
         * However, this is not enough detail to determine palette or if the pixel was generated from the background or obj
         */
        this.scrnIndexes = new Uint8Array(160 * 144);
        this.screen = this.context.getImageData(0, 0, 160, 144);
        this.fillBuffer(0);
        this.filter = new Filter(canvas, 1);

        this.context.globalAlpha = 1.0;
        this.parent = cpu;


        /**
         * This is for the weird cases when the window is disabled and reenabled during a frame.
         * The gameboy resumes drawing where it left off.
         * @link https://github.com/shonumi/gbe-plus/commit/15df53c83677062f98915293fc03620af65bd7c4
         */
        this.internalWinOffset = 0;
        this.drawBuffer();
    }

    export() {
        return {};
    }

    import(data) {

    }

    drawBuffer() {
        const cpu = this.parent;

        if(cpu.speed > 1) {
            cpu.framesToSkip++;
            if(cpu.framesToSkip < cpu.speed)
                return;
            else
                cpu.framesToSkip = 0;
        } else if(Renderer.frameSkip-- != 0) {
            return;
        } else {
            Renderer.frameSkip = Renderer.frameSkipAmount;
        }

        const data = this.filter.apply(this.screen);
        this.context.putImageData(data, 0, 0);
    }

    /**
     * Fills the screen with GB color white
     * @param palIndex index of the DMG palette color to fill screen with (0-3)
     */
    fillBuffer(palIndex) {
        let [r, g, b] = palette[palIndex & 3];
        for(let i = 0; i < this.screen.data.length; i += 4) {
            this.screen.data[i] = r;
            this.screen.data[i + 1] = g;
            this.screen.data[i + 2] = b;
            this.screen.data[i + 3] = 255;
        }

    }

    /**
     * Renders a scanline
     */
    renderScanline() {
        if(Renderer.frameSkip) {
            return;
        }

        this.renderMap();
        this.renderWindow();
        this.renderSpriteLine();
    }

    /**
     * Renders a background scanline
     */
    renderMap() {
        const ppu = this.parent.ppu;

        if((ppu.regs.lcdc & 1) == 0 && !this.parent.cgb)
            return; // @todo this should fill in with bgpal color 0

        const scy = ppu.regs.scy, scx = ppu.regs.scx;
        const scanline = ppu.regs.scanline;
        const yOffset = ((scanline + scy) >> 3) & 0x1F;
        const y = (scanline + scy) & 7; // same as % 8

        for(let i = 0; i <= 20; i++) {
            const xOffset = (i + (scx >> 3)) & 0x1F;
            const mapAddress = ppu.mapBase + xOffset + (yOffset << 5);
            const tileNum = this.parent.mem.vram[mapAddress - 0x8000];
            const flags = ppu.getTileAttributes(mapAddress);
            const yFlip = flags & 64;

            const tx = yFlip ? 7 - y : y; // tile addr offset
            const tileAddr = ppu.getBGTileAddress(tileNum) + (tx << 1);

            this.drawTileLine((i << 3) - (scx & 7), scanline, tileAddr, flags, Renderer.getPalette(this.parent, true, flags));
        }
    }

    /**
     * Renders one line of the window if enabled
     */
    renderWindow() {
        const ppu = this.parent.ppu;
        // return if window is disabled
        if((ppu.regs.lcdc & 32) === 0)
            return;
        if((ppu.regs.lcdc & 1) === 0 && !this.parent.cgb)
            return;

        const wx = ppu.regs.wx;
        const wy = ppu.regs.wy;
        const scanline = ppu.regs.scanline;

        if(wx >= 160 || (scanline < wy && scanline < 144))
            return;


        if(this.internalWinOffset == 0) {
            this.internalWinOffset = (scanline - wy) & 255;
        } else {
            this.internalWinOffset++;
            this.internalWinOffset &= 255;
        }

        const mapBase = ppu.winBase;
        const yMap = this.internalWinOffset;
        for(let x = wx >> 3; x <= 160 / 8; x++)
        {
            const xMap = (x & 0xFF);
            const y = yMap & 7;
            const mapAddress = mapBase + ( ( yMap >> 3 ) * 32 ) + xMap - ( wx >> 3 );
            const flags = ppu.getTileAttributes(mapAddress);
            const yFlip = flags & 64;

            const tx = yFlip ? 7 - y : y; // tile addr offset
            const tileAddress = ppu.getBGTileAddress(this.parent.mem.vram[mapAddress - 0x8000]) + (tx << 1);

            this.drawTileLine((x << 3) - 7 + (wx & 7), scanline, tileAddress, flags, Renderer.getPalette(this.parent, true, flags));
        }

    }


    renderSpriteLine() {
        const ppu = this.parent.ppu;
        const cpu = this.parent;

        if(!UInt8.getBit(ppu.regs.lcdc, 1))
            return;

        const bigSprite = UInt8.getBit(ppu.regs.lcdc, 2);
        const height = bigSprite ? 16 : 8;
        const scanline = ppu.regs.scanline;
        let addr = 0, objs = 0;

        for(let i = 0; i < 40; i++) {
            const y = cpu.mem.oam[addr] - 16;
            const x = cpu.mem.oam[addr + 1] - 8;
            let tile = cpu.mem.oam[addr + 2];
            const flg = cpu.mem.oam[addr + 3];
            const yFlip = UInt8.getBit(flg, 6);

            const dy = (scanline - y) & 15;
            const pal = Renderer.getPalette(cpu, false, flg);

            if(!(scanline >= y && scanline < y + height)) {
                addr += 4;
                continue;
            }

            if(bigSprite) {
                tile &= 0xfe;
                if((yFlip ? 15 - dy : dy) > 7)
                    tile++;
            }
            const tx = yFlip ? 7 - (dy & 7) : dy & 7;
            const tileAddr = (tile << 4) + 0x8000 + (tx << 1);

            this.drawTileLine(x, y + dy, tileAddr, flg, pal, true);

            if(++objs >= 10) { // obj limit
                break;
            }

            addr += 4;
        }
    }

    /**
     *
     * @param {Number} oamPriority oam attr bit 7
     * @param {Number} bgPriority bg tile attr bit 7
     * @returns
     */
    objHasPriority(oamPriority, bgPriority) {
        if((this.parent.ppu.regs.lcdc & 1) == 0)
            return true;
        if(oamPriority == 0&& bgPriority == 0)
            return true;
        return false;
    }


    /**
     * @param {number} x
     * @param {number} y
     * @param {UInt16} tileAddress
     * @param {UInt8} flag byte for flags. Either for tiles or sprites
     * @param {Array} pal palette to use for drawing
     * @param {Boolean} isObj determine whether to draw using a sprite or background
     * @note this cannot handle yflips
     */
    drawTileLine(x, y, tileAddress, flags, pal, isObj = false) {
        if(y >= 144) { return };
        const cpu = this.parent;
        const xFlip = flags & 32;

        // override VRAM bank reading
        tileAddress -= 0x8000;
        // if we are using bank 1
        if(flags & (1 << 3)) {
            tileAddress += 0x2000;
        }

        let byte1 = cpu.mem.vram[tileAddress];
        let byte2 = cpu.mem.vram[tileAddress + 1];

        // since there are four bytes per pixel, we must times by 4
        let canvasOffset = (x + (xFlip?0:7) + y * 160) << 2;
        let canvasDelta = xFlip ? +4 : -4;

        for(let i = 0; i < 8; i++) {
            const index = (byte1 & 1) | ((byte2 & 1) << 1);
            const dx = xFlip ? i : 7 - i;
            byte1 >>= 1;
            byte2 >>= 1;
            if(((isObj && index == 0)) || ((x + dx) < 0 || (x + dx) >= 160)) {
                canvasOffset += canvasDelta;
                continue;
            }

            // must account for priorities
            if(isObj) {
                const tx = (cpu.ppu.regs.scx + (x + dx)) >> 3;
                const ty = (cpu.ppu.regs.scy + y) >> 3;
                const tileAddr = tx + (ty << 5) + cpu.ppu.mapBase; // points to tile
                const tileAttr = cpu.ppu.getTileAttributes(tileAddr)

                if(!this.objHasPriority(flags & 0x80, tileAttr & 0x80) && this.scrnIndexes[canvasOffset >> 2] != 0) {
                    canvasOffset += canvasDelta;
                    continue;
                }
            }

            const col = pal[index];
            this.scrnIndexes[canvasOffset >> 2] = index;
            this.screen.data[canvasOffset + 0] = col[0];
            this.screen.data[canvasOffset + 1] = col[1];
            this.screen.data[canvasOffset + 2] = col[2];
            canvasOffset += canvasDelta;
        }
    }


    /**
     * Gets the 4-color palette for a sprite or bg tile
     * @param {CPU} cpu
     * @param {Boolean} isBG true for a bg tile, else sprites
     * @param {Number} flags 8-bit flags byte for sprite or bg tile
     * @returns Array with four entries encoded in RGB
     */
    static getPalette(cpu, isBG, flags) {
        if(cpu.cgb) {
            if(isBG)
                return cpu.ppu.cgb.rgbBG[flags & 7];
            else
                return cpu.ppu.cgb.rgbOBJ[flags & 7];
        } else {
            if(isBG)
                return cpu.ppu.bgPal;

            return flags & 16 ? cpu.ppu.obj1Pal : cpu.ppu.obj0Pal;
        }
    }


    static setPalette(arr) {
        palette = arr;
        c.ppu.onPaletteChange();
    }

    /**
     * Sets GBC color correction mode
     * @param {ColorMode} key
     */
    static setColorMode(key) {
        PPU.colorMode = ColorMode[key] || 0;
        document.getElementById('correctionType').children[0].innerHTML = key.toLowerCase() || "SCALED";
        Settings.set_core('ColorCorrection', key);
    }

    /**
     * Only meant for sprites
     * @param {Number} x
     * @param {Number} y
     * @param {UInt16} tileAddress
     * @param {UInt8} flags
     * @param {CPU} cpu
     * @param {Boolean} useBGPal
     * @param screen canvas's screen to draw onto
     * @returns screen object
     * @param {Boolean} useVBK true to use CGB's VRAM bank
     */
    drawTile(x, y, tileAddress, flags, useBGPal = false, screen = this.screen, w = 160, useVBK = false) {
        const cpu = this.parent;
        const xFlip = UInt8.getBit(flags, 5);
        const yFlip = UInt8.getBit(flags, 6);
        let pal = Renderer.getPalette(cpu, useBGPal, flags);

        for(let dy = 0; dy < 8; dy++) {
            const addr = tileAddress + (dy << 1) - 0x8000 + (useVBK ? 0x2000 : 0);
            const byte1 = cpu.mem.vram[addr];
            const byte2 = cpu.mem.vram[addr + 1];
            // skip this line if we are off screen
            if(y + dy < 0)
                continue;

            for(let i = 0; i < 8; i++) {
                const index = UInt8.getBit(byte1, i) | (UInt8.getBit(byte2, i) << 1);
                const col = pal[index & 0x03];
                // transparency
                if(index == 0)
                    continue;
                const yf = yFlip ? (7 - dy): dy;
                const xf = xFlip ? i : (7 - i);
                // check out of bound
                if((x + xf >= w) || (x + xf < 0))
                    continue;
                let canvasOffset = (x + xf + (y + yf) * w) << 2;
                screen.data[canvasOffset + 0] = col[0];
                screen.data[canvasOffset + 1] = col[1];
                screen.data[canvasOffset + 2] = col[2];
                screen.data[canvasOffset + 3] = 255; // alpha
            }
        }
    }

}