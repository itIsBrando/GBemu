const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;


const opcodeLUT = [
	"nop",
	"ld bc, ${u16}",
	"ld (bc), a",
	"inc bc",
	"inc b",
	"dec b",
	"ld b, ${u8}",
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
	"ld a, (hl+)",
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
	null,
	"call nc, ${u16}",
	"push de",
	"sub a, ${u8}",
	"rst 0x10",
	
	"ret c",
	"reti",
	"jp c, ${u16}",
	null,
	"call c, ${u16}",
	null,
	"sbc a, ${u8}",
	"rst 0x18",
	
	"ldh ($FF00+${u8}), a",
	"pop hl",
	"ld ($FF00+c), a",
	null,
	null,
	"push hl",
	"and a, ${u8}",
	"rst 0x20",

	"add sp, {$i8}",
	"jp hl",
	"ld (${u16}), a",
	null,
	null,
	null,
	"xor a, ${u8}",
	"rst 0x28",
	
	"ldh a, ($FF00+${u8})",
    "pop af",
    "ld a, ($FF00+c)",
	"di",
	null,
	"push af",
	"or a, ${u8}",
	"rst 0x30",

    "ld hl, sp+${u8}", // this should be 'i8' but has not been implemented yet @TODO
    "ld sp, hl",
    "ld a, (${u16})",
    "ei",
    null,
    null,
    "cp a, ${u8}",
    "rst 0x38",
];


var Debug = new function() {
	const DisassemblyGotoInput = document.getElementById('DisassemblyGotoInput');
	const DebugDiv = document.getElementById('DebugDiv');
	const SpriteDetailDiv = document.getElementById('SpriteDetailDiv');
	const DisassemblyDiv = document.getElementById('DisassemblyDiv');
    const MemDiv = document.getElementById('MemoryDiv');
    const MapDiv = document.getElementById('MapDiv');
	const MapInfo = document.getElementById('MapInfo');
	const DisassemblyRegisters = document.getElementById('DisassemblyRegisters');
    const radioButtons = document.getElementsByName("displayMode");
    this.DebugLog = document.getElementById('DebugLog');
	let curObj = 0;
	let curPC = 0;
	let prevAddr = 0;
    this.timer = null;
    this.basePC = 0;

	this.enabled = false;
    this.initialized = false;

	this.hideOpen = function() {
		hideElement(SpriteDetailDiv);
		hideElement(DisassemblyDiv);
        hideElement(MemDiv);
        hideElement(MapDiv);
		c.renderer.clearBuffer();
	}

	this.clearLog = function() {
		this.DebugLog.innerHTML = "New Messages will appear here<br>";
	}
    
    this.useLog = function(v = null) {
        if(v == null)
            return this.DebugLog.style.display != "none";
        if(v == true)
            showElement(this.DebugLog);
        else {
            hideElement(this.DebugLog);
        }
    }


	this.start = function() {
		DebugDiv.style.display = "grid";
		this.hideOpen();
		pauseEmulation();
        Debug.stopRunTilBreak();
		curObj = 0;
		this.enabled = true;
        
        if(this.initialized)
            return;

		this.clearLog();
		
		DisassemblyGotoInput.value = "$";

		DisassemblyGotoInput.oninput = function(e) {
			if(!e.target.value.startsWith("$"))
				e.target.value = "$" + e.target.value;
			
			e.target.value = e.target.value.replace(/(?![A-Fa-f0-9])\w+/g,'');
		}
        
        const spriteDiv = document.getElementById("DebugSprites");
        
        for(let i = 0; i < 40; i++) {
            const canv = document.createElement("canvas");
            
            canv.width = 8;
            canv.height = 8;
			canv.className = "obj-canvas";
            canv.id = "sprite" + i;
            
            canv.addEventListener("click", function() {
                Debug.showObj(this.id.substring(6));
            });
            
            spriteDiv.appendChild(canv);
        }
        
        for(let i = 0; i < radioButtons.length; i++) {
            radioButtons[i].addEventListener("change", function() {
                Debug.showMap();
            });
        };
        
        this.initialized = true;
	}


	this.showTiles = function() {
		const can = document.getElementById('MapCanvas');
		this.hideOpen();
		showElement(MapDiv);
		hideElement(MapInfo);

		can.name = "tile";

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
				if(t >= 768) {
					t = 0;
					vbk = true;
				}
			}
		}
		
		context.putImageData(screen, 0, 0);
	}


	this.showSprites = function() {
		this.hideOpen();
		showElement(SpriteDetailDiv);
        
        c.renderer.renderSprites(c.ppu, c);

		this.showObj(0);

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
            
			c.renderer.drawTile(0, 0, tile * 16 + VRAM_BASE, flags, c, false, screen, 8);
            
            context.putImageData(screen, 0, 0);
		}

		c.renderer.drawBuffer();
	}
	
	
	this.showTilePreview = function(tile) {
		const canv = document.getElementById('TilePreview');
		const ctx = canv.getContext('2d');
		
		ctx.globalAlpha = 1.0;
		ctx.fillStyle = "#f0f0f0";
		ctx.fillRect(0, 0, 8, 8);

		const img = ctx.getImageData(0, 0, 8, 8);
		c.renderer.drawTile(0, 0, c.ppu.getBGTileAddress(tile), 0, c, false, img, 8);

		ctx.putImageData(img, 0, 0);
	}
	
	this.printMapTileInfo = function(mapBase, tx, ty) {
		const TileInfo = document.getElementById("TileInfo");
		let s = "<br>";

		tx &= 31, ty &= 31;

		const offset = tx + ty * 32 + mapBase;
		const tile = c.read8(offset);

		s += `Tile: ${hex(tile, 2, "$")}<br>Tile Address: ${hex(c.ppu.getBGTileAddress(tile), 4)}<br>X: ${tx}<br>Y: ${ty}`;
        
		TileInfo.innerHTML = s;
		this.showTilePreview(tile);
	}

	this.printTileInfo = function(tx, ty) {
		const TileInfo = document.getElementById("TileInfo");
		let s = "<br>";

		tx &= 31, ty &= 31;

		const tile = tx + ty * 32;

		s += `Tile: ${hex(tile, 2, "$")}<br>Tile Address: ${hex(c.ppu.getBGTileAddress(tile), 4)}<br>X: ${tx}<br>Y: ${ty}`;
        
		TileInfo.innerHTML = s;
		this.showTilePreview(tile);
	}


	this.showMap = function() {
        const isMap = radioButtons[0].checked;
		let mapBase = isMap ? c.ppu.mapBase : c.ppu.winBase;
        let a = MapDiv.getElementsByTagName('p')[0];
        const can = document.getElementById('MapCanvas');
		this.hideOpen();
		showElement(MapDiv);
		showElement(MapInfo);

		can.name = "map";

		can.addEventListener("click", function(e) {
			const rect = this.getBoundingClientRect();
			const x = Math.max(Math.floor(e.offsetX * 32 / rect.width), 0);
			const y = Math.max(Math.floor(e.offsetY * 32 / rect.height), 0);
			
			if(this.name == "map")
				Debug.printMapTileInfo(isMap ? c.ppu.mapBase : c.ppu.winBase, x, y);
			else
				Debug.printTileInfo(x, y);
		});

		can.click();

        const context = can.getContext('2d');
        context.fillStyle = "#e0e0e0";
        context.fillRect(0, 0, can.width, can.height);
		context.globalAlpha = 1.0;
        
        let screen = context.getImageData(0, 0, 256, 256);
		const TILE_BASE = c.ppu.tileBase;

		for(let y = 0; y < 32; y++)
		{
			for(let x = 0; x < 32; x++)
			{
				let tileNum = c.read8(mapBase++);

				c.renderer.drawTile(x << 3, y << 3, c.ppu.getBGTileAddress(tileNum), 0, c, false, screen, 256);
			}
		}
		 
		context.putImageData(screen, 0, 0);
        
        // draw a rectangle showing viewport
        const x = isMap ? c.ppu.regs.scx : 0;
        const y = isMap ? c.ppu.regs.scy : 0;
        const yOverflow = y + 144, xOverflow = x + 160;
        
        context.beginPath();
        context.fillStyle = "#111111";
        context.rect(x, y, 160, 144);
        
        if(yOverflow > 255)
            context.rect(x, 0, 160, yOverflow & 255);
        if(xOverflow > 255)
            context.rect(0, y, xOverflow & 255, 144);
        context.stroke();

		// show Map/tile/window addresses
        const labels = ["Map address", "    Window Address", "Tile address"];
        const values = [hex(c.ppu.mapBase, 4), `${hex(c.ppu.winBase, 4)}<br>`, hex(c.ppu.tileBase, 4)];
        a.innerHTML = "";
        
        for(let i = 0; i < labels.length; i++) {
            a.innerHTML += `${labels[i]} : ${values[i]}`;
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
		a.innerHTML = `\
		Byte 0 (Y): ${y}<br>\
		Byte 1 (X): ${x}<br>\
		Byte 2 (Tile): ${t}<br>\
		Byte 3 (Flag): ${hex(f, 2, "$")}`;

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

	const useBrackets = true; // add option to change
    
    this.getInsLength = function(op) {
        const s = opcodeLUT[op];

		if(s == null)
			return 1;

        const special = s.indexOf("${");
        let id = s.substring(special+2, s.indexOf("}"));
        
        if (special == -1)
            return 1;
        else if(id == "s8" || id == "u8" || id == "i8" || op == 0xCB)
            return 2;
        else
            return 3;
    }

	this.getOpString = function(op) {
        let s = opcodeLUT[op] ? opcodeLUT[op] : '<b style="color:gray;">Illegal Opcode</b>';
        
        if(op == 0xCB) {
            op = c.read8(curPC);
            this.increasePC(1);
            const x = (op & 0b11000000) >> 6;
            const y = ((op & 0b00111000) >> 3) & 0x07;
            const z = (op & 0b00000111);
            const r = ["b","c", "d", "e", "h", "l", "(hl)", "a"];
            
            switch(x) {
                case 1:
                    s = `bit ${y}, ${r[z]}`;
                    break;
                case 2:
                    s = `res ${y}, ${r[z]}`;
                    break;
                case 3:
                    s = `set ${y}, ${r[z]}`;
                    break;
                case 0:
                    const names = ["rlc", "rrc", "rl", "rr", "sla", "sra", "swap", "srl"]
                    s = ` ${names[y]} ${r[z]}`;
                    break;
            }
            
            return s; // CB prefixes never have immediate addressing modes
        }

		if(useBrackets)
			s = s.replace("(", "[").replace(")", "]");

		let special = s.indexOf("${");
        
		if(special != -1) {
			let id = s.substring(special+2, s.indexOf("}"));
			let append = "";
			switch(id)
			{
				case "u8":
					append = hex(c.read8(curPC), 2);
					this.increasePC(1);
					break;
				case "s8":
					const addr = c.read8(curPC);
					this.increasePC(1);
					append = hex(addr > 127 ? curPC - addr: curPC + addr, 4);
					break;
				case "u16":
					append = hex(c.read16(curPC), 4);
					this.increasePC(2);
					break;
				default:
					append = id;
					this.increasePC(1);
                    c.LOG(`Unknown string id: ${id}`);
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

		return hex(op, 2) + " : " + this.getOpString(op);

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
    
    
    this.stopRunTilBreak = function() {
        setLEDStatus(false);

        if(Debug.timer)
            clearInterval(Debug.timer);
			
        Debug.timer = null;
		Debug.showDisassembly(c.pc.v);
    }
    
    this._runTilBreak = function() {
        for(let i = 0; i < 0x400000 / 1000; i++) {
            c.execute();
            
            if(Debug.isBreakpoint(c.pc.v)) {
                Debug.stopRunTilBreak();
                return;
            }
        }
    }
    
	this.stepUntilBreak = function() {
		if(this.breakpoints.length == 0) {
			showMessage("Add a breakpoint first.", "No Breakpoints");
			return;
		}
        
        if(this.timer) {
            Debug.stopRunTilBreak();
        }
        else {
            this.timer = setInterval(Debug._runTilBreak, 1);
            setLEDStatus(true);
        }
        
        Debug.showDisassembly(c.pc.v);
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
				str += `<tr><td>${names[i]}:</td> <td style='float:right;'>${hex(regs[j][0], regs[j++][1])}</td></tr>`;
		}

		DisassemblyRegisters.innerHTML = str;
	}
    
    this.showMemory = function() {
        const a = MemDiv.getElementsByTagName("pre")[0];
        let s = "";
		const mem_types = [
			"ROM0 ", // 0x0000
			"ROM0 ", // 0x1000
			"ROM0 ", // 0x2000
			"ROM0 ", // 0x3000
			"ROMX ", // 0x4000
			"ROMX ", // 0x5000
			"ROMX ", // 0x6000
			"ROMX ", // 0x7000
			"VRAM ", // 0x8000
			"VRAM ", // 0x9000
			"CRAM0", // 0xA000
			"CRAM0", // 0xB000
			"WRAM0", // 0xC000
			"WRAMX", // 0xD000
			"MIRR ", // 0xE000
			"IORAM", // 0xF000
        ];
        
        this.hideOpen();
		showElement(MemDiv);

		if(!c.loadedROM) {
			a.innerHTML = "Load a ROM before viewing memory";
			return;
		}
        
        for(let i = 0; i < 0xFFFF >> 3; i++)
        {
            s += `<b style="color:white";>${mem_types[i >> 9]}</b>:${this.dumpMemory(i << 3)}<br>`;
        }
        
        a.innerHTML = s;
    }

	/**
	 * The presence of this function allows for the PC to step through the entire
	 * 	visible disassembler window. Previously, the disassembler would scroll when
	 *  the PC exceeded `NUM_INSTR` bytes, but now it will scroll once we have
	 *  exceeded `NUM_INSTR` instructions
	 * - This function will calculate the number of instructions that occur
	 *    between the addresses. If this value exceeds `range`, then it will
	 *    `true`, otherwise false 
	 */
	this.isInsOutOfRange = function(addr1, addr2, range) {
		let low = addr1 > addr2 ? addr2 : addr1;
		const high = addr1 > addr2 ? addr1 : addr2;
		let ins = 0;

		while(low < high) {
			low += this.getInsLength(c.read8(low));
			if(++ins >= range)
				return true;

		}
		
		return false;
	}

	/**
	 * 
	 * @param {Number} pc PC base to inspect
	 */
	this.showDisassembly = function(pc) {
		/*
			prevAddr -> address of the last instruction ran. Can be >, <, or = to c.pc.v
			curScroll-> difference betweeen last instruction and current instruction
			curPC -> before the loop, this holds the address of the FIRST instruction written
				- this will always be >= c.pc.v
			c.pc.v -> actual instruction being executed.
		*/
		const a = DisassemblyDiv.getElementsByTagName("p")[0];
		const NUM_INSTR = 18;
        
		this.hideOpen();
		showElement(DisassemblyDiv);
		curPC = pc;
		let curScroll = curPC - prevAddr;

		if(this.isInsOutOfRange(curPC - curScroll, pc, NUM_INSTR)) {
			prevAddr = pc;
		} else {
			curPC -= curScroll;
		}

		//console.log(`prevAddr:${hex(prevAddr,4)}	curScroll:${curScroll}	curPC:${hex(curPC,4)}	PC:${hex(pc,4)}`)

		if(pc < curPC)
			curPC = pc;
            
        this.basePC = curPC;

		a.innerHTML = "";

		for(let i = 0; i < NUM_INSTR; i++)
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
        let s = `${hex(pc, 4, "$")} : `;
        
        for(let i = 0; i < 8; i++) {
			const byte = c.read8(pc + i);
            s += "  " + hex(byte, 2, '');
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
        const m = PromptMenu.new("Enter Address", "0000-FFFF", /(?![A-Fa-f0-9])\w+/g, 4, function(a) {
            a = Number("0x" + a);
            if(a != null)
                Debug.showDisassembly(a);
        });
        
        PromptMenu.show(m);
	}
    
    this.searchByte = function() {
        const m = PromptMenu.new("Search for Data", "00-FFFF", /(?![A-Fa-f0-9])\w+/g, 4, function(a) {
            a = Number("0x" + a);
            if(a == null)
                return;
            
            let p = Debug.basePC; // we will start searching from the currently shown address in the disassembler
            const low = a & 0xFF, high = (a >> 8) & 0xFF;
            
            while(++p < 0xFFFF) {
                if(c.read8(p) == low) {
                    Debug.showDisassembly(p);
                    return;
                }
            }
            
            showMessage(`Byte $${hex(a, 2)} not found.`, `Started searching at ${hex(Debug.basePC, 4)}`);
        });
        
        PromptMenu.show(m);
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
			showMessage("Could not find breakpoint at " + hex(addr, 4), "Not a Valid Breakpoint");
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

const MENU_EX = {
    "rejects": "regex", // regular expression with all characters that will be rejected by the input
    "title": "string", // name
    "onsubmit": "func", // accepts a function with one parameter (contains input value)
    "oncancel": "func", // accepts an optional function
};


var PromptMenu = new function() {
    const textInput = document.getElementById("PromptText");
    const menu = document.getElementById("PromptMenu");
    const title = document.getElementById("PromptTitle");
    
    this._onsubmit = null;
    this._oncancel = null;
    
    this.new = function(t, p, rejects = '', maxlen = 999999, onsubmit = null, oncancel = null) {
        return {
            "rejects": rejects,
            "title": t,
            "placeholder": p,
            "maxlength": maxlen,
            "onsubmit": onsubmit,
            "oncancel": oncancel,
        };
    }
    
    this.show = function(m) {
        textInput.oninput = function(e) {
            e.target.value = e.target.value.replace(m["rejects"],'').toUpperCase().slice(0, m["maxlength"]);
        }
        
        textInput.value = "";
        title.innerHTML = m["title"];
        
        this._onsubmit = m["onsubmit"];
        this._oncancel = m["oncancel"];
        // @TODO add placeholder attribute
        
        showElement(menu);
    }
    
    this.submit = function() {
        if(this._onsubmit)
            this._onsubmit(textInput.value);
        
        this.hide();
    }
    
    this.hide = function() {
        hideElement(menu);
    }
}