

var opBIT_CB = {
    // bit y, b 
    0x00: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.bc.high, bit));
    },
    // bit y, c
    0x01: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.bc.low, bit));
    },
    // bit y, d
    0x02: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.de.high, bit));
    },
    // bit y, e
    0x03: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.de.low, bit));
    },
    // bit y, h
    0x04: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.hl.high, bit));
    },
    // bit y, l
    0x05: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.hl.low, bit));
    },
    // bit y, [hl]
    0x06: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.indirect_hl, bit));
    },
    // bit y, a
    0x07: function(cpu, bit) {
        cpu.flags.z = !Boolean(UInt8.getBit(cpu.af.high, bit));
    },
}

var opRES_CB = {
    // res y, b 
    0x00: function(cpu, bit) {
        cpu.bc.high = UInt8.clearBit(cpu.bc.high, bit);
    },
    // res y, c
    0x01: function(cpu, bit) {
        cpu.bc.low = UInt8.clearBit(cpu.bc.low, bit);
    },
    // res y, d
    0x02: function(cpu, bit) {
        cpu.de.high = UInt8.clearBit(cpu.de.high, bit);
    },
    // res y, e
    0x03: function(cpu, bit) {
        cpu.de.low = UInt8.clearBit(cpu.de.low, bit);
    },
    // res y, h
    0x04: function(cpu, bit) {
        cpu.hl.high = UInt8.clearBit(cpu.hl.high, bit);
    },
    // res y, l
    0x05: function(cpu, bit) {
        cpu.hl.low = UInt8.clearBit(cpu.hl.low, bit);
    },
    // res y, [hl]
    0x06: function(cpu, bit) {
        cpu.indirect_hl = UInt8.clearBit(cpu.indirect_hl, bit);
    },
    // res y, a
    0x07: function(cpu, bit) {
        cpu.af.high = UInt8.clearBit(cpu.af.high, bit);
    },
}



// neg & half carry flags are bit logically 
var opTable_CB = {
    // rlc b
    0x00: function(cpu) {
        let byte = cpu.bc.high;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.bc.high = byte;

        cpu.zero(byte);
    },
    // rlc c
    0x01: function(cpu) {
        let byte = cpu.bc.low;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.bc.low = byte;

        cpu.zero(byte);
    },
    // rlc d
    0x02: function(cpu) {
        let byte = cpu.de.high;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.de.high = byte;

        cpu.zero(byte);
    },
    // rlc e
    0x03: function(cpu) {
        let byte = cpu.de.low;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.de.low = byte;

        cpu.zero(byte);
    },
    // rlc h
    0x04: function(cpu) {
        let byte = cpu.hl.high;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.hl.high = byte;

        cpu.zero(byte);
    },
    // rlc l
    0x05: function(cpu) {
        let byte = cpu.hl.low;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.hl.low = byte;

        cpu.zero(byte);
    },
    // rlc [hl]
    0x06: function(cpu) {
        let byte = cpu.indirect_hl;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.indirect_hl = byte;

        cpu.zero(byte);
        cpu.cycles += 8;
    },
    // rlc a
    0x07: function(cpu) {
        let byte = cpu.af.high;
        cpu.flags.c = Boolean(byte & 0x80);

        byte <<= 1;
        byte |= Number(cpu.flags.c);
        cpu.af.high = byte;

        cpu.zero(byte);
    },
    // rrc b
    0x08: function(cpu) {
        let byte = cpu.bc.high;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.bc.high = byte;

        cpu.zero(byte);
    },
    // rrc c
    0x09: function(cpu) {
        let byte = cpu.bc.low;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.bc.low = byte;

        cpu.zero(byte);
    },
    // rrc d
    0x0A: function(cpu) {
        let byte = cpu.de.high;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.de.high = byte;

        cpu.zero(byte);
    },
    // rrc e
    0x0B: function(cpu) {
        let byte = cpu.de.low;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.de.low = byte;

        cpu.zero(byte);
    },
    // rrc h
    0x0C: function(cpu) {
        let byte = cpu.hl.high;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.hl.high = byte;

        cpu.zero(byte);
    },
    // rrc l
    0x0D: function(cpu) {
        let byte = cpu.hl.low;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.hl.low = byte;

        cpu.zero(byte);
    },
    // rrc [hl]
    0x0E: function(cpu) {
        let byte = cpu.indirect_hl;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.indirect_hl = byte;

        cpu.zero(byte);
        cpu.cycles += 8;
    },
    // rrc a
    0x0F: function(cpu) {
        let byte = cpu.af.high;
        cpu.flags.c = Boolean(byte & 0x01);

        byte >>= 1;
        byte |= Number(cpu.flags.c) << 7;
        cpu.af.high = byte;

        cpu.zero(byte);
    },
    // rl b
    0x10: function(cpu) {
        let c = Boolean(cpu.bc.high & 0x80);
        cpu.bc.high <<= 1;
        cpu.bc.high |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.bc.high);
    },
    // rl c
    0x11: function(cpu) {
        let c = Boolean(cpu.bc.low & 0x80);
        cpu.bc.low <<= 1;
        cpu.bc.low |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.bc.low);
    },
    // rl d
    0x12: function(cpu) {
        let c = Boolean(cpu.de.high & 0x80);
        cpu.de.high <<= 1;
        cpu.de.high |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.de.high);
    },
    // rl e
    0x13: function(cpu) {
        let c = Boolean(cpu.de.low & 0x80);
        cpu.de.low <<= 1;
        cpu.de.low |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.de.low);
    },
    // rl h
    0x14: function(cpu) {
        let c = Boolean(cpu.hl.high & 0x80);
        cpu.hl.high <<= 1;
        cpu.hl.high |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.hl.high);
    },
    // rl l
    0x15: function(cpu) {
        let c = Boolean(cpu.hl.low & 0x80);
        cpu.hl.low <<= 1;
        cpu.hl.low |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.hl.low);
    },
    // rl [hl]
    0x16: function(cpu) {
        let c = Boolean(cpu.indirect_hl & 0x80);
        cpu.indirect_hl <<= 1;
        cpu.indirect_hl |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.indirect_hl);
        cpu.cycles += 8;
    },
    // rl a
    0x17: function(cpu) {
        let c = Boolean(cpu.af.high & 0x80);
        cpu.af.high <<= 1;
        cpu.af.high |= Number(cpu.flags.c);

        cpu.flags.c = c;
        cpu.zero(cpu.af.high);
        cpu.cycles += 8;
    },
    // rr b
    0x18: function(cpu) {
        let c = Boolean(cpu.bc.high & 0x01);
        cpu.bc.high >>= 1;
        cpu.bc.high |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.bc.high);
    },
    // rr c
    0x19: function(cpu) {
        let c = Boolean(cpu.bc.low & 0x01);
        cpu.bc.low >>= 1;
        cpu.bc.low |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.bc.low);
    },
    // rr d
    0x1A: function(cpu) {
        let c = Boolean(cpu.de.high & 0x01);
        cpu.de.high >>= 1;
        cpu.de.high |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.de.high);
    },
    // rr e
    0x1B: function(cpu) {
        let c = Boolean(cpu.de.low & 0x01);
        cpu.de.low >>= 1;
        cpu.de.low |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.de.low);
    },
    // rr h
    0x1C: function(cpu) {
        let c = Boolean(cpu.hl.high & 0x01);
        cpu.hl.high >>= 1;
        cpu.hl.high |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.hl.high);
    },
    // rr l
    0x1D: function(cpu) {
        let c = Boolean(cpu.hl.low & 0x01);
        cpu.hl.low >>= 1;
        cpu.hl.low |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.hl.low);
    },
    // rr [hl]
    0x1E: function(cpu) {
        let c = Boolean(cpu.indirect_hl & 0x01);
        cpu.indirect_hl >>= 1;
        cpu.indirect_hl |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.indirect_hl);
        cpu.cycles += 8;
    },
    // rr a
    0x1F: function(cpu) {
        let c = Boolean(cpu.af.high & 0x01);
        cpu.af.high >>= 1;
        cpu.af.high |= Number(cpu.flags.c) << 7;

        cpu.flags.c = c;
        cpu.zero(cpu.af.high);
    },
    // sla b
    0x20: function(cpu) {
        cpu.flags.c = Boolean(cpu.bc.high & 0x80);
        cpu.bc.high <<= 1;

        cpu.zero(cpu.bc.high);
    },
    // sla c
    0x21: function(cpu) {
        cpu.flags.c = Boolean(cpu.bc.low & 0x80);
        cpu.bc.low <<= 1;

        cpu.zero(cpu.bc.low);
    },
    // sla d
    0x22: function(cpu) {
        cpu.flags.c = Boolean(cpu.de.high & 0x80);
        cpu.de.high <<= 1;

        cpu.zero(cpu.de.high);
    },
    // sla e
    0x23: function(cpu) {
        cpu.flags.c = Boolean(cpu.de.low & 0x80);
        cpu.de.low <<= 1;

        cpu.zero(cpu.de.low);
    },
    // sla h
    0x24: function(cpu) {
        cpu.flags.c = Boolean(cpu.hl.high & 0x80);
        cpu.hl.high <<= 1;

        cpu.zero(cpu.hl.high);
    },
    // sla l
    0x25: function(cpu) {
        cpu.flags.c = Boolean(cpu.hl.low & 0x80);
        cpu.hl.low <<= 1;

        cpu.zero(cpu.hl.low);
    },
    // sla [hl]
    0x26: function(cpu) {
        cpu.flags.c = Boolean(cpu.indirect_hl & 0x80);
        cpu.indirect_hl <<= 1;

        cpu.zero(cpu.indirect_hl);
        cpu.cycles += 8;
    },
    // sla a
    0x27: function(cpu) {
        cpu.flags.c = Boolean(cpu.af.high & 0x80);
        cpu.af.high <<= 1;

        cpu.zero(cpu.af.high);
    },
    // sra b
    0x28: function(cpu) {
        let bit7 = cpu.bc.high & 0x80;
        cpu.flags.c = Boolean(cpu.bc.high & 0x01);
        cpu.bc.high >>= 1;
        cpu.bc.high |= bit7;

        cpu.zero(cpu.bc.high);
    },
    // sra c
    0x29: function(cpu) {
        let bit7 = cpu.bc.low & 0x80;
        cpu.flags.c = Boolean(cpu.bc.low & 0x01);
        cpu.bc.low >>= 1;
        cpu.bc.low |= bit7;

        cpu.zero(cpu.bc.low);
    },
    // sra d
    0x2A: function(cpu) {
        let bit7 = cpu.de.high & 0x80;
        cpu.flags.c = Boolean(cpu.de.high & 0x01);
        cpu.de.high >>= 1;
        cpu.de.high |= bit7;

        cpu.zero(cpu.de.high);
    },
    // sra ede
    0x2B: function(cpu) {
        let bit7 = cpu.de.low & 0x80;
        cpu.flags.c = Boolean(cpu.de.low & 0x01);
        cpu.de.low >>= 1;
        cpu.de.low |= bit7;

        cpu.zero(cpu.de.low);
    },
    // sra h
    0x2C: function(cpu) {
        let bit7 = cpu.hl.high & 0x80;
        cpu.flags.c = Boolean(cpu.hl.high & 0x01);
        cpu.hl.high >>= 1;
        cpu.hl.high |= bit7;

        cpu.zero(cpu.hl.high);
    },
    // sra l
    0x2D: function(cpu) {
        let bit7 = cpu.hl.low & 0x80;
        cpu.flags.c = Boolean(cpu.hl.low & 0x01);
        cpu.hl.low >>= 1;
        cpu.hl.low |= bit7;

        cpu.zero(cpu.hl.low);
    },
    // sra [hl]
    0x2E: function(cpu) {
        let bit7 = cpu.indirect_hl & 0x80;
        cpu.flags.c = Boolean(cpu.indirect_hl & 0x01);
        cpu.indirect_hl >>= 1;
        cpu.indirect_hl |= bit7;

        cpu.zero(cpu.indirect_hl);
        cpu.cycles += 8;
    },
    // sra a
    0x2F: function(cpu) {
        let bit7 = cpu.af.high & 0x80;
        cpu.flags.c = Boolean(cpu.af.high & 0x01);
        cpu.af.high >>= 1;
        cpu.af.high |= bit7;

        cpu.zero(cpu.af.high);
    },
    // swap b
    0x30: function(cpu) {
        let byte = cpu.bc.high;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.bc.high = byte;
    }, 
    // swap c
    0x31: function(cpu) {
        let byte = cpu.bc.low;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.bc.low = byte;
    }, 
    // swap d
    0x32: function(cpu) {
        let byte = cpu.de.high;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.de.high = byte;
    }, 
    // swap e
    0x33: function(cpu) {
        let byte = cpu.de.low;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.de.low = byte;
    }, 
    // swap h
    0x34: function(cpu) {
        let byte = cpu.hl.high;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.hl.high = byte;
    }, 
    // swap l
    0x35: function(cpu) {
        let byte = cpu.hl.low;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.hl.low = byte;
    }, 
    // swap [hl]
    0x36: function(cpu) {
        let byte = cpu.indirect_hl;

        let low = byte & 0xF;
        let high = (byte & 0xF0) >> 4;
        byte = (low << 4) | high;
        cpu.zero(byte);
        cpu.flags.c = false;

        cpu.indirect_hl = byte;
        cpu.cycles += 8;
    }, 
    // swap a
    0x37: function(cpu) {
        let low = cpu.af.high & 0xF;
        let high = (cpu.af.high & 0xF0) >> 4;
        cpu.af.high = (low << 4) | high;
        cpu.zero(cpu.af.high);
        cpu.flags.c = false;
    },
    // srl b
    0x38: function(cpu) {
        cpu.flags.c = Boolean(cpu.bc.high & 1);
        cpu.bc.high >>= 1;
        cpu.zero(cpu.bc.high);
    },
    // srl c
    0x39: function(cpu) {
        cpu.flags.c = Boolean(cpu.bc.low & 1);
        cpu.bc.low >>= 1;
        cpu.zero(cpu.bc.low);
    },
    // srl d
    0x3A: function(cpu) {
        cpu.flags.c = Boolean(cpu.de.high & 1);
        cpu.de.high >>= 1;
        cpu.zero(cpu.de.high);
    },
    // srl e
    0x3B: function(cpu) {
        cpu.flags.c = Boolean(cpu.de.low & 1);
        cpu.de.low >>= 1;
        cpu.zero(cpu.de.low);
    },
    // srl h
    0x3C: function(cpu) {
        cpu.flags.c = Boolean(cpu.hl.high & 1);
        cpu.hl.high >>= 1;
        cpu.zero(cpu.hl.high);
    },
    // srl l
    0x3D: function(cpu) {
        cpu.flags.c = Boolean(cpu.hl.low & 1);
        cpu.hl.low >>= 1;
        cpu.zero(cpu.hl.low);
    },
    // srl [hl]
    0x3E: function(cpu) {
        cpu.flags.c = Boolean(cpu.indirect_hl & 1);
        cpu.indirect_hl >>= 1;
        cpu.zero(cpu.indirect_hl);
    },
    // srl a
    0x3F: function(cpu) {
        cpu.flags.c = Boolean(cpu.af.high & 1);
        cpu.af.high >>= 1;
        cpu.zero(cpu.af.high);
    },
}