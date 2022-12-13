var Memory = new function() {
    const div = document.getElementById('MemoryDiv');
	const bytePerRow = 16;
	
	this.dumpType = function(str) {
		const a = document.getElementById('MemoryContent');
		const mem_types = {
			"rom0": [0x0000, 0x4000],
			"romx": [0x4000, 0x8000],
			"vram": [0x8000, 0xa000],
			"cram": [0xa000, 0xc000],
			"wram": [0xc000, 0xf000],
			"hram": [0xff00, 0x10000],
		};

		const addr = mem_types[str];
		const rombank = c.hasMbc() ? c.mbcHandler.bank : '0';
		const rambank = c.hasMbc() ? c.mbcHandler.ramBank : '0';
		let s = "";

		if(str == 'romx') {
			str = `ROM${rombank}`;
		} else if(str == 'cram') {
			str = `CRAM${rambank}`;
		} else if(str == 'wram') {
			str = `WRAM${0}`;
		}

		str = str.toUpperCase();
		
		for(let i = addr[0]; i < addr[1]; i += bytePerRow) {
			s += `${str}  ${Memory.dumpMemory(i)}\n`;
		}

        a.innerText = s;
	}

	this.isValidCharNum = function(c) {
		return (c >= 32 && c < 127) || (c > 160);
	}

	this.dumpMemory = function(pc) {
        let s = `${Debug.hex(pc, 4)} : `;
		let characterString = '';
        
        for(let i = 0; i < bytePerRow; i++) {
			const byte = c.read8(pc + i);
            s += "  " + Debug.hex(byte, 2, '');
			characterString += this.isValidCharNum(byte) ? String.fromCharCode(byte) : '.';
        }
        
        return `${s}  ${characterString}`;
    }

    this.show = function() {
		showElement(div);
		this.dumpType("rom0");
    }

    this.hide = function() {
        hideElement(div);
    }
}