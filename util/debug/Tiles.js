

var Tiles = new function() {
    const div = document.getElementById('MapDiv');
    const MapCanvas = document.getElementById('MapCanvas');

    /**
     * NOTE SOME TILES ARE CUT OUT AND WRITING OVERFLOWS OUT OF VRAM!! @todo
     */
    this.draw = function() {
		const context = MapCanvas.getContext('2d');
        context.fillStyle = "#e0e0e0";
        context.fillRect(0, 0, 256, 256);
        let screen = context.getImageData(0, 0, 256, 256);

		let t = 0, vbk = false;
		// all of these are incorrectly drawn with OBJ palette rather than BG palette
		for(let y = 0; y < 32; y++) {
			for(let x = 0; x < 32; x++) {
				c.renderer.drawTile(x << 3, y << 3, VRAM_BASE + (t++) * 16, 0, true, screen, 256, vbk);
				if(t >= 768) {
					t = 0;
					vbk = true;
				}
			}
		}
		
		context.putImageData(screen, 0, 0);
	}

    this.show = function() {
        showElement(div, 'grid');

		div.className = "debug-tile-div";
		MapCanvas.name = "tile";
		MapCanvas.click();

		this.draw()
    }

    this.hide = function() {
        hideElement(div);
    }
}