const VRAM_BASE = 0x8000;
const OAM_BASE = 0xFE00;

const DebugDiv = document.getElementById('DebugDiv');
const PalDiv = document.getElementById('PalDiv');
const DisassemblyRegisters = document.getElementById('DisassemblyRegisters');

var Debug = new function() {
    this.basePC = 0;

	this.enabled = false;
    this.initialized = false;

	this.hideOpen = function() {
		Disassembler.hide();
		Oam.hide();
		Map.hide();
		Tiles.hide();
		Memory.hide();
		hideElement(PalDiv);
	}

	this.start = function() {
		showElementFadeIn(DebugDiv, 'grid');
		this.hideOpen();
		pauseEmulation();
		this.enabled = true;
		
		Themes.setSettingsBar(true);

        if(this.initialized) {
			this.showDisasm();
			return;
		}
			
		Map.init();
        Oam.init();
		Disassembler.init();

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
		this.hideOpen();
		Disassembler.show();
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
		hideElementFadeOut(DebugDiv);

        this.hideBreak();
		resumeEmulation();
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

		return 'success';
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
    
    
    this._runTilBreak = function() {
        for(let i = 0; i < 0x400000 / 1000; i++) {
            c.execute();
            
            if(Debug.isBreakpoint(c.pc.v)) {
                Debug.stopRunTilBreak();
                return;
            }
        }
    }
    
	this.showRegister = function() {
		// name, keys, length of number
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
			["LYC", ['ppu', 'regs', 'syc'], 2],
			["DMA", ['ppu', 'regs', 'dma'], 2],
			["BGP", ['ppu', 'regs', 'bgp'], 2],
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
			["Speed Mode", ['ppu', 'cgb', 'speed_mode'], 1],
			["\n"],
			["HDMA ENA", ['hdma', 'enable'], 1],
			["HDMA LEN", ['hdma', 'len'], 2],
			["Src", ['hdma', 'source'], 4],
			["Dest", ['hdma', 'destination'], 4],
		];

		let str = "";

		for(let i in regs)
		{
			if(regs[i][0] == '\n') {
				str += '<div class="div-separator" style="border-color: var(--ui-primary-button); grid-column: 1 / 3;"></div>';
				continue;
			}
			
			const keys = regs[i][1];
			let v = c[keys[0]];
			for(let j = 1; j < keys.length; j++)
				v = v[keys[j]];
			
			str += `<div style="color:var(--ui-accent);">${(regs[i][0] + ":").padEnd(5)}</div><div style="text-align:right; padding-right:1em;">${Debug.hex(v, regs[i][2])}</div>`;
		}

		DisassemblyRegisters.innerHTML = str;
	}
    
    this.showMemory = function() {
		this.hideOpen();
		Memory.show();
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
    }


}
