const DrawType = {
    MAP: true,
    WINDOW: false,
}


var Map = new function() {
    const div = document.getElementById('MapDiv');
    const radioButtons = document.getElementsByName("displayMode");
    const MapInfo = document.getElementById('MapInfo');
    const MapCanvas = document.getElementById('MapCanvas');
    const MapCanvas2 = document.getElementById('MapCanvas2');
	const MapCursor = document.getElementById('MapCursor');

    this.init = function() {
		MapCursor.onclick = MapCursor.onmousemove = MapCursor.ontouchmove = function(e) {
			const rect = this.getBoundingClientRect();
			const x = Math.max(Math.floor(e.offsetX * 32 / rect.width), 0);
			const y = Math.max(Math.floor(e.offsetY * 32 / rect.height), 0);
			
			if(this.name == "map")
				Map.printTileInfo(radioButtons[0].checked ? c.ppu.mapBase : c.ppu.winBase, x, y);
			else
				Map.printTileInfo(null, x, y);
		};

		document.getElementById('mapZoomInput').addEventListener("change", function(e) {
			const v = e.target.value;
			MapCanvas.style.width = (v * 256) + 'px';
			MapCanvas2.style.width = (v * 256) + 'px';
			MapCursor.style.width = (v * 256) + 'px';
		});

        for(let i = 0; i < radioButtons.length; i++) {
            radioButtons[i].addEventListener("change", function() {
                Map.draw();
            });
        };

		this.drawGrid();
    }

	/**
	 * Draws a gray grid for each tile
	 */
	this.drawGrid = function() {
		const ctx = MapCanvas2.getContext('2d');
		ctx.clearRect(0, 0, 2048, 2048);
		ctx.strokeStyle = "#bbb";

		for(let i = 0; i < 32; i++) {
			for(let j = 0; j < 32; j++)
				ctx.rect(i * 4 * 8, j * 4 * 8, (i + 1) * 4 * 8, (j + 1) * 8 * 4);
		}

		ctx.stroke();
	}

	this.drawCursor = function(tx, ty) {
		const ctx = MapCursor.getContext("2d");
		tx <<= 4, ty <<= 4;

		ctx.clearRect(0, 0, 512, 512);
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.lineCap = 'square';
		ctx.strokeStyle = '#111';
		ctx.rect(tx, ty, 16, 16);
		ctx.stroke();
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
				const tileNum = c.mem.vram[mapBase++ - 0x8000];

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
		let s = ``;

		tx &= 31, ty &= 31;
		
		const offset = tx + ty * 32;
		const mapAddr = offset + mapBase;
		const tile = mapBase ? c.mem.vram[mapAddr - 0x8000] : offset;
		const addr = c.ppu.getBGTileAddress(tile);

		s += `Tile: \
		${Debug.hex(tile)}<br>\
		Map Address: ${Debug.hex(mapAddr, 4)}\
		<br>Tile Address: ${tile > 255 ? '1:': '0:'}${Debug.hex(addr, 4)}\
		<br>X: ${tx}<br>Y: ${ty}`;

		if(mapBase != null) {
			const attr = c.ppu.getTileAttributes(offset + mapBase);
			s += `<br>Palette: ${attr & 7}` +
			`<br>X-flip: ${(attr >> 5) & 1}` +
			`<br>Y-flip: ${(attr >> 6) & 1}` +
			`<br>Priority: ${(attr >> 7) & 1}`;
		}
        
		TileInfo.innerHTML = s + "</div>";
		this.setPreview(tile);

		this.drawCursor(tx, ty);
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
		MapCursor.name = "map";
		MapCursor.click();

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