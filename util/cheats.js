class Code {
    constructor(name, addr, byte, type) {
        this.name = name;
        this.type = type;
        this.addr = addr;
        this.byte = byte;
    }
}


class Cheats {
    constructor() {
        this.enabled = true;
        this.cheats = {};
    }


    addCode(code, name) {
        code = code.trim();
        const type = Number("0x" + code.substring(0, 2));
        const byte = Number("0x" + code.substring(2, 4));
        const addr = Number("0x" + code.substring(4, 9));
        const cht = new Code(name, addr, byte, type);

        this.cheats[addr] = cht;
    }


    read(addr, bank = 999) {
        if(this.enabled && this.cheats[addr] && bank < 2)
            return this.cheats[addr].byte;

        return null;
    }


    reset() {
        
    }
}