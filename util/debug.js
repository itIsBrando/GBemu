const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;

var Debug = new function() {
	const TileCanvas = document.getElementById("DebugTileCanvas");
	const DebugDiv = document.getElementById('DebugDiv');

	this.start = function() {
		DebugDiv.style.display = "block";
		pauseEmulation();
		c.renderer.clearBuffer();
	}

	this.showTiles = function() {
		pauseEmulation();
		c.renderer.clearBuffer();

		let t = 0;
		// all of these are incorrectly drawn with OBJ palette rather than BG palette
		for(let y = 0; y < 16; y++) {
			for(let x = 0; x < 16; x++) {
				c.renderer.drawTile(x << 3, y << 3, VRAM_BASE + (t++) * 16, 0, c, true);
			}
		}
		c.renderer.drawBuffer();
		console.log("Tiles drawn");
	}

	this.showSprites = function() {
		pauseEmulation();
		c.renderer.clearBuffer();

		let s = 0;
		for(let y = 0; y < 4; y++)
		{
			for(let x = 0; x < 10; x++)
			{
				const spriteBase = OAM_BASE + ((s++) << 2);
				const tile  = c.read8(spriteBase + 2);
				const flags = c.read8(spriteBase + 3);
	
				c.renderer.drawTile(x << 3, y << 3, tile * 16 + VRAM_BASE, flags, c, false);
			}
		}

		c.renderer.drawBuffer();
		console.log("OAM drawn");
	}
	
	this.showMap = function() {
		let mapBase = c.ppu.mapBase;
		c.renderer.clearBuffer();

		for(let y = 0; y < 16; y++)
		{
			for(let x = 0; x < 20; x++)
			{
				const t = c.read8(mapBase++);
				c.renderer.drawTile(x << 3, y << 3, t * 16 + VRAM_BASE, 0, c, false);
			}
			mapBase += 12;
		}

		c.renderer.drawBuffer();
		console.log("Map drawn");
	}

	this.quit = function() {
		resumeEmulation();
		DebugDiv.style.display = 'none';
	}
}