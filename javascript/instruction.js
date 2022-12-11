"use strict"

/**
 * @param {number} op
 * @param {CPU} cpu
 * @param {boolean} isCB if the opcode is part of the extended set
 */
function illegalOpcode(op, cpu, isCB) {
    let out = "Unknown Opcode, ";
    if(isCB == true)
        out+="0xCB ";

    out +=  hex(op) + ", at address " + hex(cpu.pc.v);

    Menu.message.show(out, "Illegal Opcode");
    pauseEmulation();
}


var opTable = {
    // nop
    0x00: function(cpu) {
        cpu.skip(1);
    },
    // ld bc, nn
    0x01: function(cpu) {
        let nn = cpu.readImmediate16();
        cpu.bc.v = nn;
        cpu.skip(3);
    },
    // ld [bc], a
    0x02: function(cpu) {
        cpu.write8(cpu.bc.v, cpu.af.high);
        cpu.skip(1);
    },
    // inc bc
    0x03: function(cpu) {
        cpu.bc.v++;
        cpu.skip(1);
    },
    // inc b
    0x04: function(cpu) {
        cpu.halfCarry8(cpu.bc.high, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.bc.high++;
        cpu.zero(cpu.bc.high);
        cpu.skip(1);
    },
    // dec b
    0x05: function(cpu) {
        cpu.halfCarry8(cpu.bc.high, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.bc.high--;
        cpu.zero(cpu.bc.high);
        cpu.skip(1);
    },
    // ld b, n
    0x06: function(cpu) {
        cpu.bc.high = cpu.readImmediate8();
        cpu.skip(2);
    },
    // rlca
    0x07: function(cpu) {
        cpu.flags.c = Boolean(cpu.af.high & 0x80);
        cpu.af.high <<= 1;
        cpu.af.high |= Number(cpu.flags.c);

        cpu.flags.n = false;
        cpu.flags.hc= false;
        cpu.flags.z = false;
        cpu.skip(1);
    },


    // ld [nn], sp
    0x08: function(cpu) {
        let nn = cpu.readImmediate16();
        cpu.write16(nn, cpu.sp.v);
        cpu.skip(3);
    },
    // add hl, bc
    0x09: function(cpu) {
        cpu.halfCarry16(cpu.hl.v, cpu.bc.v, Arithmetic.ADD);
        cpu.carry16(cpu.hl.v, cpu.bc.v, Arithmetic.ADD);

        cpu.flags.n = false;
        cpu.hl.v += cpu.bc.v;
        cpu.skip(1);
    },
    // ld a, [bc]
    0x0A: function(cpu) {
        cpu.af.high = cpu.read8(cpu.bc.v);
        cpu.skip(1);
    },
    // dec bc
    0x0B: function(cpu) {
        cpu.bc.v--;
        cpu.skip(1);
    },
    // inc c
    0x0C: function(cpu) {
        cpu.halfCarry8(cpu.bc.low, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.bc.low++;
        cpu.zero(cpu.bc.low);
        cpu.skip(1);
    },
    // dec c
    0x0D: function(cpu) {
        cpu.halfCarry8(cpu.bc.low, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.bc.low--;
        cpu.zero(cpu.bc.low);
        cpu.skip(1);
    },
    // ld c, n
    0x0E: function(cpu) {
        let n = cpu.readImmediate8();
        cpu.bc.low = n;
        cpu.skip(2);
    },

    // rrca
    0x0F: function(cpu) {
        let byte = cpu.af.high;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.af.high = byte;

        cpu.flags.z = false;
        cpu.flags.hc = false;
        cpu.flags.n = false;
        cpu.skip(1);
    },


    // stop
    0x10: function(cpu) {
        CPU.LOG("STOP PC: " + hex(cpu.pc.v));
        cpu.skip(2);

        if(cpu.cgb && (cpu.ppu.getSpeedMultiplier() >> 1) != cpu.ppu.cgb.key1) {
            cpu.ppu.cgb.speed ^= 0b11; // sets to 1 or 2
            CPU.LOG("Speed switch");
        }
    },
    // ld de, nn
    0x11: function(cpu) {
        let nn = cpu.readImmediate16();
        cpu.de.v = nn;
        cpu.skip(3);
    },
    // ld [de], a
    0x12: function(cpu) {
        cpu.write8(cpu.de.v, cpu.af.high);
        cpu.skip(1);
    },
    // inc de
    0x13: function(cpu) {
        cpu.de.v++;
        cpu.skip(1);
    },
    // inc d
    0x14: function(cpu) {
        cpu.halfCarry8(cpu.de.high, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.de.high++;
        cpu.zero(cpu.de.high);
        cpu.skip(1);
    },
    // dec d
    0x15: function(cpu) {
        cpu.halfCarry8(cpu.de.high, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.de.high--;
        cpu.zero(cpu.de.high);
        cpu.skip(1);
    },
    // ld d, n
    0x16: function(cpu) {
        cpu.de.high = cpu.readImmediate8();
        cpu.skip(2);
    },
    // rla
    0x17: function(cpu) {
        let c = Boolean(cpu.af.high & 0x80);
        cpu.af.high <<= 1;
        cpu.af.high |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.flags.z = false;
        cpu.flags.hc = false;
        cpu.flags.n = false;
        cpu.skip(1);
    },
    // jr dd
    0x18: function(cpu) {
        let nn = UInt16.toSigned(cpu.readImmediate8());
        cpu.skip(2 + nn);
    },
    // add hl, de
    0x19: function(cpu) {
        cpu.halfCarry16(cpu.hl.v, cpu.de.v, Arithmetic.ADD);
        cpu.carry16(cpu.hl.v, cpu.de.v, Arithmetic.ADD);

        cpu.flags.n = false;
        cpu.hl.v += cpu.de.v;
        cpu.skip(1);
    },
    // ld a, [de]
    0x1A: function(cpu) {
        cpu.af.high = cpu.read8(cpu.de.v);
        cpu.skip(1);
    },
    // dec de
    0x1B: function(cpu) {
        cpu.de.v--;
        cpu.skip(1);
    },
    // inc e
    0x1C: function(cpu) {
        cpu.halfCarry8(cpu.de.low, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.de.low++;
        cpu.zero(cpu.de.low);
        cpu.skip(1);
    },
    // dec e
    0x1D: function(cpu) {
        cpu.halfCarry8(cpu.de.low, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.de.low--;
        cpu.zero(cpu.de.low);
        cpu.skip(1);
    },
    // ld e, n
    0x1E: function(cpu) {
        let n = cpu.readImmediate8();
        cpu.de.low = n;
        cpu.skip(2);
    },
    // rra
    0x1F: function(cpu) {
        let c = Boolean(cpu.af.high & 0x1);
        cpu.af.high >>= 1;
        cpu.af.high |= Number(cpu.flags.c) << 7;

        cpu.flags.z = false;
        cpu.flags.hc = false;
        cpu.flags.n = false;
        cpu.flags.c = c;
        cpu.skip(1);
    },



    // jr nz, d8
    0x20: function(cpu) {
        let d8 = cpu.readImmediate8();
        cpu.skip(2);
        if(cpu.flags.z == false) {
            cpu.skip(UInt16.toSigned(d8));
            cpu.cycles = 12;
        } else {
            cpu.cycles = 8;
        }

    },
    // ld hl, nn
    0x21: function(cpu) {
        let nn = cpu.readImmediate16();
        cpu.hl.v = nn;
        cpu.skip(3);
    },
    // ld [hl+], a
    0x22: function(cpu) {
        cpu.write8(cpu.hl.v, cpu.af.high);
        cpu.hl.v++;
        cpu.skip(1);
    },
    // inc hl
    0x23: function(cpu) {
        cpu.hl.v++;
        cpu.skip(1);
    },
    // inc h
    0x24: function(cpu) {
        cpu.halfCarry8(cpu.hl.high, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.hl.high++;
        cpu.zero(cpu.hl.high);
        cpu.skip(1);
    },
    // dec h
    0x25: function(cpu) {
        cpu.halfCarry8(cpu.hl.high, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.hl.high--;
        cpu.zero(cpu.hl.high);
        cpu.skip(1);
    },
    // ld h, n
    0x26: function(cpu) {
        cpu.hl.high = cpu.readImmediate8();
        cpu.skip(2);
    },
    // daa
    0x27: function(cpu) {
        let a = cpu.af.high;

        if(!cpu.flags.n) {
            if(cpu.flags.c || a > 0x99) {
                a = (a + 0x60) & 0xFF;
                cpu.flags.c = true;
            }
            if(cpu.flags.hc || (a & 0x0F) > 0x9)
                a = (a + 0x06) & 0xFF;
        } else {
            if(cpu.flags.c)
                a = (a - 0x60) & 0xFF;
            if(cpu.flags.hc)
                a = (a - 0x06) & 0xFF;

        }

        cpu.flags.hc = false;
        cpu.af.high = a;
        cpu.zero(a);
        cpu.skip(1);
    },

    // jr z, d8
    0x28: function(cpu) {
        let d8 = UInt16.toSigned(cpu.readImmediate8());
        cpu.skip(2);

        if(cpu.flags.z == true) {
            cpu.skip(d8);
            cpu.cycles = 12;
        } else {
            cpu.cycles = 8;
        }

    },
    // add hl, hl
    0x29: function(cpu) {
        cpu.halfCarry16(cpu.hl.v, cpu.hl.v, Arithmetic.ADD);
        cpu.carry16(cpu.hl.v, cpu.hl.v, Arithmetic.ADD);

        cpu.flags.n = false;
        cpu.hl.v += cpu.hl.v;
        cpu.skip(1);
    },
    // ld a, [hl+]
    0x2A: function(cpu) {
        cpu.af.high = cpu.read8(cpu.hl.v);
        cpu.hl.v++;
        cpu.skip(1);
    },
    // dec hl
    0x2B: function(cpu) {
        cpu.hl.v--;
        cpu.skip(1);
    },
    // inc l
    0x2C: function(cpu) {
        cpu.halfCarry8(cpu.hl.low, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.hl.low++;
        cpu.zero(cpu.hl.low);
        cpu.skip(1);
    },
    // dec l
    0x2D: function(cpu) {
        cpu.halfCarry8(cpu.hl.low, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.hl.low--;
        cpu.zero(cpu.hl.low);
        cpu.skip(1);
    },
    // ld l, n
    0x2E: function(cpu) {
        let n = cpu.readImmediate8();
        cpu.hl.low = n;
        cpu.skip(2);
    },
    // cpl
    0x2F: function(cpu) {
        cpu.af.high = ~cpu.af.high;
        cpu.flags.n = true;
        cpu.flags.hc = true;
        cpu.skip(1);
    },


    // jr nc, d8
    0x30: function(cpu) {
        let d8 = UInt16.toSigned(cpu.readImmediate8());
        cpu.skip(2);
        if(cpu.flags.c == false) {
            cpu.skip(d8);
            cpu.cycles = 12;
        } else {
            cpu.cycles = 8;
        }

    },
    // ld sp, nn
    0x31: function(cpu) {
        let nn = cpu.readImmediate16();
        cpu.sp.v = nn;
        cpu.skip(3);
    },
    // ld [hl-], a
    0x32: function(cpu) {
        cpu.indirect_hl = cpu.af.high;
        cpu.hl.v--;
        cpu.skip(1);
    },
    // inc sp
    0x33: function(cpu) {
        cpu.sp.v++;
        cpu.skip(1);
    },
    // inc [hl]
    0x34: function(cpu) {
        cpu.halfCarry8(cpu.indirect_hl, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.indirect_hl++;
        cpu.zero(cpu.indirect_hl);
        cpu.skip(1);
    },
    // dec [hl]
    0x35: function(cpu) {
        cpu.halfCarry8(cpu.indirect_hl, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.indirect_hl--;
        cpu.zero(cpu.indirect_hl);
        cpu.skip(1);
    },
    // ld [hl], n
    0x36: function(cpu) {
        cpu.indirect_hl = cpu.readImmediate8();
        cpu.skip(2);
    },
    // scf             0x37
    0x37: function(cpu) {
        cpu.flags.c = true;
        cpu.flags.hc= false;
        cpu.flags.n = false;
        cpu.skip(1);
    },

    // jr c, d8
    0x38: function(cpu) {
        let d8 = UInt16.toSigned(cpu.readImmediate8());
        cpu.skip(2);

        if(cpu.flags.c == true) {
            cpu.skip(d8);
            cpu.cycles = 12;
        } else {
            cpu.cycles = 8;
        }

    },
    // add hl, sp
    0x39: function(cpu) {
        cpu.halfCarry16(cpu.hl.v, cpu.sp.v, Arithmetic.ADD);
        cpu.carry16(cpu.hl.v, cpu.sp.v, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.hl.v += cpu.sp.v;
        cpu.skip(1);
    },
    // ld a, [hl-]
    0x3A: function(cpu) {
        cpu.af.high = cpu.read8(cpu.hl.v);
        cpu.hl.v--;
        cpu.skip(1);
    },
    // dec sp
    0x3B: function(cpu) {
        cpu.sp.v--;
        cpu.skip(1);
    },
    // inc a
    0x3C: function(cpu) {
        cpu.halfCarry8(cpu.af.high, 1, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high++;
        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // dec a
    0x3D: function(cpu) {
        cpu.halfCarry8(cpu.af.high, 1, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high--;
        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // ld a, n
    0x3E: function(cpu) {
        cpu.af.high = cpu.readImmediate8();
        cpu.skip(2);
    },
    // ccf
    0x3F: function(cpu) {
        cpu.flags.c = !cpu.flags.c;
        cpu.flags.n = false;
        cpu.flags.hc = false;
        cpu.skip(1);
    },

    /*********************************************************
     *                          4X
     ********************************************************/

    // ld r, b
    0x40: function(cpu) {
        cpu.bc.high = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x41: function(cpu) {
        cpu.bc.high = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x42: function(cpu) {
        cpu.bc.high = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x43: function(cpu) {
        cpu.bc.high = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x44: function(cpu) {
        cpu.bc.high = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x45: function(cpu) {
        cpu.bc.high = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x46: function(cpu) {
        cpu.bc.high = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x47: function(cpu) {
        cpu.bc.high = cpu.af.high;
        cpu.skip(1);
    },

    // ld r, b
    0x48: function(cpu) {
        cpu.bc.low = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x49: function(cpu) {
        cpu.bc.low = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x4A: function(cpu) {
        cpu.bc.low = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x4B: function(cpu) {
        cpu.bc.low = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x4C: function(cpu) {
        cpu.bc.low = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x4D: function(cpu) {
        cpu.bc.low = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x4E: function(cpu) {
        cpu.bc.low = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x4F: function(cpu) {
        cpu.bc.low = cpu.af.high;
        cpu.skip(1);
    },

    /*********************************************************
     *                          5X
     ********************************************************/

    // ld r, b
    0x50: function(cpu) {
        cpu.de.high = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x51: function(cpu) {
        cpu.de.high = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x52: function(cpu) {
        cpu.de.high = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x53: function(cpu) {
        cpu.de.high = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x54: function(cpu) {
        cpu.de.high = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x55: function(cpu) {
        cpu.de.high = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x56: function(cpu) {
        cpu.de.high = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x57: function(cpu) {
        cpu.de.high = cpu.af.high;
        cpu.skip(1);
    },

    // ld r, b
    0x58: function(cpu) {
        cpu.de.low = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x59: function(cpu) {
        cpu.de.low = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x5A: function(cpu) {
        cpu.de.low = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x5B: function(cpu) {
        cpu.de.low = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x5C: function(cpu) {
        cpu.de.low = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x5D: function(cpu) {
        cpu.de.low = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x5E: function(cpu) {
        cpu.de.low = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x5F: function(cpu) {
        cpu.de.low = cpu.af.high;
        cpu.skip(1);
    },

    /*********************************************************
     *                          0x60-0x6F
     ********************************************************/

    // ld r, b
    0x60: function(cpu) {
        cpu.hl.high = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x61: function(cpu) {
        cpu.hl.high = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x62: function(cpu) {
        cpu.hl.high = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x63: function(cpu) {
        cpu.hl.high = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x64: function(cpu) {
        cpu.hl.high = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x65: function(cpu) {
        cpu.hl.high = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x66: function(cpu) {
        cpu.hl.high = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x67: function(cpu) {
        cpu.hl.high = cpu.af.high;
        cpu.skip(1);
    },

    // ld r, b
    0x68: function(cpu) {
        cpu.hl.low = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x69: function(cpu) {
        cpu.hl.low = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x6A: function(cpu) {
        cpu.hl.low = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x6B: function(cpu) {
        cpu.hl.low = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x6C: function(cpu) {
        cpu.hl.low = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x6D: function(cpu) {
        cpu.hl.low = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x6E: function(cpu) {
        cpu.hl.low = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x6F: function(cpu) {
        cpu.hl.low = cpu.af.high;
        cpu.skip(1);
    },

    /*********************************************************
     *                          0x70-0x7F
     ********************************************************/

    // ld r, b
    0x70: function(cpu) {
        cpu.indirect_hl = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x71: function(cpu) {
        cpu.indirect_hl = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x72: function(cpu) {
        cpu.indirect_hl = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x73: function(cpu) {
        cpu.indirect_hl = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x74: function(cpu) {
        cpu.indirect_hl = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x75: function(cpu) {
        cpu.indirect_hl = cpu.hl.low;
        cpu.skip(1);
    },
    // HALT
    0x76: function(cpu) {
        cpu.isHalted = true;
    },
    // ld r, a
    0x77: function(cpu) {
        cpu.indirect_hl = cpu.af.high;
        cpu.skip(1);
    },

    // ld r, b
    0x78: function(cpu) {
        cpu.af.high = cpu.bc.high;
        cpu.skip(1);
    },
    // ld r, c
    0x79: function(cpu) {
        cpu.af.high = cpu.bc.low;
        cpu.skip(1);
    },
    // ld r, d
    0x7A: function(cpu) {
        cpu.af.high = cpu.de.high;
        cpu.skip(1);
    },
    // ld r, e
    0x7B: function(cpu) {
        cpu.af.high = cpu.de.low;
        cpu.skip(1);
    },
    // ld r, h
    0x7C: function(cpu) {
        cpu.af.high = cpu.hl.high;
        cpu.skip(1);
    },
    // ld r, l
    0x7D: function(cpu) {
        cpu.af.high = cpu.hl.low;
        cpu.skip(1);
    },
    // ld r, [hl]
    0x7E: function(cpu) {
        cpu.af.high = cpu.indirect_hl;
        cpu.skip(1);
    },
    // ld r, a
    0x7F: function(cpu) {
        cpu.af.high = cpu.af.high;
        cpu.skip(1);
    },

    /*********************************************************
     *                          0x80-0x8F
     ********************************************************/

    // add a, b
    0x80: function(cpu) {
        let n = cpu.bc.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, c
    0x81: function(cpu) {
        let n = cpu.bc.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, d
    0x82: function(cpu) {
        let n = cpu.de.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, e
    0x83: function(cpu) {
        let n = cpu.de.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, h
    0x84: function(cpu) {
        let n = cpu.hl.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, l
    0x85: function(cpu) {
        let n = cpu.hl.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, [hl]
    0x86: function(cpu) {
        let n = cpu.indirect_hl;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // add a, a
    0x87: function(cpu) {
        let n = cpu.af.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
        cpu.flags.n = false;

        cpu.af.high += n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },

    // adc a, b
    0x88: function(cpu) {
        let n = cpu.bc.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, c
    0x89: function(cpu) {
        let n = cpu.bc.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, d
    0x8A: function(cpu) {
        let n = cpu.de.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, e
    0x8B: function(cpu) {
        let n = cpu.de.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, h
    0x8C: function(cpu) {
        let n = cpu.hl.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, l
    0x8D: function(cpu) {
        let n = cpu.hl.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, [hl]
    0x8E: function(cpu) {
        let n = cpu.indirect_hl;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // adc a, a
    0x8F: function(cpu) {
        let n = cpu.af.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
        cpu.flags.n = false;

        cpu.af.high += n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },

    /*********************************************************
     *                          0x90-0x9F
     ********************************************************/

    // sub b
    0x90: function(cpu) {
        let n = cpu.bc.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub c
    0x91: function(cpu) {
        let n = cpu.bc.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub d
    0x92: function(cpu) {
        let n = cpu.de.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub e
    0x93: function(cpu) {
        let n = cpu.de.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub h
    0x94: function(cpu) {
        let n = cpu.hl.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub l
    0x95: function(cpu) {
        let n = cpu.hl.low;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub [hl]
    0x96: function(cpu) {
        let n = cpu.indirect_hl
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sub a
    0x97: function(cpu) {
        let n = cpu.af.high;
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
        cpu.flags.n = true;

        cpu.af.high -= n;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },

    // sbc a, b
    0x98: function(cpu) {
        let n = cpu.bc.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, c
    0x99: function(cpu) {
        let n = cpu.bc.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, d
    0x9A: function(cpu) {
        let n = cpu.de.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, e
    0x9B: function(cpu) {
        let n = cpu.de.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, h
    0x9C: function(cpu) {
        let n = cpu.hl.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, l
    0x9D: function(cpu) {
        let n = cpu.hl.low;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, [hl]
    0x9E: function(cpu) {
        let n = cpu.indirect_hl;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },
    // sbc a, a
    0x9F: function(cpu) {
        let n = cpu.af.high;
        let carry = Number(cpu.flags.c);
        cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
        cpu.flags.n = true;

        cpu.af.high -= n + carry;

        cpu.zero(cpu.af.high);
        cpu.skip(1);
    },

        /*********************************************************
         *                          0xA0-0xAF
         ********************************************************/

        // and b
        0xA0: function(cpu) {
            let n = cpu.bc.high;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and c
        0xA1: function(cpu) {
            let n = cpu.bc.low;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and d
        0xA2: function(cpu) {
            let n = cpu.de.high;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and e
        0xA3: function(cpu) {
            let n = cpu.de.low;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and h
        0xA4: function(cpu) {
            let n = cpu.hl.high;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and l
        0xA5: function(cpu) {
            let n = cpu.hl.low;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and [hl]
        0xA6: function(cpu) {
            let n = cpu.indirect_hl
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // and a
        0xA7: function(cpu) {
            let n = cpu.af.high;
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },

        // xor a, b
        0xA8: function(cpu) {
            let n = cpu.bc.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, c
        0xA9: function(cpu) {
            let n = cpu.bc.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, d
        0xAA: function(cpu) {
            let n = cpu.de.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, e
        0xAB: function(cpu) {
            let n = cpu.de.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, h
        0xAC: function(cpu) {
            let n = cpu.hl.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, l
        0xAD: function(cpu) {
            let n = cpu.hl.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, [hl]
        0xAE: function(cpu) {
            let n = cpu.indirect_hl;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // xor a, a
        0xAF: function(cpu) {
            let n = cpu.af.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high = 0;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },

        /*********************************************************
         *                          0xB0-0xBF
         ********************************************************/

        // or b
        0xB0: function(cpu) {
            let n = cpu.bc.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or c
        0xB1: function(cpu) {
            let n = cpu.bc.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;


            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or d
        0xB2: function(cpu) {
            let n = cpu.de.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or e
        0xB3: function(cpu) {
            let n = cpu.de.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or h
        0xB4: function(cpu) {
            let n = cpu.hl.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or l
        0xB5: function(cpu) {
            let n = cpu.hl.low;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or [hl]
        0xB6: function(cpu) {
            let n = cpu.indirect_hl
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },
        // or a
        0xB7: function(cpu) {
            let n = cpu.af.high;
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(1);
        },

        // cp a, b
        0xB8: function(cpu) {
            let n = cpu.bc.high;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, c
        0xB9: function(cpu) {
            let n = cpu.bc.low;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, d
        0xBA: function(cpu) {
            let n = cpu.de.high;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, e
        0xBB: function(cpu) {
            let n = cpu.de.low;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, h
        0xBC: function(cpu) {
            let n = cpu.hl.high;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, l
        0xBD: function(cpu) {
            let n = cpu.hl.low;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, [hl]
        0xBE: function(cpu) {
            let n = cpu.indirect_hl;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(1);
        },
        // cp a, a
        0xBF: function(cpu) {
            let n = cpu.af.high;
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.c = false;
            cpu.flags.n = true;
            cpu.flags.z = true;
            cpu.skip(1);
        },

        /*********************************************************
         *                          0xC0-0xCF
         ********************************************************/

        // ret nz
        0xC0: function(cpu) {
            if(cpu.flags.z == false) {
                cpu.pc.v = cpu.popStack();
                cpu.cycles = 24;
            } else {
                cpu.cycles = 8;
                cpu.skip(1);
            }
        },
        // pop bc
        0xC1: function(cpu) {
            cpu.bc.v = cpu.popStack();
            cpu.skip(1);
        },
        // jp nz, d16
        0xC2: function(cpu) {
            let d16 = cpu.readImmediate16();
            if(cpu.flags.z == false) {
                cpu.pc.v = d16;
                cpu.cycles = 12;
            } else {
                cpu.cycles = 12;
                cpu.skip(3);
            }
        },
        // jp d16
        0xC3: function(cpu) {
            let d16 = cpu.readImmediate16();
            cpu.pc.v = d16;
        },
        // call nz, d16
        0xC4: function(cpu) {
            let d16 = cpu.readImmediate16();

            cpu.skip(3);
            if(cpu.flags.z == false) {
                cpu.pushStack(cpu.pc.v);
                cpu.pc.v = d16;
                cpu.cycles = 24;
            } else {
                cpu.cycles = 12;
            }
        },
        // push bc
        0xC5: function(cpu) {
            cpu.pushStack(cpu.bc.v);
            cpu.skip(1);
        },
        // add a, n
        0xC6: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.flags.hc = false;
            cpu.carry8(cpu.af.high, n, Arithmetic.ADD);
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADD);
            cpu.flags.n = false;

            cpu.af.high += n;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 00h
        0xC7: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x00;
        },

        // ret z
        0xC8: function(cpu) {
            if(cpu.flags.z == true) {
                cpu.pc.v = cpu.popStack();
                cpu.cycles = 20;
            } else {
                cpu.cycles = 8;
                cpu.skip(1);
            }
        },
        // ret
        0xC9: function(cpu) {
            cpu.pc.v = cpu.popStack();
        },
        // jp z, d16
        0xCA: function(cpu) {
            let d16 = cpu.readImmediate16();
            if(cpu.flags.z == true) {
                cpu.pc.v = d16;
                cpu.cycles = 16;
            } else {
                cpu.cycles = 12;
                cpu.skip(3);
            }
        },
        // CB prefix
        0xCB: function(cpu) {
            let opcode = cpu.readImmediate8();
            let x = (opcode & 0b11000000) >> 6;
            let y = ((opcode &0b00111000) >> 3) & 0x07;
            let z = (opcode & 0b00000111)
            cpu.cycles = 8;

            if(x == 1) {
                // bit y, r[z]
                cpu.flags.n = false;
                cpu.flags.hc = true;
                opBIT_CB[z](cpu, y);
            } else if(x == 2) {
                // res y, r[z]
                opRES_CB[z](cpu, y);
            } else if(x == 3) {
                // set y, r[z]
                opSET_CB[z](cpu, y);
            } else if(opcode < 0x40 && opTable_CB[opcode] != undefined) {
                cpu.flags.n = false;
                cpu.flags.hc = false;
                opTable_CB[opcode](cpu);
            } else {
                illegalOpcode(opcode, cpu, true);
                return;
            }

            cpu.skip(2);
        },
        // call z, d16
        0xCC: function(cpu) {
            let d16 = cpu.readImmediate16();

            cpu.skip(3);
            if(cpu.flags.z == true)
            {
                cpu.pushStack(cpu.pc.v);
                cpu.pc.v = d16;
                cpu.cycles = 24;
            } else {
                cpu.cycles = 12;
            }
        },
        // call d16
        0xCD: function(cpu) {
            cpu.pushStack(cpu.pc.v + 3);
            cpu.pc.v = cpu.readImmediate16();
        },
        // adc a, n
        0xCE: function(cpu) {
            let n = cpu.readImmediate8();
            let carry = Number(cpu.flags.c);
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.ADC);
            cpu.carry8(cpu.af.high, n, Arithmetic.ADC);
            cpu.flags.n = false;

            cpu.af.high += n + carry;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 08h
        0xCF: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x08;
        },

        /*********************************************************
         *                          0xD0-0xDF
         ********************************************************/

        // ret nc
        0xD0: function(cpu) {
            if(cpu.flags.c == false) {
                cpu.pc.v = cpu.popStack();
                cpu.cycles = 20;
            } else {
                cpu.cycles = 8;
                cpu.skip(1);
            }
        },
        // pop de
        0xD1: function(cpu) {
            cpu.de.v = cpu.popStack();
            cpu.skip(1);
        },
        // jp nc, d16
        0xD2: function(cpu) {
            let d16 = cpu.readImmediate16();
            if(cpu.flags.c == false) {
                cpu.pc.v = d16;
                cpu.cycles = 16;
            } else {
                cpu.cycles = 12;
                cpu.skip(3);
            }
        },

        // call nc, d16
        0xD4: function(cpu) {
            let d16 = cpu.readImmediate16();

            cpu.skip(3);
            if(cpu.flags.c == false) {
                cpu.pushStack(cpu.pc.v);
                cpu.pc.v = d16;
                cpu.cycles = 24;
            } else {
                cpu.cycles = 12;
            }
        },
        // push de
        0xD5: function(cpu) {
            cpu.pushStack(cpu.de.v);
            cpu.skip(1);
        },
        // sub a, n
        0xD6: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;

            cpu.af.high -= n;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 10h
        0xD7: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x10;
        },

        // ret c
        0xD8: function(cpu) {
            if(cpu.flags.c == true) {
                cpu.pc.v = cpu.popStack();
                cpu.cycles = 20;
            } else {
                cpu.cycles = 8;
                cpu.skip(1);
            }
        },
        // reti
        0xD9: function(cpu) {
            cpu.pc.v = cpu.popStack();
            cpu.shouldEI = true;
        },
        // jp c, d16
        0xDA: function(cpu) {
            let d16 = cpu.readImmediate16();
            if(cpu.flags.c == true) {
                cpu.pc.v = d16;
                cpu.cycles = 16;
            } else {
                cpu.cycles = 12;
                cpu.skip(3);
            }
        },
        // call c, d16
        0xDC: function(cpu) {
            let d16 = cpu.readImmediate16();

            cpu.skip(3);
            if(cpu.flags.c) {
                cpu.pushStack(cpu.pc.v);
                cpu.pc.v = d16;
                cpu.cycles = 24;
            } else {
                cpu.cycles = 12;
            }
        },
        // sbc a, n
        0xDE: function(cpu) {
            let n = cpu.readImmediate8();
            let carry = Number(cpu.flags.c);
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SBC);
            cpu.carry8(cpu.af.high, n, Arithmetic.SBC);
            cpu.flags.n = true;

            // af - n - c
            cpu.af.high -= n + carry;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 18h
        0xDF: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x18;
        },

        // ldh (ff00+n), a
        0xE0: function(cpu) {
            cpu.write8(0xFF00 + cpu.readImmediate8(), cpu.af.high);
            cpu.skip(2);
        },
        // pop hl
        0xE1: function(cpu) {
            cpu.hl.v = cpu.popStack();
            cpu.skip(1);
        },
        // ldh (ff00+c), a
        0xE2: function(cpu) {
            cpu.write8(0xFF00 + cpu.bc.low, cpu.af.high);
            cpu.skip(1);
        },
        // push hl
        0xE5: function(cpu) {
            cpu.pushStack(cpu.hl.v);
            cpu.skip(1);
        },
        // and n
        0xE6: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.flags.hc = true;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high &= n;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 20h
        0xE7: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x20;
        },
        // add sp, n
        0xE8: function(cpu) {
            let n = UInt16.toSigned(cpu.readImmediate8());
            let result = (cpu.sp.v + n) & 0xFFFF;

            cpu.flags.c = ((cpu.sp.v ^ n ^ result) & 0x100) == 0x100;
            cpu.halfCarry8(cpu.sp.v, n, Arithmetic.ADD);
            cpu.flags.n = false;
            cpu.flags.z = false;

            cpu.sp.v = result;
            cpu.skip(2);
        },
        // jp hl
        0xE9: function(cpu) {
            cpu.pc.v = cpu.hl.v
        },
        // xor n
        0xEE: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high ^= n;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // ld (nn), a
        0xEA: function(cpu) {
            cpu.write8(cpu.readImmediate16(), cpu.af.high);
            cpu.skip(3);
        },
        // rst 28h
        0xEF: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x28;
        },


        // ldh a, (ff00+n)
        0xF0: function(cpu) {
            cpu.af.high = cpu.read8(0xFF00 + cpu.readImmediate8());
            cpu.skip(2);
        },
        // pop af
        0xF1: function(cpu) {
            let af = cpu.popStack();
            let c = Boolean(af & 16)
            let hc= Boolean(af & 32)
            let n = Boolean(af & 64)
            let z = Boolean(af & 128)
            cpu.flags.c = c;
            cpu.flags.hc = hc;
            cpu.flags.n = n;
            cpu.flags.z = z;
            cpu.af.high = af >> 8;
            cpu.skip(1);
        },
        // ld a, [ff00+c]
        0xF2: function(cpu) {
            let n = cpu.read8(0xFF00 + cpu.bc.low);
            cpu.af.high = n;
            cpu.skip(1);
        },
        // di
        0xF3: function(cpu) {
            cpu.shouldDI = true;
            cpu.skip(1);
        },
        // push af
        0xF5: function(cpu) {
            let c = Number(cpu.flags.c) << 4
            let hc= Number(cpu.flags.hc) << 5
            let n = Number(cpu.flags.n) << 6
            let z = Number(cpu.flags.z) << 7
            let f = z | n | hc | c;
            cpu.pushStack(UInt16.makeWord(cpu.af.high, f));
            cpu.skip(1);
        },
        // or n
        0xF6: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.flags.hc = false;
            cpu.flags.c = false;
            cpu.flags.n = false;

            cpu.af.high |= n;

            cpu.zero(cpu.af.high);
            cpu.skip(2);
        },
        // rst 30h
        0xF7: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x0030;
        },
        // ld hl, sp+n
        0xF8: function(cpu) {
            let n = UInt16.toSigned(cpu.readImmediate8());
            let result = (cpu.sp.v + n) & 0xFFFF;

            cpu.flags.c = ((cpu.sp.v ^ n ^ result) & 0x100) == 0x100;
            cpu.flags.hc = ((cpu.sp.v ^ n ^ result) & 0x10) == 0x10;
            cpu.flags.n = false;
            cpu.flags.z = false;

            cpu.hl.v = result;
            cpu.skip(2);
        },
        // ld sp, hl
        0xF9: function(cpu) {
            cpu.sp.v = cpu.hl.v;
            cpu.skip(1);
        },
        // ld a, (nn)
        0xFA: function(cpu) {
            cpu.af.high = cpu.read8(cpu.readImmediate16());
            cpu.skip(3);
        },
        // ei
        0xFB: function(cpu) {
            cpu.shouldEI = true;
            cpu.skip(1);
        },
        // cp n
        0xFE: function(cpu) {
            let n = cpu.readImmediate8();
            cpu.halfCarry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.carry8(cpu.af.high, n, Arithmetic.SUB);
            cpu.flags.n = true;
            cpu.zero(cpu.af.high - n);
            cpu.skip(2);
        },
        // rst 38h
        0xFF: function(cpu) {
            cpu.pushStack(cpu.pc.v + 1);
            cpu.pc.v = 0x0038;
        }
};
