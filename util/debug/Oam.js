var Oam = new function() {
    const div = document.getElementById('OamDiv');

    this.init = function() {
        // each sprite needs its own canvas
        const spriteDiv = document.getElementById("DebugSprites");

        for(let i = 0; i < 40; i++) {
            const canv = document.createElement("canvas");
            
            canv.width = 8;
            canv.height = 8;
            canv.className = "obj-canvas";
            canv.id = "sprite" + i;
            
            canv.addEventListener("click", function() {
                Oam.draw(this.id.substring(6));
            });
            
            spriteDiv.appendChild(canv);
        }
    }

    this.draw = function(num) {
        const base = OAM_BASE + (num << 2);
		const y = c.read8(base);
		const x = c.read8(base + 1);
		const t = c.read8(base + 2);
		const f = c.read8(base + 3);

		const a = OamDiv.getElementsByTagName("p")[0];
		const b = OamDiv.getElementsByTagName("h3")[0];

		const labels = [
			`Address: ${Debug.hex(base, 4)}`,
			`Byte 0 (Y): ${y}`,
			`Byte 1 (X): ${x}`,
			`Byte 2 (Tile): ${Debug.hex(t)}`,
			`Byte 3 (Flag): ${Debug.hex(f, 2)}`,
			`Palette Num: ${c.cgb ? f & 3 : (f >> 4) & 1}`,
		];

		let str = ''
		for(let i in labels)
			str += labels[i] + '<br>';
		
		a.innerHTML = str;
		b.innerHTML = "Sprite " + num;
    }


    this.show = function() {
        showElement(div, 'grid');
        
		c.renderer.clearBuffer();
        c.renderer.renderSprites();

		this.draw(0);

		for(let s = 0; s < 40; s++)
		{
			const spriteBase = OAM_BASE + (s << 2);
			const tile  = c.read8(spriteBase + 2);
			const flags = c.read8(spriteBase + 3);
            const canv = document.getElementById("sprite" + s);
            const context = canv.getContext('2d');
            context.fillStyle = "#e0e0e0";
            context.fillRect(0, 0, 8, 8);
            context.globalAlpha = 1.0;
    
            let screen = context.getImageData(0, 0, 8, 8);
            
			c.renderer.drawTile(0, 0, tile * 16 + VRAM_BASE, flags, false, screen, 8);
            
            context.putImageData(screen, 0, 0);
		}

		c.renderer.drawBuffer();
    }

    this.hide = function() {
        hideElement(div);
    }
}