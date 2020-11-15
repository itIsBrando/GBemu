
var canvas = document.getElementById("screen");

// grayscale palette
// var palette = [
    //     [255, 255, 255],
    //     [170, 170, 170],
    //     [85, 85, 85],
    //     [0, 0, 0,],
// ];

// greenish palette
var palette = [
    [240, 255, 240],
    [170, 210, 170],
    [85, 145, 85],
    [0, 40, 0],
];

class Renderer {
    
    constructor() {
        this.context = canvas.getContext('2d');
        this.screen = this.context.getImageData(0, 0, 160, 144);
        for(let i = 0; i < 160 * 144 * 4; i++)
        {
                this.screen.data[i] = 255;
        }
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
        let scy = ppu.regs.scy, scx = ppu.regs.scx;
        let scanline = ppu.regs.scanline;
        let mapBase = ppu.mapBase;
        let tileBase = ppu.tileBase;
        
        let y = (scanline + scy) & 7; // same as % 8
        
        for(let i = 0; i < 160/8; i++) {
            let yOffset = ((scanline + scy) >> 3) & 0x1F;
            let xOffset = (i + (scx >> 3)) & 0x1F;
            let tileNumber = cpu.read8(mapBase + xOffset + (yOffset << 5));
            // check for signed tile
            if(tileBase == 0x9000 && tileNumber > 127)
                tileNumber -= 256;
            let dataAddress = tileBase + 16 * tileNumber + y * 2;
            
            this.drawTileLine(cpu, ppu, (i << 3) - (scx & 7), scanline, dataAddress)
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

        let wx = ppu.regs.wx - 7;
        let wy = ppu.regs.wy;

        let tileBase = UInt8.getBit(ppu.regs.lcdc, 4) == 1? 0x8000 : 0x9000;
        let mapBase = UInt8.getBit(ppu.regs.lcdc, 6) == 1 ? 0x9C00 : 0x9800;
        let scanline= ppu.regs.scanline;
        
        if(scanline < wy && scanline < 144)
            return;
        
        for(let x = wx>>3; x < 160 / 8; x++)
        {
            if(x < 0)
                continue;
            let xMap = (x & 0xFF);
            let yMap = (scanline - wy) & 255;
            let y = yMap & 7;
            let tile = cpu.read8(mapBase + ( (yMap >> 3) * 32) + xMap-(wx>>3));
            // signed tile
            if(tileBase == 0x9000 && tile > 127)
                tile -= 256;
            let tileAddress = tileBase + (tile * 16) + y * 2;
            
            this.drawTileLine(cpu, ppu, x << 3, scanline, tileAddress, false, false);
            // console.log("tile:"+tileAddress.toString(16)+" x:" + (x*8) + " y: " + yMap);
            // return;
        }

    }

    renderSprites(ppu, cpu) {
        // return if sprites are disabled
        if(ppu.regs.lcdc & 0x2 == 0)
            return;

            for(let s = 0; s < 40; s++)
            {
            let spriteBase = 0xFE00 + s * 4;
            let y = (cpu.read8(spriteBase) - 16);
            let x = (cpu.read8(spriteBase + 1) - 8);
            if(x < 0 || y < 0 || y > 143 || x > 160)
                continue;
            let tile = cpu.read8(spriteBase + 2);
            let flags= cpu.read8(spriteBase + 3);

            this.drawTile(x, y, tile * 16 + 0x8000, flags, cpu);
        }
    }

    /**
     * @param {CPU} cpu CPU instance 
     * @param {PPU} ppu PPU instance 
     * @param {number} x 
     * @param {number} y 
     * @param {UInt16} tileAddress 
     * @param {bool} xFlip optional
     * @param {bool} yFlip optional
     */
    drawTileLine(cpu, ppu, x, y, tileAddress, xFlip, yFlip) {
        if(y >= 144) { return };
         // this probably does not work
        // if(yFlip == true) tileAddress += 15 - (y & 7) * 2;

        let byte1 = cpu.read8(tileAddress);
        let byte2 = cpu.read8(tileAddress + 1);

        for(let i = 0; i < 8; i++) {
            let col = UInt8.getBit(byte1, i) | (UInt8.getBit(byte2, i) << 1);
            let dx = xFlip == true ? i : 7 - i;
            if(x + dx < 0)
                continue;
            // since there are four bytes per pixel, we must times by 4
            let canvasOffset = (x + dx + y * 160) * 4;
            this.screen.data[canvasOffset + 0] = ppu.bgPal[col & 3][0];
            this.screen.data[canvasOffset + 1] = ppu.bgPal[col & 3][1];
            this.screen.data[canvasOffset + 2] = ppu.bgPal[col & 3][2];
            this.screen.data[canvasOffset + 3] = 255; // alpha
        }
    }

    /**
     * Only meant for sprites
     * @param {number} x 
     * @param {number} y 
     * @param {UInt16} tileAddress 
     * @param {UInt8} flags 
     * @param {CPU} cpu 
     * @param {boolean} useTransparency whether index 0 should be drawn or exclude
     */
    drawTile(x, y, tileAddress, flags, cpu) {
        let xFlip = UInt8.getBit(flags, 5) == 1;
        let yFlip = UInt8.getBit(flags, 6) == 1;
        let p = UInt8.getBit(flags, 4) == 1;

        let pal = (p == 1) ? cpu.ppu.obj0Pal : cpu.ppu.obj1Pal;

        for(let dy = 0; dy < 8; dy++) {
            let byte1 = cpu.read8(tileAddress + dy * 2);
            let byte2 = cpu.read8(tileAddress + dy * 2 + 1);
            for(let i = 0; i < 8; i++) {
                let col = UInt8.getBit(byte1, i) | (UInt8.getBit(byte2, i) << 1);
                if(col == 0)
                    continue;
                let yf = yFlip ? 7 - dy: dy;
                let xf = xFlip ? i : 7 - i;
                let canvasOffset = (x + xf + (y + yf) * 160) * 4;
                this.screen.data[canvasOffset + 0] = pal[col & 3][0];
                this.screen.data[canvasOffset + 1] = pal[col & 3][1];
                this.screen.data[canvasOffset + 2] = pal[col & 3][2];
                this.screen.data[canvasOffset + 3] = 255; // alpha
            }
        }
    }
}