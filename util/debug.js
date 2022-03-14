const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;


const opcodeLUT = [
	"nop",
	"ld ${bc}, ${u16}",
	"ld (${bc}), a",
	"inc ${bc}",
	"inc ${b}",
	"dec ${b}",
	"ld ${b}, ${u8}",
	"rcla",
	"ld (${u16}), sp",
	"add hl, bc",
	"ld a, (bc)",
	"dec bc",
	"inc c",
	"dec c",
	"ld c, ${u8}",
	"rrca",
	"stop",
	"ld de, ${u16}",
	"ld (de), a",
	"inc de",
	"inc d",
	"dec d",
	"ld d, ${u8}",
	"rla",
	"jr ${s8}",
	"add hl, de",
	"ld a, (de)",
	"dec de",
	"inc e",
	"dec e",
	"ld e, ${u8}",
	"rra",
	"jr nz, ${s8}",
	"ld hl, ${u16}",
	"ld (hl+), a",
	"inc hl",
	"inc h",
	"dec h",
	"ld h, ${u8}",
	"daa",
	"jr z, ${s8}",
	"add hl, hl",
	"ld a, (hl)",
	"dec hl",
	"inc l",
	"dec l",
	"ld l, ${u8}",
	"cpl",
	"jr nc, ${s8}",
	"ld sp, ${u16}",
	"ld (hl-), a",
	"inc sp",
	"inc (hl)",
	"dec (hl)",
	"ld (hl), ${u8}",
	"scf",
	"jr c, ${s8}",
	"add hl, sp",
	"ld a, (hl-)",
	"dec sp",
	"inc a",
	"dec a",
	"ld a, ${u8}",
	"ccf",

	"ld b, b",
	"ld b, c",
	"ld b, d",
	"ld b, e",
	"ld b, h",
	"ld b, l",
	"ld b, (hl)",
	"ld b, a",

	"ld c, b",
	"ld c, c",
	"ld c, d",
	"ld c, e",
	"ld c, h",
	"ld c, l",
	"ld c, (hl)",
	"ld c, a",

	"ld d, b",
	"ld d, c",
	"ld d, d",
	"ld d, e",
	"ld d, h",
	"ld d, l",
	"ld d, (hl)",
	"ld d, a",

	"ld e, b",
	"ld e, c",
	"ld e, d",
	"ld e, e",
	"ld e, h",
	"ld e, l",
	"ld e, (hl)",
	"ld e, a",

	"ld h, b",
	"ld h, c",
	"ld h, d",
	"ld h, e",
	"ld h, h",
	"ld h, l",
	"ld h, (hl)",
	"ld h, a",

	"ld l, b",
	"ld l, c",
	"ld l, d",
	"ld l, e",
	"ld l, h",
	"ld l, l",
	"ld l, (hl)",
	"ld l, a",

	"ld (hl), b",
	"ld (hl), c",
	"ld (hl), d",
	"ld (hl), e",
	"ld (hl), h",
	"ld (hl), l",
	"halt",
	"ld (hl), a",

	"ld a, b",
	"ld a, c",
	"ld a, d",
	"ld a, e",
	"ld a, h",
	"ld a, l",
	"ld a, (hl)",
	"ld a, a",

	"add a, b",
	"add a, c",
	"add a, d",
	"add a, e",
	"add a, h",
	"add a, l",
	"add a, (hl)",
	"add a, a",

	"adc a, b",
	"adc a, c",
	"adc a, d",
	"adc a, e",
	"adc a, h",
	"adc a, l",
	"adc a, (hl)",
	"adc a, a",

	"sub a, b",
	"sub a, c",
	"sub a, d",
	"sub a, e",
	"sub a, h",
	"sub a, l",
	"sub a, (hl)",
	"sub a, a",

	"sbc a, b",
	"sbc a, c",
	"sbc a, d",
	"sbc a, e",
	"sbc a, h",
	"sbc a, l",
	"sbc a, (hl)",
	"sbc a, a",

	"and a, b",
	"and a, c",
	"and a, d",
	"and a, e",
	"and a, h",
	"and a, l",
	"and a, (hl)",
	"and a, a",

	"xor a, b",
	"xor a, c",
	"xor a, d",
	"xor a, e",
	"xor a, h",
	"xor a, l",
	"xor a, (hl)",
	"xor a, a",

	"or a, b",
	"or a, c",
	"or a, d",
	"or a, e",
	"or a, h",
	"or a, l",
	"or a, (hl)",
	"or a, a",

	"cp a, b",
	"cp a, c",
	"cp a, d",
	"cp a, e",
	"cp a, h",
	"cp a, l",
	"cp a, (hl)",
	"cp a, a",

	"ret nz",
	"pop bc",
	"jp nz, ${u16}",
	"jp ${u16}",
	"call nz, ${u16}",
	"push bc",
	"add a, ${u8}",
	"rst 0x00",
	
	"ret z",
	"ret",
	"jp z, ${u16}",
	"0xCB - ${u8}", // @TODO
	"call z, ${u16}",
	"call ${u16}",
	"adc a, ${u8}",
	"rst 0x08",
	
	"ret nc",
	"pop de",
	"jp nc, ${u16}",
	"<b>Not defined</b>",
	"call nc, ${u16}",
	"push de",
	"sub a, ${u8}",
	"rst 0x10",
	
	"ret c",
	"reti",
	"jp c, ${u16}",
	"<b>Not defined</b>",
	"call c, ${u16}",
	"<b>Not defined</b>",
	"sbc a, ${u8}",
	"rst 0x18",
	
	"ldh ($FF00+${u8}), a",
	"pop hl",
	"ld ($FF00+c), a",
	"<b>Not defined</b>",
	"<b>Not defined</b>",
	"push hl",
	"and a, ${u8}",
	"rst 0x20",

	"add sp, {$i8}",
	"jp hl",
	"ld (${u16}), a",
	"<b>Not defined</b>",
	"<b>Not defined</b>",
	"<b>Not defined</b>",
	"xor a, ${u8}",
	"rst 0x28",
	
	"ld hl, sp+${i8}",
	"ld sp, hl",
	"ld a, (${u16})",
	"ei",
	"<b>Not defined</b>",
	"push af",
	"or a, ${u8}",
	"rst 0x30",

	"ldh a, ($FF00+${u8})",
	"pop af",
	"ld a, ($FF00+c)",
	"di",
	"<b>Not defined</b>",
	"<b>Not defined</b>",
	"cp a, ${u8}",
	"rst 0x38",
];


var Debug = new function() {
	const DisassemblyGotoInput = document.getElementById('DisassemblyGotoInput');
	const TileCanvas = document.getElementById("DebugTileCanvas");
	const DebugDiv = document.getElementById('DebugDiv');
	const SpriteDetailDiv = document.getElementById('SpriteDetailDiv');
	const DisassemblyDiv = document.getElementById('DisassemblyDiv');
	let curObj = 0;
	let curPC = 0;
	let prevAddr = 0;

	this.spr_canvas = SpriteDetailDiv.getElementsByTagName("canvas")[0];
	this.spr_context = this.spr_canvas.getContext("2d");
	this.spr_data = this.spr_context.getImageData(0, 0, 8, 8);

	this.spr_blit = function() {
		this.spr_context.putImageData(this.spr_data, 0, 0);
	}


	this.enabled = false;

	this.hideOpen = function() {
		SpriteDetailDiv.style.display = 'none';
		DisassemblyDiv.style.display = 'none';
		c.renderer.clearBuffer();
	}


	this.start = function() {
		DebugDiv.style.display = "block";
		this.hideOpen();
		pauseEmulation();
		curObj = 0;
		this.enabled = true;

		DisassemblyGotoInput.value = "$";

		DisassemblyGotoInput.oninput = function(e) {
			if(!e.target.value.startsWith("$"))
				e.target.value = "$" + e.target.value;
			
			e.target.value = e.target.value.replace(/(?![A-Fa-f0-9])\w+/g,'');
		}


		this.spr_context.fillStyle = "#FFFFFF";
        this.spr_context.fillRect(0, 0, 160, 144);
        this.spr_context.globalAlpha = 1.0;
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

		this.spr_data.data.fill(0);
		c.renderer.drawTile(0, 0, VRAM_BASE + t * 16, f, c, false, true);
		
		this.spr_blit();

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
		this.enabled = false;
		DebugDiv.style.display = 'none';
		resumeEmulation();
	}


	this.hex = function(num, usePrefix) {
		let s = hex(num).substring(2);
		if(usePrefix)
			s = "$" + s;
		return s;
	}
	

	const useBrackets = true;

	this.getOpString = function(op) {
		let s = opcodeLUT[op];

		if(useBrackets)
			s = s.replace("(", "[").replace(")", "]");

		let special = s.indexOf("${");
		if(special != -1) {
			let id = s.substring(special+2, s.indexOf("}"));
			let append = "";
			switch(id)
			{
				case "u8":
					append = this.hex(c.read8(curPC));
					this.increasePC(1);
					break;
				case "s8":
					const addr = c.read8(curPC);
					append = this.hex(addr > 127 ? curPC - addr: curPC + addr);
					this.increasePC(1);
					break;
				case "u16":
					append = this.hex(c.read16(curPC));
					this.increasePC(2);
					break;
				default:
					append = id;
					this.increasePC(1);
			}

			s = s.replace("${"+id+"}", append);
		}

		return s;
	}


	this.increasePC = function(dx) {
			curPC += dx;
	}


	this.parseOp = function(pc) {
		let op = c.read8(pc);
		this.increasePC(1);

		if(opcodeLUT[op])
			return hex(op) + " : " + this.getOpString(op);
		else
			return hex(op);
	}

	this.breakpoints = [];

	this.newBreakpoint = function(addr)
	{
		this.breakpoints[addr] = true;
	}

	this.removeBreakpoint = function(addr)
	{
		this.breakpoints[addr] = false;
	}

	this.isBreakpoint = function(pc) {
		if(this.breakpoints.length == 0)
			return false;

		return this.breakpoints[pc] == true;
	}

	this.stepUntilBreak = function() {
		while(!this.isBreakpoint(c.pc.v)) {
			c.execute();
		}
		this.showDisassembly(c.pc.v);
	}

	/**
	 * 
	 * @param {Number} pc PC base to inspect
	 */
	this.showDisassembly = function(pc) {
		const a = DisassemblyDiv.getElementsByTagName("a")[0];
		this.hideOpen();
		DisassemblyDiv.style.display = 'block';
		curPC = pc;
		let curScroll = curPC - prevAddr;

		if(Math.abs(curScroll) < 20) {
			curPC -= curScroll;
		} else {
			prevAddr = pc;
		}

		if(c.pc.v < curPC)
			curPC = c.pc.v;

		a.innerHTML = ""
		for(let i = 0; i < 20; i++)
		{
			const isCurPC = c.pc.v == curPC;
			let str = "";
			if(isCurPC) {
				str = "<b width: 100%; style='background-color:lime; color: gray;'>";
			}

			if(this.isBreakpoint(curPC))
				str += "<b style='color:red;'>*</b>";

			str += hex(curPC) + " : "
				 + this.parseOp(curPC) + "<br>";

			if(isCurPC)
				str += "</b>";


			a.innerHTML += str;
		}


	}


	this.stepDis = function() {
		do {
			c.execute();
		} while(c.isHalted);
		this.showDisassembly(c.pc.v);
	}


	this.getAddr = function() {
		let s = DisassemblyGotoInput.value.substring(1);
		if(s.length == 0)
			return null;
		else
			return Number("0x" + s);
	}

	this.gotoDis = function() {
		let addr = this.getAddr();
		if(addr)
			this.showDisassembly(addr);
	}

	this.addBreak = function() {
		let addr = this.getAddr();
		if(!addr)
			return;

		this.newBreakpoint(addr);
		this.showDisassembly(c.pc.v);
	}

	this.rmBreak = function() {
		let addr = this.getAddr();
		if(!addr)
			return;
		
		this.removeBreakpoint(addr);
		this.showDisassembly(c.pc.v);
	}


}