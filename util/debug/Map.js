const DrawType = {
    MAP: true,
    WINDOW: false,
}


var Map = new function() {
    const div = document.getElementById('MapDiv');
    const radioButtons = document.getElementsByName("displayMode");
    const MapInfo = document.getElementById('MapInfo');
    const MapCanvas = document.getElementById('MapCanvas');

    this.init = function() {
		MapCanvas.addEventListener("click", function(e) {
			const rect = this.getBoundingClientRect();
			const x = Math.max(Math.floor(e.offsetX * 32 / rect.width), 0);
			const y = Math.max(Math.floor(e.offsetY * 32 / rect.height), 0);
			
			if(this.name == "map")
				Map.printTileInfo(radioButtons[0].checked ? c.ppu.mapBase : c.ppu.winBase, x, y);
			else
				Map.printTileInfo(null, x, y);
		});

        for(let i = 0; i < radioButtons.length; i++) {
            radioButtons[i].addEventListener("change", function() {
                Map.draw();
            });
        };
    }

    /**
     * Draws the map or window onto the canvas
     */
    this.draw = function() {
		const isMap = this.getDrawType() == DrawType.MAP;
		let mapBase = isMap ? c.ppu.mapBase : c.ppu.winBase;
        
        const context = MapCanvas.getContext('2d');
        context.fillStyle = "#e0e0e0";
        context.fillRect(0, 0, MapCanvas.width, MapCanvas.height);
        
		let screen = context.getImageData(0, 0, 256, 256);

		for(let y = 0; y < 32; y++)
		{
			for(let x = 0; x < 32; x++)
			{
				const tileNum = c.read8(mapBase++);

				c.renderer.drawTile(x << 3, y << 3, c.ppu.getBGTileAddress(tileNum), 0, true, screen, 256);
			}
		}
		 
		context.putImageData(screen, 0, 0);
		
		// draw a rectangle showing viewport
		const x = isMap ? c.ppu.regs.scx: 0;
		const y = isMap ? c.ppu.regs.scy + 0.5 : 0;
		const yOverflow = y + 144, xOverflow = x + 160;

        context.beginPath();
		context.lineCap = 'square';
        context.strokeStyle = "#b0b0b0";
        context.rect(x, y, 160.5, 144);

		if(yOverflow > 255)
			context.rect(x, 0, 160, yOverflow & 255);
		if(xOverflow > 255)
			context.rect(0, y, xOverflow & 255, 144);
		context.stroke();
	}


    this.getDrawType = function() {
		return radioButtons[0].checked ? DrawType.MAP : DrawType.WINDOW;
	}

    this.printTileInfo = function(mapBase = null, tx, ty) {
		const TileInfo = document.getElementById("TileInfo");
		let s = `<div class="div-separator">`;

		tx &= 31, ty &= 31;

		const offset = tx + ty * 32;
		const tile = mapBase ? c.read8(offset + mapBase) : offset;
		const addr = c.ppu.getBGTileAddress(tile);

		s += `Tile: ${Debug.hex(tile)}<br>Tile Address: ${tile > 255 ? '1:': '0:'}${Debug.hex(addr, 4)}<br>X: ${tx}<br>Y: ${ty}`;

		if(mapBase != null)
			s += `<br>Flag: ${Debug.hex(c.ppu.getTileAttributes(offset + mapBase))}`;
        
		TileInfo.innerHTML = s + "</div>";
		this.setPreview(tile);

		const ctx = MapCanvas.getContext("2d");
		tx <<= 3, ty <<= 3;
		ty += 0.5;

		if(mapBase != null)
			this.draw();
		else
			Tiles.draw();

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.lineCap = 'square';
		ctx.strokeStyle = '#111';
		ctx.rect(tx, ty, 7.5, 7);
		ctx.stroke();
	}

    /**
     * Draws the `tile` number onto the tile preview canvas
     */
    this.setPreview = function(tile) {
		const canv = document.getElementById('TilePreview');
		const ctx = canv.getContext('2d');
		
		ctx.globalAlpha = 1.0;
		ctx.fillStyle = "#f0f0f0";
		ctx.fillRect(0, 0, 8, 8);

		const img = ctx.getImageData(0, 0, 8, 8);
		c.renderer.drawTile(0, 0, c.ppu.getBGTileAddress(tile), 0, true, img, 8);

		ctx.putImageData(img, 0, 0);
	}


    this.show = function() {
        let a = div.getElementsByTagName('pre')[0];
		showElement(div, 'grid');
		showElement(MapInfo);

		div.className = "debug-map-div";
		MapCanvas.name = "map";

		MapCanvas.click();

		this.draw();

		let ofx, ofy;
		if(this.getDrawType() == DrawType.MAP)
			ofx = c.ppu.regs.scx, ofy = c.ppu.regs.scy;
		else
			ofx = c.ppu.regs.wx, ofy = c.ppu.regs.wy;

		// show Map/tile/window addresses
        const labels = ["Map address   ", "Window Address", "Tile address  ", "Offset"];
        const values = [
			Debug.hex(c.ppu.mapBase, 4),
			Debug.hex(c.ppu.winBase, 4),
			Debug.hex(c.ppu.tileBase, 4),
			`${ofx}, ${ofy}`
		];
        a.innerHTML = "";
        
        for(let i = 0; i < labels.length; i++) {
            a.innerHTML += `${labels[i]} : ${values[i]}<br>`;
        }
    }

    this.hide = function() {
        hideElement(div);
		hideElement(MapInfo);

    }
}