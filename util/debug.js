const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;

var Debug = new function() {
	const TileCanvas = document.getElementById("DebugTileCanvas");
	const DebugDiv = document.getElementById('DebugDiv');
	const SpriteDetailDiv = document.getElementById('SpriteDetailDiv');
	let curObj = 0;

	this.hideOpen = function() {
		SpriteDetailDiv.style.display = 'none';
		c.renderer.clearBuffer();
	}

	this.start = function() {
		DebugDiv.style.display = "block";
		this.hideOpen();
		pauseEmulation();
		curObj = 0;
	}

	this.showTiles = function() {
		pauseEmulation();
		this.hideOpen();

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
		this.hideOpen();
		SpriteDetailDiv.style.display = "inline-block";
		let s = 0;
		
		this.showObj(0);

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
	}
	
	this.showMap = function() {
		let mapBase = c.ppu.mapBase;
		this.hideOpen();

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
	}

	/**
	 * @todo ADD TILE PREVIEW IMAGE
	 * @param {Number} num 
	 */
	this.showObj = function(num) {
		const base = OAM_BASE + (num << 2);
		const y = c.read8(base);
		const x = c.read8(base + 1);
		const t = c.read8(base + 2);
		const f = c.read8(base + 3);

		const a = SpriteDetailDiv.getElementsByTagName("p")[0];
		const b = SpriteDetailDiv.getElementsByTagName("b")[0];
		a.innerHTML = "\
		Byte 0 (Y): ${0}<br>\
		Byte 1 (X): ${1}<br>\
		Byte 2 (Tile): ${2}<br>\
		Byte 3 (Flag): ${3}".format(y, x, t, f);

		b.innerHTML = "Sprite " + num;
	}

	this.nextObj = function() {
		if(curObj++ == 39)
			curObj = 0;
		
		this.showObj(curObj);
	}

	this.prevObj = function() {
		if(curObj-- == 0)
			curObj = 39;

		this.showObj(curObj);
	}

	this.quit = function() {
		resumeEmulation();
		DebugDiv.style.display = 'none';
	}
}