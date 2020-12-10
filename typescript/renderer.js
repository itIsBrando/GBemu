
var canvas = document.getElementById("screen");

// grayscale palette
//     [255, 255, 255],
//     [170, 170, 170],
//     [85, 85, 85],
//     [0, 0, 0,],

// greenish palette
var palette = [
    [240, 255, 240],// lighest
    [170, 210, 170],// lighter
    [85, 145, 85],  // darker
    [0, 40, 0],     // darkest
];

class Renderer {
    
    constructor() {
        this.context = canvas.getContext('2d');
        this.screen = this.context.getImageData(0, 0, 160, 144);
        for(let i = 0; i < 160 * 144 * 4; i++)
            this.screen.data[i] = 0xF0;

        this.drawBuffer();
    }

    drawBuffer() {
        this.context.putImageData(this.screen, 0, 0);
    }


    /**
     * Renders a scanline
     * @param {PPU} ppu PPU instance
     * @param {CPU} cpu CPU instance
     */
    renderScanline(ppu, cpu) {
        this.renderMap(ppu, cpu);
        this.renderWindow(ppu, cpu);
    }


    /**
     * Renders a background scanline
     * @param {PPU} ppu PPU instance
     * @param {CPU} cpu CPU instance
     */
    renderMap(ppu, cpu) {
        const scy = ppu.regs.scy, scx = ppu.regs.scx;
        const scanline = ppu.regs.scanline;
        const mapBase = ppu.mapBase;
        const tileBase = ppu.tileBase;
        
        let y = (scanline + scy) & 7; // same as % 8
        
        for(let i = 0; i <= 160/8; i++) {
            const yOffset = ((scanline + scy) >> 3) & 0x1F;
            const xOffset = (i + (scx >> 3)) & 0x1F;
            const mapAddress = mapBase + xOffset + (yOffset << 5);
            let tileNumber = cpu.read8(mapAddress);
            // check for signed tile
            if(tileBase == 0x9000 && tileNumber > 127)
                tileNumber -= 256;
            const dataAddress = tileBase + 16 * tileNumber + y * 2;
            
            this.drawTileLine(cpu, tileNumber, (i << 3) - (scx & 7), scanline, dataAddress)
        }
    }


    /**
     * X coordinate only works with multiples of 8
     * @param {PPU} ppu 
     * @param {CPU} cpu 
     */
    renderWindow(ppu, cpu) {
        // return if window is disabled
        if(UInt8.getBit(ppu.regs.lcdc, 5) == 0)
            return;

        const wx = ppu.regs.wx;
        const wy = ppu.regs.wy;

        const tileBase = ppu.tileBase;
        const mapBase = UInt8.getBit(ppu.regs.lcdc, 6) == 1 ? 0x9C00 : 0x9800;
        const scanline= ppu.regs.scanline;
        
        if(scanline < wy && scanline < 144)
            return;
        
        for(let x = wx>>3; x <= 160 / 8; x++)
        {
            const xMap = (x & 0xFF);
            const yMap = (scanline - wy) & 255;
            const y = yMap & 7;
            const mapAddress = mapBase + ( (yMap >> 3) * 32) + xMap-(wx>>3);
            let tile = cpu.read8(mapAddress);
            // signed tile
            if(tileBase == 0x9000 && (tile > 127))
                tile -= 256;
            const tileAddress = tileBase + (tile * 16) + y * 2;
            
            this.drawTileLine(cpu, mapAddress, (x << 3) - 7 + (wx & 7), scanline, tileAddress);
        }

    }


    renderSprites(ppu, cpu) {
        // return if sprites are disabled
        if(ppu.regs.lcdc & 0x2 == 0)
            return;

        const bigSprite = UInt8.getBit(ppu.regs.lcdc, 2) == 1;

        for(let s = 0; s < 40; s++)
        {
            const spriteBase = 0xFE00 + s * 4;
            const y = (cpu.read8(spriteBase) - 16);
            const x = (cpu.read8(spriteBase + 1) - 8);
            const tile = cpu.read8(spriteBase + 2);
            const flags= cpu.read8(spriteBase + 3);

            // draw 8x16 sprites
            if(bigSprite)
            {
                // if y-flip, then then second sprite is drawn above first 
                if(UInt8.getBit(flags, 6) == 1)
                {
                    this.drawTile(x, y + 8, tile * 16 + 0x8000, flags, cpu);
                    this.drawTile(x, y, (tile + 1) * 16 + 0x8000, flags, cpu);
                } else {
                    this.drawTile(x, y, tile * 16 + 0x8000, flags, cpu);
                    this.drawTile(x, y + 8, (tile + 1) * 16 + 0x8000, flags, cpu);
                }
            } else {
                
                this.drawTile(x, y, tile * 16 + 0x8000, flags, cpu);
            }
        }
    }


    /**
     * @param {CPU} cpu CPU instance 
     * @param {UInt16} mapAddress pointer to tile. Used for CGB flags byte
     * @param {number} x 
     * @param {number} y 
     * @param {UInt16} tileAddress
     */
    drawTileLine(cpu, mapAddress, x, y, tileAddress) {
        if(y >= 144) { return };
        const flags = cpu.getTileAttributes(mapAddress);
        const xFlip = UInt8.getBit(flags, 6) == 1;
        // const yFlip = UInt8.getBit(flags, 5) == 1;
         // THIS DOES NOT WORK
        // if(yFlip == true) tileAddress += 16 - (y & 7) * 2;

        const pal = Renderer.getPalette(cpu, true, flags);

        // override VRAM bank
        tileAddress -= 0x8000;
        const vram = UInt8.getBit(flags, 3) ? cpu.ppu.cgb.vram : cpu.mem.vram;
        const byte1 = vram[tileAddress];
        const byte2 = vram[tileAddress + 1];

        for(let i = 0; i < 8; i++) {
            const index = UInt8.getBit(byte1, i) | (UInt8.getBit(byte2, i) << 1);
            const dx = xFlip == true ? i : 7 - i;
            const col = pal[index & 3];
            if((x + dx) < 0 || (x + dx) > 160)
                continue;
            // since there are four bytes per pixel, we must times by 4
            const canvasOffset = (x + dx + y * 160) << 2;

            this.screen.data[canvasOffset + 0] = col[0];
            this.screen.data[canvasOffset + 1] = col[1];
            this.screen.data[canvasOffset + 2] = col[2];
            this.screen.data[canvasOffset + 3] = 255; // alpha
        }
    }


    /**
     * Gets the 4-color palette for a sprite or bg tile
     * @param {CPU} cpu 
     * @param {Boolean} isBG true for a bg tile, else 
     * @param {Number} flags 8-bit flags byte for sprite or bg tile
     * @returns Array with four entries encoded in RGB
     */
    static getPalette(cpu, isBG, flags) {
        if(!cpu.cgb) {
            if(isBG)
                return cpu.ppu.bgPal;
            
            return UInt8.getBit(flags, 4) ? cpu.ppu.obj1Pal : cpu.ppu.obj0Pal;
        } else
        {
            // CGB palettes
            const palNum = flags & 0x7;
            if(isBG) {
                return cpu.ppu.cgb.rgbBG[palNum];
            } else
            {
                return cpu.ppu.cgb.rgbOBJ[palNum];
            }
        }
    }

    /**
     * Only meant for sprites
     * @param {number} x 
     * @param {number} y 
     * @param {UInt16} tileAddress 
     * @param {UInt8} flags 
     * @param {CPU} cpu 
     */
    drawTile(x, y, tileAddress, flags, cpu) {
        const xFlip = UInt8.getBit(flags, 5) == 1;
        const yFlip = UInt8.getBit(flags, 6) == 1;
        let pal = Renderer.getPalette(cpu, false, flags);

        for(let dy = 0; dy < 8; dy++) {
            const addr = tileAddress - 0 + (dy << 1);
            const byte1 = cpu.read8(addr);
            const byte2 = cpu.read8(addr + 1);
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
                if((x + xf > 159) || (x + xf < 0))
                    continue;
                let canvasOffset = (x + xf + (y + yf) * 160) << 2;
                this.screen.data[canvasOffset + 0] = col[0];
                this.screen.data[canvasOffset + 1] = col[1];
                this.screen.data[canvasOffset + 2] = col[2];
                this.screen.data[canvasOffset + 3] = 255; // alpha
            }
        }
    }

    dumpTiles() {
        for(let y = 0; y < 15; y++)
        {
            for(let x = 0; x < 20; x++)
            {
                const add = (x + y * 20) * 16;
                this.drawTile(x <<3, y << 3, 0x8000 + add, 0, c);
            }
        }
        this.drawBuffer();
    }
}