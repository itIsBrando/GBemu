var Memory = new function() {
    const div = document.getElementById('MemoryDiv');
	const bytePerRow = 16;
	this.drawInterval;
	this.curAddr = 0;
	this.endAddr = 0;

	this.startDump = function(memType) {
		const a = document.getElementById('MemoryContent');

		for(let i = 0; i < 15; i++) {
			a.innerHTML += `${memType}  ${Memory.dumpMemory(Memory.curAddr)}\n`;
			Memory.curAddr += bytePerRow;

			if(Memory.curAddr >= Memory.endAddr) {
				clearInterval(Memory.drawInterval);
				return;
			}
		}
	}
	
	this.dumpType = function(str) {
		const a = document.getElementById('MemoryContent');
		const mem_types = {
			"rom0": {start: 0x0000, end: 0x4000},
			"romx": {start: 0x4000, end: 0x8000},
			"vram": {start: 0x8000, end: 0xa000},
			"cram": {start: 0xa000, end: 0xc000},
			"wram": {start: 0xc000, end: 0xf000},
			"hram": {start: 0xff00, end: 0x10000},
		};

		clearInterval(this.drawInterval);

		const addr = mem_types[str];
		const rombank = c.hasMbc() ? c.mbcHandler.bank : '0';
		const rambank = c.hasMbc() ? c.mbcHandler.ramBank : '0';

		if(str == 'romx') {
			str = `ROM${rombank}`;
		} else if(str == 'cram') {
			str = `CRAM${rambank}`;
		} else if(str == 'wram') {
			str = `WRAM${0}`;
		}

		a.innerHTML = '';

		this.curAddr = addr.start;
		this.endAddr = addr.end;
		this.drawInterval = setInterval(
			() => {
				Memory.startDump(str.toUpperCase());
			}, 5
		);

	}

	this.isValidCharNum = function(c) {
		return (c >= 32 && c < 127) || (c > 160);
	}

	this.dumpMemory = function(pc) {
        let s = `${Debug.hex(pc, 4)} : `;
		let characterString = '';
        
        for(let i = 0; i < bytePerRow; i++) {
			const byte = c.read8(pc++);
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