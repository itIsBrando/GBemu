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
    "CB",    // implemented elsewhere
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


class Opcode {
    static useBrackets = false;

    constructor(addr) {
        this.op = c.read8(addr);
        this.nextByte = c.read8(addr + 1);
        this.nextWord = c.read16(addr + 1);
        this.address = addr;
    }

    getOpcodeString() {
        switch(this.getLength()) {
            case 1:
                return hex(this.op, 2, "");
            case 2:
                return `${hex(this.op, 2, "")}${hex(this.nextByte, 2, "")}`;
            case 3:
                return `${hex(this.op, 2, "")}${hex(this.nextByte, 2, "")}${hex(this.nextWord >> 8, 2, "")}`;
        }
    }

    static getOpLength(op) {
        const s = opcodeLUT[op];

        if(s == null)
            return 1;

        const special = s.indexOf("${");
        const id = s.substring(special+2, s.indexOf("}"));
        
        if(id == "s8" || id == "u8" || id == "i8" || op == 0xCB)
            return 2;
        else if(special == -1)
            return 1;
        else
            return 3;
    }

    getLength() {
        return Opcode.getOpLength(this.op);
    }

    getString() {
        let s = opcodeLUT[this.op] ? opcodeLUT[this.op] : '<b style="color:gray;">Illegal Opcode</b>';
        
        // special handling for CB instructions
        if(this.op == 0xCB) {
            const x = (this.nextByte & 0b11000000) >> 6;
            const y = ((this.nextByte & 0b00111000) >> 3) & 0x07;
            const z = (this.nextByte & 0b00000111);
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
            
            return s;
        }

        if(Opcode.useBrackets)
            s = s.replace("(", "[").replace(")", "]");

        let special = s.indexOf("${");
        let addr = null;
        
        if(special != -1) {
            let id = s.substring(special + 2, s.indexOf("}"));
            let append = "";
            switch(id) {
                case "u8":
                    append = Debug.hex(this.nextByte);
                    // if these are ldh instr.
                    if(this.op == 0xE0 || this.op == 0xF0)
                        addr = 0xFF00 + this.nextByte;
                    break;
                case "i8":
                    append = `-${Debug.hex(this.nextByte > 127 ? ((~this.nextByte)&255) + 1 : this.nextByte)}`;
                    break;
                case "s8":
                    addr = this.nextByte;
                    addr = addr > 127 ? this.address - ((~addr&255) + 1): this.address + addr;
                    append = Debug.hex(addr, 4);
                    break;
                case "u16":
                    addr = this.nextWord;
                    append = hex(this.nextWord, 4, '$');
                    break;
                case "u16c":
                    addr = this.nextWord;
                    append = hex(addr, 4, '$');//Opcode.formatAddr(addr);
                    break;
                default:
                    append = id;
                    CPU.LOG(`Unknown string id: ${id}`);
            }

            s = s.replace(/\${.+}/g, append);
            if(addr != null)
                s += Opcode.getAddressName(addr);
        }

        return s;
    }

    static getAddressName(addr) {
        function a(addr) {
            let bank = 0;
            if(addr >= 0x4000 && addr < 0x7000) // ROMX
                bank = c.hasMbc() ? c.mbcHandler.bank : 0;
            else if(addr >= 0x8000 && addr < 0xA000) // VRAM
                bank = c.ppu.getVRAMBank();
            else if(addr >= 0xD000 && addr < 0xE000) // WRAMX
                bank = c.cgb ? c.mbcHandler.ramBank == bank : 0;
            
            return (bank << 16) | addr;
        }
        addr = a(addr);

        if(REGISTER_ADDR[addr])
            return `<i style="color:gray;"> ; ${REGISTER_ADDR[addr]}</i>`;
        
        return '';
    }
}