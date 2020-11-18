"use strict";

const Arithmetic = {
    ADD: 'add',
    ADC: 'adc',// only supports 8-bit operations
    SUB: 'sub',
    SBC: 'sbc' // only supports 8-bit operations
}

/**
 * Raw value is the bit position of the interrupt
 */
const InterruptType = {
    vBlank: 0,
    lcd: 1,
    timer: 2,
    serial: 3,
    joypad: 4
}

const MemoryControllerText = {
    0x00: "ROM ONLY",
    0x01: "MBC1",
    0x02: "MBC1+RAM",
    0x03: "MBC1+RAM+BATTERY",
    0x05: "MBC2",
    0x06: "MBC2+BATTERY",
    0x08: "ROM+RAM",
    0x08: "ROM+RAM+BATTERY",
}

const MBCType = {
    NONE: 0,
    MBC_1: 1,
    MBC_2: 2,
    MBC_3: 3,
    MBC_5: 5,

    RAM: 128, // this has to be a unique bit
}

/**
 * v = mem[0x147] (the ROMs MBC type)
 * @returns a combination of MBCType
 */
function getMBCType(v) {
    switch(v) {
        case 0x00: return MBCType.NONE;
        case 0x01:
        case 0x02:
            return MBCType.MBC_1;
        case 0x03:
        case 0x1B:
            return MBCType.MBC_1 | MBCType.RAM;
        case 0x06:
            return MBCType.MBC_2 | MBCType.RAM;
        default:
            alert("Unsupported MBC:" + v.toString(16));
    }

    return MBCType.NONE;
}

const opcodeCycles = [
//  0    1   2   3   4   5   6   7   8   9   A  B   C   D  E   F
    4,  12,  8,  8,  4,  4,  8,  4, 20,  8,  8, 8,  4,  4, 8,  4, // 0
    4,  12,  8,  8,  4,  4,  8,  4, 12,  8,  8, 8,  4,  4, 8,  4, // 1
    4,  12,  8,  8,  4,  4,  8,  4, 12,  8,  8, 8,  4,  4, 8,  4, // 2
    12, 12,  8,  8, 12, 12, 12,  4, 12,  8,  8, 8,  4,  4, 8,  4, // 3
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // 4
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // 5
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // 6
    8,   8,  8,  8,  8,  8,  4,  8,  4,  4,  4, 4,  4,  4, 8,  4, // 7
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // 8
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // 9
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // A
    4,   4,  4,  4,  4,  4,  8,  4,  4,  4,  4, 4,  4,  4, 8,  4, // B
    20, 12, 16, 16, 24, 16,  8, 16, 20, 16, 16, 4, 24, 24, 8, 16, // C
    20, 12, 16,  0, 24, 16,  8, 16, 20, 16, 16, 0, 24, 0, 8, 16, // D
    12, 12, 8,   0,  0, 16,  8, 16, 16,  4, 16, 0,  0,  0, 8, 16, // E
    12, 12, 8,   4,  0, 16,  8, 16, 12,  8, 16, 4,  0,  0, 8, 16, // F
];


class CPU {
    constructor() {
        this.timer = null;

        this.timerRegs = new Timer();
        this.ppu = new PPU();
        this.renderer = new Renderer();
        this.cycles = 0;
        this.mbc = MBCType.NONE;
        this.mbcHandler = null;
        
        
        this.af = new UInt16();
        this.bc = new UInt16();
        this.de = new UInt16();
        this.hl = new UInt16();
        
        this.pc = new UInt16(0x100);
        this.sp = new UInt16(0xFFFE);
        
        this.flags = {
            z: false,
            c: false,
            hc:false,
            n: false
        }
        
        this.debug = false;
        
        this.isHalted = false;
        this.interrupt_master = false;
        this.interrupt_enable = 0;
        this.interrupt_flag = 0;

        this.shouldEI = false;
        this.shouldDI = false;

        this.mem = {
            rom: new Uint8Array(0x8000), // ROM 0000-7FFF
            vram: new Uint8Array(0x2000), // RAM 8000-9FFF
            cram: new Uint8Array(0x2000), // RAM A000-BFFF (cart RAM)
            wram: new Uint8Array(0x2000), // RAM C000-CFFF & D000-DFFF (working RAM) (mirror RAM = E000-FDFF)
            oam : new Uint8Array(0x00A0), // OAM RAM FE00-FE9F
            hram: new Uint8Array(0x0100) // HRAM FF00-FFFF
        };

        
    }
    
    /**
     * @returns {UInt8} byte
     */
    get indirect_hl() {
        return this.read8(this.hl.v);
    }

    /**
     * Sets [hl] to v
     * @param {UInt8} v
     */
    set indirect_hl(v) {
        this.write8(this.hl.v, v & 0xFF);
    }

    /**
     * resets specific values
     */
    initialize() {
        this.pc.v = 0x100;
        this.sp.v = 0xFFFE;
        this.af.v = 0;
        this.bc.v = 0;
        this.de.v = 0;
        this.hl.v = 0;
        this.ppu.regs.stat = 0x85;
        this.ppu.regs.lcdc = 0x91;
        this.mbcHandler = null;
        this.interrupt_master = true;
        this.isHalted = false;
        for(let i = 0xFF00; i <= 0xFFFF; i++)
            this.write8(i, 0);
        
    }


    /**
     * Requests an interrupt
     * @param {InterruptType} type interrupt type to request
     */
    requestInterrupt(type) {
        this.interrupt_flag = UInt8.setBit(this.interrupt_flag, type);
    }

    serviceInterrupts() {
        let handlerAddress = [0x40, 0x48, 0x50, 0x58, 0x60];
        let fired = this.interrupt_flag & this.interrupt_enable;
        
        if(this.interrupt_master == true && fired != 0 ) {
            for(let i = 0; i < 5; i++) {
                // if both bits are set
                if(UInt8.getBit(fired, i) == 1)
                {
                    // if we are HALTed
                    if(this.isHalted == true) {
                        this.isHalted = false;
                        this.pc.v++;
                    }

                    this.interrupt_flag = UInt8.clearBit(this.interrupt_flag, i);
                    this.interrupt_master = false;
                    this.pushStack(this.pc.v);
                    this.pc.v = handlerAddress[i];
                    this.cycles += 12;
                }
            }

        }
    }

    /**
     * Performs a DMA to OAM transfer
     * @param {UInt8} high MSB of the DMA location
     */
    DMATransfer(high) {
        for(let i = 0; i < 160; i++) {
            this.write8(i + 0xFE00, this.read8(UInt16.makeWord(high, i)));
        }
    }
    
    /**
     * Writes a byte to an address in memory
     * @param {UInt16} address 
     * @param {UInt8} byte
     */
    write8(address, byte) {
        byte &= 255;

        if(this.mbcHandler)
        {
            let shouldWrite = this.mbcHandler.write8(this, address, byte);
            if(!shouldWrite)
                return;
        }

        if(address < 0x8000) {
            //this.mem.rom[address] = byte;
        } else if(address < 0xA000) {
            this.mem.vram[address - 0x8000] = byte;
        } else if(address < 0xC000) {
            this.mem.cram[address - 0xA000] = byte;
        } else if(address < 0xE000) {
            this.mem.wram[address - 0xC000] = byte;
        } else if(address < 0xFE00) {
            // mirror WRAM
            this.mem.wram[address - 0xE000] = byte;
        } else if(address < 0xFEA0) {
            this.mem.oam[address - 0xFE00] = byte;
        } else if(address <= 0xFEFF) {
            // do nothing
            return;
        } else if(address == 0xFF00) {
            this.mem.hram[0] = byte & 0b00110000;
        } else if(address == 0xFF04) {
            this.timerRegs.regs.div = byte;
        } else if(address == 0xFF05) {
            this.timerRegs.regs.tima = byte;
        } else if(address == 0xFF06) {
            this.timerRegs.regs.tma = byte;
            if(this.timerRegs.regs.tma & 0x3 != byte & 0x3)
                this.timerRegs.setClockFrequency();
        } else if(address == 0xFF07) {
            this.timerRegs.regs.tac = byte;
        } else if(address == 0xFF0F) {
            this.interrupt_flag = byte;
        } else if(address == 0xFF40) {
            this.ppu.regs.lcdc = byte;
            // if(this.debug==true)
                // console.log("PC: 0x"+this.pc.v.toString(16)+" | AF: 0x"+this.af.v.toString(16)+" | opcode: 0x"+this.read8(this.pc.v).toString(16))
        } else if(address == 0xFF41) {
            this.ppu.regs.stat = byte & 0xF8;
        } else if(address == 0xFF42) {
            this.ppu.regs.scy = byte;
        } else if(address == 0xFF43) {
            this.ppu.regs.scx = byte;
        } else if(address == 0xFF44) {
            return; // scanline is read only
        } else if(address == 0xFF45) {
            this.ppu.regs.syc = byte;
        } else if(address == 0xFF46) {
            this.ppu.regs.dma = byte;
            this.DMATransfer(byte);
        } else if(address == 0xFF47) {
            this.ppu.regs.bgp = byte;
            this.ppu.bgPal = [
                palette[(byte & 0b00000011)],
                palette[(byte & 0b00001100) >> 2],
                palette[(byte & 0b00110000) >> 4],
                palette[(byte & 0b11000000) >> 6],
            ]
        } else if(address == 0xFF48) {
            this.ppu.regs.obj0 = byte;
            this.ppu.obj0Pal = [
                palette[(byte & 0b00000011)],
                palette[(byte & 0b00001100) >> 2],
                palette[(byte & 0b00110000) >> 4],
                palette[(byte & 0b11000000) >> 6],
            ]
        } else if(address == 0xFF49) {
            this.ppu.regs.obj1 = byte;
            this.ppu.obj1Pal = [
                palette[(byte & 0b00000011)],
                palette[(byte & 0b00001100) >> 2],
                palette[(byte & 0b00110000) >> 4],
                palette[(byte & 0b11000000) >> 6],
            ]
        } else if(address == 0xFF4A) {
            this.ppu.regs.wy = byte;
        } else if(address == 0xFF4B) {
            this.ppu.regs.wx = byte;
        } else if(address == 0xFFFF) {
            this.interrupt_enable = byte;
        } else if(address < 0xFFFF) {
            // if(address == 0xff80 && byte == 0xff)
                // illegalOpcode(-1, this, false);
            this.mem.hram[address - 0xFF00] = byte;
        } else {
            console.log("ERROR WRITING FROM ADDRESS: 0x" + address.toString(16));
        }

    };

    /**
     * Loads the rom into memory
     * @param {Uint8Array} array 8-bit ROM
     */
    loadROM(array) {
        this.mem.rom = array; // this array should be trimmed to only be 0x8000 bytse long
        this.mbc = getMBCType(this.mem.rom[0x0147]);
        if((this.mbc & MBCType.MBC_1) != 0) {
            this.mbcHandler = new MBC1(array);
        } else if((this.mbc & MBCType.MBC_2) != 0) {
            this.mbcHandler = new MBC1(array);
            console.log(this.mbcHandler);
        } else if(this.mbc != MBCType.NONE)
            alert("Unknown MBC:" + this.mbc);

        console.log("MBC Type:" + this.mem.rom[0x0147]);
    }

    /**
     * Writes two bytes to memory
     * @param {Uint16} address 
     * @param {UInt16} word 
     */
    write16(address, word) {
        this.write8(address, word & 0xFF);
        this.write8(address + 1, word >> 8);
    }

    /**
     * Reads the word following the current PC
     * @returns {UInt16} word
     */
    readImmediate16() {
        return this.read16(this.pc.v + 1);
    }

    /**
     * Reads the byte following the current PC
     * @returns {UInt8} byte
     */
    readImmediate8() {
        return this.read8(this.pc.v + 1);
    }

    /**
     * Read a byte from an address from memory
     * @param {UInt16} address 
     * @returns {UInt8} byte
     */
    read8(address) {
        if(this.mbcHandler)
        {
            // if our address was read properly by our MBC, return it
            //  or continue searching
            let v = this.mbcHandler.read8(this, address);
            if(v != null)
            {
                return v;
            }
        }

        if(address < 0x8000) {
            return this.mem.rom[address];
        } else if(address < 0xA000) {
            return this.mem.vram[address - 0x8000];
        } else if(address < 0xC000) {
            return this.mem.cram[address - 0xA000];
        } else if(address < 0xE000) {
            return this.mem.wram[address - 0xC000];
        } else if(address < 0xFE00) {
            // mirror WRAM
            return this.mem.wram[address - 0xE000]
        } else if(address < 0xFEA0) {
            return this.mem.oam[address - 0xFE00]
        } else if(address <= 0xFEFF) {
            return 0xFF;
        } else if(address == 0xFF00) {
            let chkDpad = UInt8.getBit(this.mem.hram[0], 5) == 1;
            return Controller.getButtons(chkDpad);
        } else if(address == 0xFF04) {
            return this.timerRegs.regs.div;
        } else if(address == 0xFF05) {
            return this.timerRegs.regs.tima;
        } else if(address == 0xFF06) {
            return this.timerRegs.regs.tma;
        } else if(address == 0xFF07) {
            return this.timerRegs.regs.tac;
        } else if(address == 0xFF0F) {
            return this.interrupt_flag;
        } else if(address == 0xFF40) {
            return this.ppu.regs.lcdc;
        } else if(address == 0xFF41) {
            return this.ppu.regs.stat;
        } else if(address == 0xFF42) {
            return this.ppu.regs.scy;
        } else if(address == 0xFF43) {
            return this.ppu.regs.scx;
        } else if(address == 0xFF44) {
            return this.ppu.regs.scanline;
        } else if(address == 0xFF45) {
            return this.ppu.regs.syc;
        } else if(address == 0xFF46) {
            return this.ppu.regs.dma;
        } else if(address == 0xFF47) {
            return this.ppu.regs.bgp;
        } else if(address == 0xFF48) {
            return this.ppu.regs.obj0;
        } else if(address == 0xFF49) {
            return this.ppu.regs.obj1;
        } else if(address == 0xFF4A) {
            return this.ppu.regs.wy;
        } else if(address == 0xFF4B) {
            return this.ppu.regs.wx;
        } else if(address == 0xFFFF) {
            return this.interrupt_enable;
        } else if(address < 0xFFFF) {
            return this.mem.hram[address - 0xFF00];
        } else {
            console.log("ERROR READING FROM ADDRESS: 0x" + address.toString(16));
        }

    };

    /**
     * Reads two bytes from an address
     * @param {UInt16} address
     * @returns {UInt16} two bytes
     */
    read16(address) {
        let high = this.read8(address + 1);
        let low = this.read8(address);
        return UInt16.makeWord(high, low);
    }

    execute() {
        let opcode = this.read8(this.pc.v);
        // if(this.debug==true)console.log("PC: 0x" + this.pc.v.toString(16) + " | 0x" + opcode.toString(16) + " | A: 0x" + this.af.high.toString(16) + " | HL: 0x" + this.hl.v.toString(16));

        this.cycles = opcodeCycles[opcode];

/*         if(this.pc.v == 0x72ca)
        {
            illegalOpcode(opcode, this, false);
            opTable[opcode](this);
            return false;
        } */

        // execute opcode
        if(opTable[opcode] == undefined) {
            illegalOpcode(opcode, this, false);
            return false;
        } else if(this.isHalted == false) {
            opTable[opcode](this);
        }

        // manage interrupts
        if(opcode != 0xF3 && opcode != 0xFB)
        {
            if(this.shouldDI == true)
            {
                this.interrupt_master = false;
                this.shouldDI = false;
            } else if(this.shouldEI == true)
            {
                this.interrupt_master = true;
                this.shouldEI = false;
            }
        }

        this.timerRegs.updateTimers(this);

        // handle interrupts
        this.serviceInterrupts();
        
        // update GPU
        this.ppu.step(this);
        return true;
    };

    /**
     * Sets the hc flag
     * @param {number} a UInt8
     * @param {number} b UInt8
     * @param {Arithmetic} arithmetic type of arithmetic to perform
     */
    halfCarry8(a, b, arithmetic) {
        switch(arithmetic) {
            case Arithmetic.ADC:
                this.flags.hc = (a & 0x0F) + ((b & 0x0F) + Number(this.flags.c)) > 0x0F;
                break;
            case Arithmetic.ADD:
                this.flags.hc = (a & 0xF) + (b & 0xF) > 0xF;
                break;
            case Arithmetic.SUB:
                this.flags.hc = ((a - b) & 0xF) > (a & 0xF);
                break;
            case Arithmetic.SBC:
                this.flags.hc = (a & 0xF) - (b & 0xF) - Number(this.flags.c) < 0;
                break;
        }
    }
    /**
     * Sets the hc flag
     * @param {number} a UInt16
     * @param {number} b UInt16
     * @param {Arithmetic} arithmetic type of arithmetic to perform
     */
    halfCarry16(a, b, arithmetic) {
        switch(arithmetic) {
            case Arithmetic.ADD:
                this.flags.hc = (a & 0xFFF) + (b & 0xFFF) > 0xFFF;
                break;
            case Arithmetic.SUB:
                this.flags.hc = (a & 0xFFF) - (b & 0xFFF) < 0x0;
                break;
        }
    }

    /**
     * Sets the c flag
     * @param {number} a UInt8
     * @param {number} b UInt8
     * @param {Arithmetic} arithmetic 
     */
    carry8(a, b, arithmetic) {
        switch(arithmetic) {
            case Arithmetic.ADC:
                this.flags.c = (a + b + Number(this.flags.c)) > 0xFF;
                break;
            case Arithmetic.ADD:
                this.flags.c = a + b > 0xFF;
                break;
            case Arithmetic.SUB:
                this.flags.c = a < b;
                break;
            case Arithmetic.SBC:
                this.flags.c = a - b - Number(this.flags.c) < 0;
                break;
        }
    }
        
    /**
     * Sets the c flag
     * @param {number} a UInt16
     * @param {number} b UInt16
     * @param {Arithmetic} arithmetic 
     */
    carry16(a, b, arithmetic) {
        switch(arithmetic) {
            case Arithmetic.ADD:
                this.flags.c = a + b > 0xFFFF;
                break;
            case Arithmetic.SUB:
                this.flags.c = a - b < 0;
                break;
        }
    }

    /**
     * Sets the zero flag
     * @param {number} a Any size uint
     */
    zero(a) {
        this.flags.z = a == 0;
    }
    
    /**
     * Pops a value from the stack
     * @returns {UInt16} TOS
     */
    popStack() {
        let address = this.read16(this.sp.v);
        this.sp.v += 2;
        return address;
    }

    /**
     * Writes a word to the stack
     * @param {UInt16} v write value
     */
    pushStack(v) {
        this.sp.v -= 2;
        this.write16(this.sp.v, v & 0xFFFF);
    }


    /**
     * Increases the program counter
     * @param {number} dx 
     */
    skip(dx) {
        this.pc.v += dx;
    };

}
