const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;


const opcodeLUT = [
	"nop",
	"ld bc, ${u16}",
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
	
	"ldh a, ($FF00+${u8})",
    "pop af",
    "ld a, ($FF00+c)",
	"di",
	"<b>Not defined</b>",
	"push af",
	"or a, ${u8}",
	"rst 0x30",

    "ld hl, sp+${u8}", // this should be 'i8' but has not been implemented yet @TODO
    "ld sp, hl",
    "ld a, (${u16})",
    "ei",
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
    const MemDiv = document.getElementById('MemoryDiv');
    const MapDiv = document.getElementById('MapDiv');
	const DisassemblyRegisters = document.getElementById('DisassemblyRegisters');
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
		hideElement(SpriteDetailDiv);
		hideElement(DisassemblyDiv);
        hideElement(MemDiv);
        hideElement(MapDiv);
		c.renderer.clearBuffer();
	}


	this.start = function() {
		DebugDiv.style.display = "grid";
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
		const can = MapDiv.getElementsByTagName('canvas')[0];
		this.hideOpen();
		showElement(MapDiv);

        const context = can.getContext('2d');
        context.fillStyle = "#e0e0e0";
        context.fillRect(0, 0, 256, 256);
		context.globalAlpha = 1.0
        let screen = context.getImageData(0, 0, 256, 256);

		let t = 0, vbk = false;
		// all of these are incorrectly drawn with OBJ palette rather than BG palette
		for(let y = 0; y < 32; y++) {
			for(let x = 0; x < 32; x++) {
				c.renderer.drawTile(x << 3, y << 3, VRAM_BASE + (t++) * 16, 0, c, false, screen, 256, vbk);
				if(++t >= 768) {
					t = 0;
					vbk = true;
				}
			}
		}
		
		context.putImageData(screen, 0, 0);
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
        let a = MapDiv.getElementsByTagName('p')[0];
        const can = MapDiv.getElementsByTagName('canvas')[0];
		this.hideOpen();
		showElement(MapDiv);

        const context = can.getContext('2d');
        context.fillStyle = "#e0e0e0";
        context.fillRect(0, 0, 256, 256);
		context.globalAlpha = 1.0
        let screen = context.getImageData(0, 0, 256, 256);
		const TILE_BASE = c.ppu.tileBase;

		for(let y = 0; y < 32; y++)
		{
			for(let x = 0; x < 32; x++)
			{
				let tileNumber = c.read8(mapBase++);
				// adjust tile number for stinky signed tiles
				if(TILE_BASE == 0x9000 && tileNumber > 127)
                	tileNumber -= 256;

				c.renderer.drawTile(x << 3, y << 3, tileNumber * 16 + TILE_BASE, 0, c, false, screen, 256);
			}
		}
		 
		context.putImageData(screen, 0, 0);

        const labels = ["Map address", "Tile address"];
        const values = [hex(c.ppu.mapBase, 4), hex(c.ppu.tileBase, 4)];
        a.innerHTML = "";
        
        
        for(let i = 0; i < labels.length; i++) {
            a.innerHTML += labels[i] + " : " + values[i] + "<br>";
        }
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
		c.renderer.drawTile(0, 0, VRAM_BASE + t * 16, f, c, true, this.spr_data, 8);
		
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
		hideElement(DebugDiv);
        this.hideBreak();
		resumeEmulation();
	}

	/**
	 * Converts a number to a formatted hex string
	 * @param {Number} num Number to convert
	 * @param {Boolean} usePrefix Use a '$' or not
	 * @param {Number} digits Min number of digits to display
	 * @returns {Number}
	 */
	this.hex = function(num, usePrefix = true, digits = 2) {
		return hex(num, digits, usePrefix ? "$" : "");
	}
	

	const useBrackets = true; // add option to change
    
    this.getInsLength = function(op) {
        const s = opcodeLUT[op];
        const special = s.indexOf("${");
        let id = s.substring(special+2, s.indexOf("}"));
        
        if(op == 0xCB)
            return 2;
        else if (special == -1)
            return 1;
        else if(id == "s8" || id == "u8" || id == "i8")
            return 2;
        else
            return 3;
    }

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
					append = hex(addr > 127 ? curPC - addr: curPC + addr, 4);
					this.increasePC(1);
					break;
				case "u16":
					append = this.hex(c.read16(curPC), true, 4);
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
			return hex(op, 2) + " : " + this.getOpString(op);
		else
			return hex(op, 2);
	}

	this.breakpoints = [];

	this.newBreakpoint = function(addr)
	{
		this.breakpoints[addr] = true;
	}

	this.removeBreakpoint = function(addr)
	{
		if(addr in this.breakpoints) {
			delete this.breakpoints[addr];
			return true;
		} else {
			return false;
		}
	}

	this.isBreakpoint = function(pc) {
		if(this.breakpoints.length == 0)
			return false;

		return this.breakpoints[pc] == true;
	}

	this.stepUntilBreak = function() {
		if(this.breakpoints.length == 0) {
			showMessage("Add a breakpoint first.", "No Breakpoints");
			return;
		}

		while(!this.isBreakpoint(c.pc.v)) {
			c.execute();
		}
		this.showDisassembly(c.pc.v);
	}

	this.showRegister = function() {
		const regs = [
			[c.af.v, 4],
			[c.bc.v, 4],
			[c.de.v, 4],
			[c.hl.v, 4],
			[c.pc.v, 4],
			[c.sp.v, 4],
			[c.ppu.regs.stat, 2],
			[c.ppu.regs.lcdc, 2],
			[c.ppu.regs.scy, 2],
			[c.ppu.regs.scx, 2],
			[c.ppu.regs.scanline, 2],
			[c.ppu.regs.dma, 2],
			[c.ppu.regs.obj0, 2],
			[c.ppu.regs.obj1, 2],
			[c.ppu.regs.wy, 2],
			[c.ppu.regs.wx, 2],

		];
		const names = [
			"AF",
			"BC",
			"DE",
			"HL",
			'\n',
			"PC",
			"SP",
			'\n',
			"STAT",
			"LCDC",
			"SCY",
			"SCX",
			"LY",
			"DMA",
			"OBJ0",
			"OBJ1",
			"WY",
			"WX",
		];
		let str = "", j = 0;

		for(let i in names)
		{
			if(names[i] == '\n')
				str += '<tr><td><hr style="width:200%;" /></td></tr>';
			else
				str += `<tr><td>${names[i]}:</td> <td style='float:right;'>${this.hex(regs[j][0], true, regs[j++][1])}</td></tr>`;
		}

		DisassemblyRegisters.innerHTML = str;
	}
    
    this.showMemory = function() {
        const a = MemDiv.getElementsByTagName("p")[0];
        let s = "";
        
        this.hideOpen();
        showElement(MemDiv);
        
        for(let i = 0; i < 0xFFFF >> 3; i++)
        {
            s += this.dumpMemory(i << 3) + "<br>";
        }
        
        a.innerHTML = s;
    }

	/**
	 * 
	 * @param {Number} pc PC base to inspect
	 */
	this.showDisassembly = function(pc) {
		const a = DisassemblyDiv.getElementsByTagName("p")[0];
        
		this.hideOpen();
		showElement(DisassemblyDiv);
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
				str += "<b style='color:red;' title='breakpoint'>**</b>";

			str += hex(curPC, 4) + " : "
				 + this.parseOp(curPC) + "<br>";

			if(isCurPC)
				str += "</b>";


			a.innerHTML += str;

			this.showRegister();
		}


	}
    
    this.dumpMemory = function(pc) {
        let s = hex(pc, 4, "$") + " : ";
        
        for(let i = 0; i < 8; i++) {
            s += " " + hex(c.read8(pc + i), 2, "$");
        }
        
        return s;
    }


	this.stepDis = function() {
		do {
			c.execute();
		} while(c.isHalted);
		this.showDisassembly(c.pc.v);
	}
    
    // Skips subroutines
    this.stepDisSkipSub = function() {
        const exclude = [0xE9, 0xC3, 0x18, 0xC0, 0xD0, 0xC8, 0xC9, 0xD8, 0xD9];
        const condBranches = [0x20, 0x30, 0x28, 0x38, 0xC2, 0xD2, 0xCA, 0xDA];
        
        const op = c.read8(c.pc.v);
        let addr = c.pc.v + this.getInsLength(op);
        let cnt = 0; // max iterations
        
        // if we are a branch or return, then we do not want to go to next line
        if(exclude.includes(op) || (condBranches.includes(op) && c.read8(c.pc.v + 1) < 0x80)) {
            c.execute();
            console.log("excluded");
        } else { 
            do {
                c.execute();
                if(cnt++ > 20000)
                    break;
            } while(c.isHalted || c.pc.v != addr);
        }
        
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
        this.drawBreaks();
	}

	this.rmBreak = function() {
		let addr = this.getAddr();
		if(!addr) {
			showMessage("Could not find breakpoint at " + this.hex(addr, true), "Not a Valid Breakpoint");
			return;
		}
		if(!this.removeBreakpoint(addr))
			return;
		this.showDisassembly(c.pc.v);
        this.drawBreaks();

	}
    
    this.drawBreaks = function() {
        const breakList = document.getElementById("DisBreakpointList");
        breakList.innerHTML = "";
        
        for(let i in this.breakpoints)
            if(this.breakpoints[i] != false)
                breakList.innerHTML += hex(Number(i), 4) + "<br>";
    }
    
    this.showBreak = function() {
        const breakpointMenu = document.getElementById("DisassemblyBreakpoints");
        
        showElement(breakpointMenu);
        this.drawBreaks();
    }
    
    this.hideBreak = function() {
        hideElement(document.getElementById("DisassemblyBreakpoints"));
    }


}