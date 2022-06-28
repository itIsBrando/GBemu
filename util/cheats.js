class Code {
    constructor(label, code) {
        const type = Number("0x" + code.substring(0, 2));
        const byte = Number("0x" + code.substring(2, 4));
        const addr = Number(`0x${code.substring(6, 9)}${code.substring(4, 6)}`);

        this.code = code;
        this.label = label;
        this.bank = type;
        this.byte = byte;
        this.addr = addr;
        
        this.oldByte = 0;
        this.enabled = true;
    }

    getKey() {
        return this.addr;
    }

    accepts(addr) {
        if(!this.enabled)
            return false;
        
/*         if(addr < 0xA000)
            return true;
        else if(addr >= 0xA000 && addr < 0xC000)
            return true; // @TODO CHECK MBC BANKING
        else if(addr >= 0xD000 && addr < 0xE000)
            return c.ppu.cgb.svbk == this.bank;
 */
        return true;
    }
}

const CheatsList = document.getElementById('CheatsList');
const CheatsDiv = document.getElementById('CheatsDiv');

class Cheats {


    constructor() {
        this.codes = {};
        this.enabled = true;
    }

    addCode(code, label) {
        // Note that addresses are stored in little endian
        code = code.trim().toLowerCase();
        if(!Cheats.valid(code))
            return false;
        
        const cht = new Code(label, code);

        this.codes[cht.getKey()] = cht;
    }

    rmCode(addr) {
        return delete this.codes[addr];
    }

    accepts(addr) {
        return this.enabled && (addr in this.codes) && this.codes[addr].accepts(addr);
    }

    read(addr) {
        return this.codes[addr].byte;
    }

    static valid(code) {
        return code.length == 8 && code.substring(0, 2) == "01";
    }

    reset() {
        
    }

    static start() {
        showElement(CheatsDiv);
    }

    static hide() {
        hideElement(CheatsDiv);
    }

    static drawCodes() {
        const codes = c.cheats.codes;
        CheatsList.innerHTML = '';

        for(let i in codes) {
            let addr = codes[i].code;
            const k = codes[i].getKey();
            CheatsList.innerHTML += `
                <button type="button" value=${k} onclick="Cheats.toggle(this)">e</button>
                <input type="radio" id="cheat${addr}" name="cheats" value="${k}" class="debug-breakpoint-radio">
                <label class="debug-breakpoint-name" for="cheat${addr}">${addr}</label><br>
            `;
        }
    }

    static add() {
        const m = PromptMenu.new("Gameshark Code", "0ZYYXXXX", /[0-9a-fA-F]+/g, 8, (v) => {
			if(!Cheats.valid(v)) {
                showMessage("Not a valid cheat code", "Error");
                return;
            }

            c.cheats.addCode(v);
            Cheats.drawCodes();
		}, null);

		PromptMenu.show(m);
    }

    static rm() {
        for(let i = 0; i < CheatsList.children.length; i++) {
			const child = CheatsList.children[i];
			if(child.checked) {
				if(!c.cheats.rmCode(Number(child.value)))
					return;

				Cheats.drawCodes();
				return;
			}
		}
    }

    static toggle(elem) {
        const cd = c.cheats.codes[elem.value];
        cd.enabled = !cd.enabled;

        elem.innerHTML = cd.enabled ? 'e' : 'd';
    }
}