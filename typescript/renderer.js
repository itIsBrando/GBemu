
var canvas = document.getElementById("screen");

window.onresize = setCanvasSize;

function setCanvasSize() {
    const size = Math.min(window.innerWidth, window.innerHeight - 100) + "px";
    canvas.style.width = size;
    canvas.style.height = size;
}

// grayscale palette
// var palette = [
    //     [255, 255, 255],
    //     [170, 170, 170],
    //     [85, 85, 85],
    //     [0, 0, 0,],
// ];

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
        setCanvasSize();
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
        
        for(let i = 0; i <= 160/8; i++) {
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
            let tile = cpu.read8(mapBase + ( (yMap >> 3) * 32) + xMap-(wx>>3));
            // signed tile
            if(tileBase == 0x9000 && (tile > 127))
                tile -= 256;
            const tileAddress = tileBase + (tile * 16) + y * 2;
            
            this.drawTileLine(cpu, ppu, (x << 3) - 7 + (wx & 7), scanline, tileAddress, false, false);
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

        const byte1 = cpu.read8(tileAddress);
        const byte2 = cpu.read8(tileAddress + 1);

        for(let i = 0; i < 8; i++) {
            const index = UInt8.getBit(byte1, i) | (UInt8.getBit(byte2, i) << 1);
            const dx = xFlip == true ? i : 7 - i;
            const col = ppu.bgPal[index & 3];
            if((x + dx) < 0 || (x + dx) > 160)
                continue;
            // since there are four bytes per pixel, we must times by 4
            const canvasOffset = (x + dx + y * 160) * 4;

            this.screen.data[canvasOffset + 0] = col[0];
            this.screen.data[canvasOffset + 1] = col[1];
            this.screen.data[canvasOffset + 2] = col[2];
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
     */
    drawTile(x, y, tileAddress, flags, cpu) {
        const xFlip = UInt8.getBit(flags, 5) == 1;
        const yFlip = UInt8.getBit(flags, 6) == 1;
        const p = UInt8.getBit(flags, 4);
        let pal;
        if(p)
            pal = cpu.ppu.obj1Pal;
        else
            pal = cpu.ppu.obj0Pal;

        for(let dy = 0; dy < 8; dy++) {
            const byte1 = cpu.read8(tileAddress + dy * 2);
            const byte2 = cpu.read8(tileAddress + dy * 2 + 1);
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
                let canvasOffset = (x + xf + (y + yf) * 160) * 4;
                this.screen.data[canvasOffset + 0] = col[0];
                this.screen.data[canvasOffset + 1] = col[1];
                this.screen.data[canvasOffset + 2] = col[2];
                this.screen.data[canvasOffset + 3] = 255; // alpha
            }
        }
    }
}