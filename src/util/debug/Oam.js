var Oam = new function() {
    const div = document.getElementById('OamDiv');

    this.init = function() {
        // each sprite needs its own canvas
        const spriteDiv = document.getElementById("DebugSprites");
        spriteDiv.innerHTML = '';

        for(let i = 0; i < 40; i++) {
            const canv = document.createElement("canvas");
            
            canv.width = 8;
            canv.height = 8; // will be adjusted before drawing if necessary
            canv.className = "obj-canvas";
            canv.id = "sprite" + i;
            
            canv.onclick = canv.onmouseenter = function() {
                Oam.draw(this.id.substring(6));
            };
            
            spriteDiv.appendChild(canv);
        }
    }

    this.getOamHeight = function() {
        return UInt8.getBit(c.ppu.regs.lcdc, 2) ? 16 : 8;
    }

    /**
     * @returns true if a given sprite coordinate is visible on the screen;
     */
    this.inScreenBounds = function(x, y) {
        return y > 0 && y < 160 && x > 0 && x < 168;
    }

    this.draw = function(num) {
        const base = num << 2;
		const y = c.mem.oam[base];
		const x = c.mem.oam[base + 1];
		const t = c.mem.oam[base + 2];
		const f = c.mem.oam[base + 3];

		const a = OamDiv.getElementsByTagName("p")[0];
		const b = OamDiv.getElementsByTagName("h3")[0];

		const str =
			`Address: ${Debug.hex(OAM_BASE + base, 4)}` +
			`<br>Y: ${y}` +
			`<br>X: ${x}` +
			`<br>Tile: ${UInt8.getBit(f, 3) ? 1 : 0}:${Debug.hex(t)}` +
			`<br>X-flip: ${(f >> 5) & 1}` +
			`<br>Y-flip: ${(f >> 6) & 1}` +
			`<br>Priority: ${(f >> 7) & 1}` +
			`<br>Palette Num: ${c.cgb ? f & 3 : (f >> 4) & 1}`;
		
		a.innerHTML = str;
		b.innerHTML = "Sprite " + num;
    }


    this.show = function() {
        showElement(div, 'grid');

		this.draw(0);

		for(let s = 0; s < 40; s++)
		{
			const spriteBase = (s << 2);
            const x = c.mem.oam[spriteBase + 1];
            const y = c.mem.oam[spriteBase + 0];
			const tile  = c.mem.oam[spriteBase + 2];
			const flags = c.mem.oam[spriteBase + 3];
            const height = this.getOamHeight();
            const canv = document.getElementById("sprite" + s);
            const context = canv.getContext('2d');

            canv.height = height;
            canv.style.opacity = `${this.inScreenBounds(x, y) ? 1 : 0.2}`;
            context.fillStyle = "#e0e0e0";
            context.fillRect(0, 0, 8, height);
            context.globalAlpha = 1.0;
    
            let screen = context.getImageData(0, 0, 8, height);
            
			c.renderer.drawTile(0, 0, tile * 16 + VRAM_BASE, flags, false, screen, 8);

            if(height == 16)
                c.renderer.drawTile(0, 8, (tile + 1)* 16 + VRAM_BASE, flags, false, screen, 8);
            
            context.putImageData(screen, 0, 0);
		}

		c.renderer.drawBuffer();
    }

    this.hide = function() {
        hideElement(div);
    }
}