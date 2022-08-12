var Memory = new function() {
    const div = document.getElementById('MemoryDiv');

	this.dumpMemory = function(pc) {
        let s = `${Debug.hex(pc, 4)} : `;
        
        for(let i = 0; i < 8; i++) {
			const byte = c.read8(pc + i);
            s += "  " + Debug.hex(byte, 2, '');
        }
        
        return s;
    }

    this.show = function() {
        const a = div.getElementsByTagName("pre")[0];
        let s = "";
		const rombank = c.hasMbc() ? c.mbcHandler.bank : 'X';
		const rambank = c.hasMbc() ? c.mbcHandler.ramBank : '0';
		const romx = `ROM${hex(rombank, 2, '')}`;
		const cram = `RAM${hex(rambank, 2, '')}`;
		const mem_types = [
			"ROM0 ", // 0x0000
			"ROM0 ", // 0x1000
			"ROM0 ", // 0x2000
			"ROM0 ", // 0x3000
			romx,    // 0x4000
			romx,    // 0x5000
			romx,    // 0x6000
			romx,    // 0x7000
			"VRAM ", // 0x8000
			"VRAM ", // 0x9000
			cram,    // 0xA000
			cram,    // 0xB000
			"WRAM0", // 0xC000
			"WRAMX", // 0xD000
			"MIRR ", // 0xE000
			"IORAM", // 0xF000
        ];

		showElement(div);

		if(!c.romLoaded) {
			a.innerHTML = `<a style="display: grid; align-items: center; height: 100%; text-align: center;">Load a ROM before viewing memory</a>`;
			return;
		}
        
        for(let i = 0; i < 0xFFFF >> 3; i++)
        {
            s += `<b style="color:white";>${mem_types[i >> 9]}</b>:${this.dumpMemory(i << 3)}<br>`;
        }
        
        a.innerHTML = s;
    }

    this.hide = function() {
        hideElement(div);
    }
}