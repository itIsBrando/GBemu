
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
        this.context.fillStyle = "#FFFFFF";
        this.context.fillRect(0, 0, 160, 144);
        this.screen = this.context.getImageData(0, 0, 160, 144);

        this.context.globalAlpha = 1.0;
        this.drawBuffer();
    }

    drawBuffer() {
        this.context.putImageData(this.screen, 0, 0);
    }

    clearBuffer() {
        for(let i = 0; i < 160 * 144 * 4; i++)
            this.screen.data[i] = 0xFF;
    }

    /**
     * Renders a scanline
     * @param {PPU} ppu PPU instance
     * @param {CPU} cpu CPU instance
     */
    renderScanline(ppu, cpu) {
        if(cpu.speed > 1)
        {
            cpu.framesToSkip++;
            if(cpu.framesToSkip < 144 * 8)
                return
            else if(cpu.framesToSkip >= 144 * 16)
                cpu.framesToSkip = 0;
        }

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
        const tileBase = ppu.tileBase;
        
        let y = (scanline + scy) & 7; // same as % 8
        
        for(let i = 0; i <= 20; i++) {
            const yOffset = ((scanline + scy) >> 3) & 0x1F;
            const xOffset = (i + (scx >> 3)) & 0x1F;
            const mapAddress = ppu.mapBase + xOffset + (yOffset << 5);
            let tileNumber = cpu.read8(mapAddress);
            // check for signed tile
            if(tileBase == 0x9000 && tileNumber > 127)
                tileNumber -= 256;
            const dataAddress = tileBase + 16 * tileNumber + (y << 1);
            
            this.drawTileLine(cpu, mapAddress, (i << 3) - (scx & 7), scanline, dataAddress)
        }
    }


    /**
     * X coordinate only works with multiples of 8
     * @param {PPU} ppu 
     * @param {CPU} cpu 
     */
    renderWindow(ppu, cpu) {
        // return if window is disabled
        if(!UInt8.getBit(ppu.regs.lcdc, 5))
            return;

        const wx = ppu.regs.wx;
        const wy = ppu.regs.wy;

        const tileBase = ppu.tileBase;
        const mapBase = UInt8.getBit(ppu.regs.lcdc, 6) ? 0x9C00 : 0x9800;
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

        const bigSprite = UInt8.getBit(ppu.regs.lcdc, 2);

        for(let s = 0; s < 40; s++)
        {
            const spriteBase = 0xFE00 + s * 4;
            const y = cpu.read8(spriteBase) - 16;
            const x = cpu.read8(spriteBase + 1) - 8;
            const tile = cpu.read8(spriteBase + 2);
            const flags= cpu.read8(spriteBase + 3);
            const t = (tile << 4) + 0x8000;

            // draw 8x16 sprites
            if(bigSprite)
            {
                // if y-flip, then then second sprite is drawn above first 
                if(UInt8.getBit(flags, 6))
                {
                    this.drawTile(x, y + 8, t, flags, cpu);
                    this.drawTile(x, y, t + 16, flags, cpu);
                } else {
                    this.drawTile(x, y, t, flags, cpu);
                    this.drawTile(x, y + 8, t + 16, flags, cpu);
                }
            } else {
                
                this.drawTile(x, y, t, flags, cpu);
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
        const flags = cpu.cgb ? cpu.ppu.getTileAttributes(mapAddress) : 0;
        const xFlip = UInt8.getBit(flags, 6);
        // add yflip

        const pal = Renderer.getPalette(cpu, true, flags);

        // override VRAM bank reading
        tileAddress -= 0x8000;
        const vram = (flags & 0x8) === 0x8 ? cpu.ppu.cgb.vram : cpu.mem.vram;
        let byte1 = vram[tileAddress];
        let byte2 = vram[tileAddress + 1];
        // since there are four bytes per pixel, we must times by 4
        let canvasOffset = (x + (xFlip?0:7) + y * 160) << 2;

        for(let i = 0; i < 8; i++) {
            const index = (byte1 & 1) | ((byte2 & 1) << 1);
            byte1 >>= 1;
            byte2 >>= 1;
            const dx = xFlip ? i : 7 - i;
            if((x + dx) < 0 || (x + dx) > 160)
                continue;
            
            const col = pal[index];
            this.screen.data[canvasOffset + 0] = col[0];
            this.screen.data[canvasOffset + 1] = col[1];
            this.screen.data[canvasOffset + 2] = col[2];
            canvasOffset = xFlip ? canvasOffset + 4 : canvasOffset - 4;
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
            if(isBG)
                return cpu.ppu.cgb.rgbBG[palNum];
            else
                return cpu.ppu.cgb.rgbOBJ[palNum];
        }
    }

    /**
     * Only meant for sprites
     * @param {Number} x 
     * @param {Number} y 
     * @param {UInt16} tileAddress 
     * @param {UInt8} flags 
     * @param {CPU} cpu
     * @param {Boolean} useBGPal
     * @returns screen object
     */
    drawTile(x, y, tileAddress, flags, cpu, useBGPal = false, screen = this.screen, w = 160) {
        const xFlip = UInt8.getBit(flags, 5);
        const yFlip = UInt8.getBit(flags, 6);
        let pal = Renderer.getPalette(cpu, useBGPal, flags);

        for(let dy = 0; dy < 8; dy++) {
            const addr = tileAddress + (dy << 1);
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
                if((x + xf > w) || (x + xf < 0))
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