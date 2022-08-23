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
	"jp nz, ${u16c}",
	"jp ${u16c}",
	"call nz, ${u16c}",
	"push bc",
	"add a, ${u8}",
	"rst 0x00",
	
	"ret z",
	"ret",
	"jp z, ${u16c}",
	"CB",	// implemented elsewhere
	"call z, ${u16c}",
	"call ${u16c}",
	"adc a, ${u8}",
	"rst 0x08",
	
	"ret nc",
	"pop de",
	"jp nc, ${u16c}",
	null,
	"call nc, ${u16c}",
	"push de",
	"sub a, ${u8}",
	"rst 0x10",
	
	"ret c",
	"reti",
	"jp c, ${u16c}",
	null,
	"call c, ${u16c}",
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

	"add sp, ${i8}",
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

    "ld hl, sp${i8}", // this should be 'i8' but has not been implemented yet @TODO
    "ld sp, hl",
    "ld a, (${u16})",
    "ei",
    null,
    null,
    "cp a, ${u8}",
    "rst 0x38",
];

let REGISTER_ADDR = {
	0x0040: "VBlank",
	0x0048: "LCD STAT",
	0x0050: "Timer",
	0x0058: "Serial",
	0x0060: "Joypad",
	0x0000: "RAMG",
	0x2000: "ROMB0",
	0x3000: "ROMB1",
	0x8000: "VRAM",
	0x9000: "SCRN0",
	0x9800: "SCRN1",
	0xA000: "SRAM",
	0xC000: "RAM",
	0xFE00: "OAM",
	0xFF00: "JOYP",
	0xFF01: "SB",
	0xFF02: "SC",
	0xFF04: "DIV",
	0xFF05: "TIMA",
	0xFF06: "TMA",
	0xFF07: "TAC",
	0xFF0F: "IF",
	0xFF40: "LCDC",
	0xFF41: "STAT",
	0xFF42: "SCY",
	0xFF43: "SCX",
	0xFF44: "LY",
	0xFF45: "LYC",
	0xFF46: "DMA",
	0xFF47: "BGP",
	0xFF48: "OBP0",
	0xFF49: "OBP1",
	0xFF4A: "WY",
	0xFF4B: "WX",
	0xFF4D: "SPD",
	0xFF4F: "VBK",
	0xFF51: "HDMA1",
	0xFF52: "HDMA2",
	0xFF53: "HDMA3",
	0xFF54: "HDMA4",
	0xFF55: "HDMA5",
	0xFF56: "RP",
	0xFF68: "BGPI",
	0xFF69: "BGPD",
	0xFF6A: "OBPI",
	0xFF6B: "OBPD",
	0xFF70: "SVBK",
	0xFFFF: "IE",
	
};

const DebugDiv = document.getElementById('DebugDiv');
const DisassemblyDiv = document.getElementById('DisassemblyDiv');
const DisText = document.getElementById('DisasmContent');
const DisScrollDiv = DisassemblyDiv.getElementsByTagName('div')[0];
const PalDiv = document.getElementById('PalDiv');
const DisassemblyRegisters = document.getElementById('DisassemblyRegisters');

var Debug = new function() {
	let curPC = 0;
	let prevAddr = 0;
	const NUM_INSTR_MIN = 36;
	let instr_shown = NUM_INSTR_MIN;
    this.timer = null;
    this.basePC = 0;

	this.enabled = false;
    this.initialized = false;

	this.hideOpen = function() {
		hideElement(DisassemblyDiv);
		Oam.hide();
		Map.hide();
		Tiles.hide();
		Memory.hide();
		hideElement(PalDiv);
		this.stopTimer();
	}

	this.start = function() {
		showElement(DebugDiv, 'grid');
		this.hideOpen();
		pauseEmulation();
        this.stopRunTilBreak();
		this.enabled = true;
		
		Themes.setSettingsBar();

		this.showDisassembly(c.pc.v);

        if(this.initialized)
			return;
			
		Map.init();
        Oam.init();

		// Add scroll event to disassembler
		DisScrollDiv.addEventListener("scroll", (e) => {
			if(Debug.isScrolling)
				return;
			
			window.requestAnimationFrame(() => {
				if(Math.ceil(e.target.clientHeight + e.target.scrollTop) > e.target.scrollHeight) {
					instr_shown += 18;
					Debug.drawDisassembly(curPC);
				}
				Debug.isScrolling = false;
			});
			
			Debug.isScrolling = true;
		})

		// add input file event listener
		let symFile = document.getElementById('symFile');

        symFile.addEventListener('change', function () {
            let reader = new FileReader();

            reader.readAsText(this.files[0]);

            reader.onloadend = function () {
                console.log(Debug.parseSymFile(reader.result));
            }
        });
        
        this.initialized = true;
	}


	this.showTiles = function() {
		this.hideOpen();
		Tiles.show();
	}


	this.showSprites = function() {
		this.hideOpen();
		Oam.show();
	}

	
	this.showMap = function() {
		this.hideOpen();
        Map.show();
	}

	this.showDisasm = function() {
		this.showDisassembly(c.pc.v);
	}

	/**
	 * @param {Number} palNum
	 */
	this.getBGColor = function(palNum, color) {
		palNum *= 8;
		const bgi = color * 2 + palNum;
		return (c.ppu.cgb.bgPal[bgi + 1] << 8) | c.ppu.cgb.bgPal[bgi];	 
	}

	/**
	 * @param {Number} palNum
	 */
	this.getObjColor = function(palNum, color) {
		palNum *= 8;
		const obji = color * 2 + palNum;
		return (c.ppu.cgb.objPal[obji + 1] << 8) | c.ppu.cgb.objPal[obji];
	}

	/**
	 * @param {Number} palNum 0-7
	 * @param {Number} color index of color in palette (0-3)
	 * @param {Number} word 16-bit color
	 */
	this.setBGColor = function(palNum, color, word) {
		const bgi = palNum * 8 + color * 2;

		c.ppu.updateBackgroundRGB(bgi, word & 0xFF);
		c.ppu.updateBackgroundRGB(bgi + 1, word >> 8);

		this.showPalette();
	}

	/**
	 * @param {Number} palNum 0-7
	 * @param {Number} color index of color in palette (0-3)
	 * @param {Number} word 16-bit color
	 */
	this.setOBJColor = function(palNum, color, word) {
		const bgi = palNum * 8 + color * 2;

		c.ppu.updateObjRGB(bgi, word & 0xFF);
		c.ppu.updateObjRGB(bgi + 1, word >> 8);

		this.showPalette();
	}

	this.viewPaletteColors = function(a, isBG) {
		a.innerHTML = `<h3 style="text-align:center;">${isBG ? "Background<br>" : "Object<br>"}</h3>`;

		for(let palNum = 0; palNum < 8; palNum++) {
			for(let i = 0; i < 4; i++) {
				const button = document.createElement('button');
				const col = Renderer.getPalette(c, isBG, palNum)[i];
				const color = `#${hex(col[0], 2, '')}${hex(col[1], 2, '')}${hex(col[2], 2, '')}`;
				
				button.type = "button";
				button.value = i | (palNum << 3);
				if(window.innerWidth >= 500)
					button.innerText = hex(this.getBGColor(palNum, i), 4, '');
				
				button.className = "pal-debug-button";
				button.style.backgroundColor = color;

				a.appendChild(button);
				button.addEventListener("click", Debug.changeColor);
			}
		}
	}

	this.showPalette = function() {
		this.hideOpen();
		showElement(PalDiv, 'flex');

		this.viewPaletteColors(document.getElementById('PalBG'), true);
		this.viewPaletteColors(document.getElementById('PalOBJ'), false);
	}

	this.changeColor = function(e) {
		// we cannot edit DMG palette colors
		if(!c.cgb) {
			Menu.message.show('DMG Palettes cannot be edited.');
			return;
		}

		const m = new PromptMenu("Color", "0000-7FFF", /[0-9a-fA-F]+/g, 4, (v) => {
			const pal = Number(e.target.value);
			v = Number("0x" + v);
			Debug.setBGColor(pal >> 3, pal & 3, v);
		}, null, e.target.innerText.replace('$', ''));

		m.show();
	}

	this.quit = function() {
		this.enabled = false;
		Themes.setStatusBar();
		hideElement(DebugDiv);

        this.hideBreak();
		resumeEmulation();
	}	

	const useBrackets = true; // add option to change

	this.getFullAddr = function(addr) {
		let bank = 0;
		if(addr >= 0x4000 && addr < 0x7000) // ROMX
			bank = c.hasMbc() ? c.mbcHandler.bank : 0;
		else if(addr >= 0x8000 && addr < 0xA000) // VRAM
			bank = c.ppu.getVRAMBank();
		else if(addr >= 0xD000 && addr < 0xE000) // WRAMX
			bank = c.cgb ? c.mbcHandler.ramBank == bank : 0;
		
		return (bank << 16) | addr;
	}

	this.getAddressName = function(addr) {
		addr = this.getFullAddr(addr);
		if(REGISTER_ADDR[addr])
			return ` ; ${REGISTER_ADDR[addr]}`;
		
		return '';
	}

	this.parseSymFile = function(str) {
		const expr = /.+/g; // /(^[0-9a-f]{2}(?=:)|[0-9a-f]{4}|(?<=\s+).+)/g
		const lines = str.split('\n');

		for(let i = 1; i < lines.length; i++)
		{
			const m = lines[i].match(expr);

			if(m.length != 3) {
				CPU.LOG(`Error reading line ${i + 1}: ${m, lines[i]}`);
				continue;
			}
	
			const bank = Number('0x' + m[0]);
			const addr = Number('0x' + m[1]);
			const lbl = m[2];
			REGISTER_ADDR[addr | (bank << 16)] = lbl;
		}

		this.showDisassembly(c.pc.v);

		return 'success';
	}
    
    this.getOpLength = function(op) {
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


	this.getAddrHTML = function(addr) {
		return `<button title="goto address"
		 onclick="Debug.drawDisassembly(${addr}, true);"
		 class="debug-addr-btn" type="button"><b>${Debug.hex(addr, 4)}</b>
		</button>`;
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
                    s = `${names[y]} ${r[z]}`;
                    break;
            }
            
            return s; // CB prefixes never have immediate addressing modes
        }

		if(useBrackets)
			s = s.replace("(", "[").replace(")", "]");

		let special = s.indexOf("${");
		let addr = null;
        
		if(special != -1) {
			let id = s.substring(special+2, s.indexOf("}"));
			let append = "";
			switch(id)
			{
				case "u8":
					const byte = c.read8(curPC);
					append = Debug.hex(byte);
					this.increasePC(1);
					// if these are ldh instr.
					if(op == 0xE0 || op == 0xF0)
						addr = 0xFF00 + byte;
					break;
				case "i8":
					const i = c.read8(curPC);
					append = `-${Debug.hex(i > 127 ? ((~i)&255) + 1 : i)}`;
					break;
				case "s8":
					addr = c.read8(curPC);
					this.increasePC(1);
					addr = addr > 127 ? curPC - ((~addr&255) + 1): curPC + addr;
					append = Debug.hex(addr, 4);
					break;
				case "u16":
					addr = c.read16(curPC);
					append = Debug.hex(addr, 4);
					this.increasePC(2);
					break;
				case "u16c":
					addr = c.read16(curPC);
					append = this.getAddrHTML(addr);
					this.increasePC(2);
					break;
				default:
					append = id;
					this.increasePC(1);
                    CPU.LOG(`Unknown string id: ${id}`);
			}

			s = s.replace(/\${.+}/g, append);
			if(addr != null)
				s += `<i style="color:gray;">${this.getAddressName(addr)}</i>`;
		}

		return s;
	}

	this.increasePC = function(dx) {
			curPC += dx;
	}

	this.parseOp = function(pc) {
		const op = c.read8(pc);
		const opLen = this.getOpLength(op);
		this.increasePC(1);
		let s = hex(op, 2, "");

		if(opLen == 2)
			s += ` ${hex(c.read8(curPC), 2, "")}   `;
		else if(opLen == 3)
			s += ` ${hex(c.read8(curPC), 2, "")} ${hex(c.read8(curPC + 1), 2, "")}`;
		else
			s += "      ";

		s += " | " + this.getOpString(op);

		return s;
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
    
	this.stopTimer = function() {
		if(this.timer)
            clearInterval(this.timer);
			
        this.timer = null;
	}
    
    this.stopRunTilBreak = function() {
        setLEDStatus(false);

        this.stopTimer();
		this.drawDisassembly(c.pc.v);
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
			Menu.message.show("Add a breakpoint first.", "No Breakpoints");
			return;
		}
        
        if(this.timer) {
            this.stopRunTilBreak();
        }
        else {
            this.timer = setInterval(Debug._runTilBreak, 1);
            setLEDStatus(true);
        }
        
        Debug.drawDisassembly(c.pc.v);
	}

	this.showRegister = function() {
		const regs = [
			["AF", ['af', 'v'], 4],
			["BC", ['bc', 'v'], 4],
			["DE", ['de', 'v'], 4],
			["HL", ['hl', 'v'], 4],
			["\n"],
			["PC", ['pc', 'v'], 4],
			["SP", ['sp', 'v'], 4],
			["\n"],
			["STAT", ['ppu', 'regs', 'stat'], 2],
			["LCDC", ['ppu', 'regs', 'lcdc'], 2],
			["SCY", ['ppu', 'regs', 'scy'], 2],
			["SCX", ['ppu', 'regs', 'scx'], 2],
			["LY", ['ppu', 'regs', 'scanline'], 2],
			["DMA", ['ppu', 'regs', 'dma'], 2],
			["OBJ0", ['ppu', 'regs', 'obj0'], 2],
			["OBJ1", ['ppu', 'regs', 'obj1'], 2],
			["WY", ['ppu', 'regs', 'wy'], 2],
			["WX", ['ppu', 'regs', 'wx'], 2],
			["\n"],
			["DIV", ['timerRegs', 'regs', 'div'], 2],
			["TIMA", ['timerRegs', 'regs', 'tima'], 2],
			["TMA", ['timerRegs', 'regs', 'tma'], 2],
			["TAC", ['timerRegs', 'regs', 'tac'], 2],
			["\n"],
			["IE", ['interrupt_enable'], 2],
			["IME", ['interrupt_master'], 2],
			["\n"],
			["BGI", ['ppu', 'cgb', 'bgi'], 2],
            ["OBJI", ['ppu', 'cgb', 'obji'], 2],
            ["VBK", ['ppu', 'cgb', 'vbank'], 2],
            ["SVBK", ['ppu', 'cgb', 'svbk'], 2],
		];


		let str = "";

		for(let i in regs)
		{
			if(regs[i][0] == '\n') {
				str += '<div class="div-separator" style="border-color: var(--ui-btn-color); "></div>';
				continue;
			}
			
			const keys = regs[i][1];
			let v = c[keys[0]];
			for(let j = 1; j < keys.length; j++)
				v = v[keys[j]];
			
			str += `${(regs[i][0] + ":").padEnd(5)}${Debug.hex(v, regs[i][2])}<br>`;
		}

		DisassemblyRegisters.innerHTML = str;
	}
    
    this.showMemory = function() {
		this.hideOpen();
		Memory.show();
    }

	/**
	 * The presence of this function allows for the PC to step through the entire
	 * 	visible disassembler window. Previously, the disassembler would scroll when
	 *  the PC exceeded `NUM_INSTR_MIN` bytes, but now it will scroll once we have
	 *  exceeded `NUM_INSTR_MIN` instructions
	 * - This function will calculate the number of instructions that occur
	 *    between the addresses. If this value exceeds `range`, then it will
	 *    `true`, otherwise false 
	 */
	this.isInsOutOfRange = function(addr1, addr2, range) {
		let low = addr1 > addr2 ? addr2 : addr1;
		const high = addr1 > addr2 ? addr1 : addr2;
		let ins = 0;

		while(low < high) {
			low += this.getOpLength(c.read8(low));
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
        
		this.hideOpen();
		showElement(DisassemblyDiv, 'grid');
		instr_shown = NUM_INSTR_MIN;
		DisScrollDiv.scrollTo(0, 0);
		this.drawDisassembly(pc);
	}

	
	this.drawDisassembly = function(pc, highlightPC = false) {
		curPC = pc;
		let curScroll = curPC - prevAddr;
		const offsetInstr = Math.abs(curScroll);

		if(this.isInsOutOfRange(curPC - curScroll, pc, instr_shown)) {
			prevAddr = pc;
		} else {
			curPC -= curScroll;
		}

		if(pc < curPC)
			curPC = pc;
            
        this.basePC = curPC;

		DisText.innerHTML = "";

		for(let i = 0; i < instr_shown; i++)
		{
			const isCurPC = c.pc.v == curPC;
			const isBreak = this.isBreakpoint(curPC);
			let str = isCurPC ? "<b style='background-color:lime; color: gray; padding-right:100%;'>" : "";

			if(highlightPC && pc == curPC)
				str += "<b style='background-color:lightblue; color: black; padding-right:100%;'>";

			str += isBreak ? "<b style='background-color:red; padding-right:100%;' title='breakpoint'>*" : " ";

			str += hex(curPC, 4, "") + " | "
				 + this.parseOp(curPC);

			if(isCurPC)
				str += "</b>";
			if(highlightPC && pc == curPC)
				str += "</b>";
			if(isBreak)
				str += "</b>";


			DisText.innerHTML += str + "<br>";

		}

		// scroll to the location of the program counter
		// const height = Math.round(DisText.clientHeight / instr_shown); // height of each line (including line spacing)
		// DisScrollDiv.scrollTo(0, height * (offsetInstr - 3));
		// console.log(height * (offsetInstr - 3), offsetInstr);

		this.showRegister();
	}

	this.stepDis = function() {
		do {
			c.execute();
		} while(c.isHalted);
		this.drawDisassembly(c.pc.v);
	}
    
    // Skips subroutines
    this.stepDisSkipSub = function() {
        const exclude = [0xE9, 0xC3, 0x18, 0xC0, 0xD0, 0xC8, 0xC9, 0xD8, 0xD9];
        const condBranches = [0x20, 0x30, 0x28, 0x38, 0xC2, 0xD2, 0xCA, 0xDA];
        
        const op = c.read8(c.pc.v);
        let addr = c.pc.v + this.getOpLength(op);
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
        
        this.drawDisassembly(c.pc.v);
    }

	this.gotoDis = function() {
        const m = new PromptMenu("Enter Address", "0000-FFFF", /[0-9A-Fa-f]+/g, 4, function(a) {
            a = Number("0x" + a);
            if(a != null)
                Debug.drawDisassembly(a, true);
        });
        
        m.show();
	}
    
    this.searchByte = function() {
        const m = new PromptMenu("Search for Data", "00-FFFF", /[A-Fa-f0-9]+/g, 4, function(a) {
			let high = -1;
			if(a.length > 2)
				high = Number("0x" + a) >> 8;

            let low = Number("0x" + a);
			const useHigh = high > -1;
			
            if(low == null || high == null)
                return;

			low &= 0xFF;
			if(useHigh)
				high &= 0xFF;
            
            let p = Debug.basePC; // we will start searching from the currently shown address in the disassembler
			let found = false;
            
            while(++p < 0xFFFF) {
				if(useHigh) {
					if(c.read8(p) == high && c.read8(p + 1) == low)
						found = true;
				} else {
					if(c.read8(p) == low)
						found = true;
				}
					
				if(found) {
					Debug.drawDisassembly(p, true);
					return;
                }
            }

            Menu.alert.show(`Byte ${Debug.hex(a)} not found, starting from ${Debug.hex(Debug.basePC, 4)}`);
        });

		m.addText("Search for a byte in the room");
        
        m.show();
    }

	this.hex = function(n, padding = 2) {
		return hex(n, padding, "$");
	}

	this.addBreak = function() {
		const m = new PromptMenu("Address", "0000-FFFF", /[A-Fa-f0-9]+/g, 4, (addr) => {
			addr = Number("0x" + addr);

			if(addr == null || Number.isNaN(addr))
				return;

			this.newBreakpoint(addr);
			this.drawBreaks();
		});

		m.show();
	}

	this.rmBreak = function() {
		for(let i = 0; i < DisBreakpointList.children.length; i++) {
			const child = DisBreakpointList.children[i];

			if(child.checked) {
				if(!this.removeBreakpoint(Number(child.value)))
					return;

				this.drawBreaks();
				return;
			}
		}
	}
    
    this.drawBreaks = function() {
        const breakList = document.getElementById("DisBreakpointList");
        breakList.innerHTML = "";
        
        for(let i in this.breakpoints) {
			let addr = Debug.hex(Number(i), 4);
            if(this.breakpoints[i] != false)
                breakList.innerHTML += `
					<input type="radio" id="break${addr}" name="breakpoints" value="${i}" class="debug-breakpoint-radio">
					<label class="debug-breakpoint-name" for="break${addr}">${addr}</label><br>
				`;
		}
    }
    
    this.showBreak = function() {
        const breakpointMenu = document.getElementById("DisassemblyBreakpoints");
        
        showElement(breakpointMenu);
        this.drawBreaks();
    }
    
    this.hideBreak = function() {
        hideElement(document.getElementById("DisassemblyBreakpoints"));
		this.drawDisassembly(c.pc.v);
    }


}