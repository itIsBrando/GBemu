"use strict";

/**
 * TODO:
 *  - recognize tile banking in drawTileLine
 *  - implement the rest of MBC3's RTC
 *  - add an `x` button to the copy text menu
 *  -
 */


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
    0x08: "ROM+RAM",
    0x09: "ROM+RAM+BATTERY",
    0x0B: "MMM01",
    0x0C: "MMM01+RAM",
    0x0D: "MMM01+RAM+BATTERY",
    0x0F: "MBC3+TIMER+BATTERY",
    0x10: "MBC3+TIMER+RAM+BATTERY",
    0x11: "MBC3",
    0x12: "MBC3+RAM",
    0x13: "MBC3+RAM+BATTERY",
    0x19: "MBC5",
    0x1A: "MBC5+RAM",
    0x1B: "MBC5+RAM+BATTERY",
    0x1C: "MBC5+RUMBLE",
    0x1D: "MBC5+RUMBLE+RAM",
    0x1E: "MBC5+RUMBLE+RAM+BATTERY",
    0x20: "MBC6",
    0x22: "MBC7+SENSOR+RUMBLE+RAM+BATTERY",
    0xFC: "POCKET CAMERA",
    0xFD: "BANDAI TAMA5",
    0xFE: "HuC3",
    0xFF: "HuC1+RAM+BATTERY",

}

const MBCType = {
    NONE: 0,
    MBC_1: 1,
    MBC_2: 2,
    MBC_3: 3,
    MBC_5: 5,
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
        case 0x03:
        case 0x08:
        case 0x09:
            return MBCType.MBC_1;
        case 0x05:
        case 0x06:
            return MBCType.MBC_2;
        case 0x0F:
        case 0x10:
        case 0x11:
        case 0x12:
        case 0x13:
            return MBCType.MBC_3;
        case 0x19:
        case 0x1A:
        case 0x1B:
        case 0x1C:
        case 0x1D:
        case 0x1E:
            return MBCType.MBC_5;
        default:
            showMessage("Unsupport MBC type.", MemoryControllerText[v]);
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
        // timer that runs every 100ms
        this.timer = null;
        // used to boot in DMG mode
        this.forceDMG = true;
        // Bool to show/hide "power consumption"
        this.powerConsumptionShown = false;
        // speed multiplier
        this.speed = 1;
        this.FastForwardSpeed = 8;
        // used to maintain 60fps
        this.framesToSkip = 0;

        // cycles that occurred while halted. Used for power consumption
        this.haltedCycles = 0;

        // cycles ran for this setInterval tick
        this.currentCycles = 0;

        this.timerRegs = new Timer();
        this.ppu = new PPU();
        this.renderer = new Renderer();
        this.cycles = 0;
        this.cgb = false;
        this.mbcHandler = null;

        // Set to true during HDMA H-Blank at register $FF55
        this.HDMAInProgress = false;


        this.af = new UInt16();
        this.bc = new UInt16();
        this.de = new UInt16();
        this.hl = new UInt16();

        // this could be useful for debugging
/*         var _pc = new UInt16(0x100);

        this.pc = {
            get v() {
                return _pc.v
            },
            set v(val) {
                if(val >= 0xe000 && val <= 0xf000)
                    throw "executing mirror RAM: " + hex(val) + " from " + hex(_pc.v);
                _pc.v = val
            }
        }; */

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
        this.haltBug = false;
        this.interrupt_master = false;
        this.interrupt_enable = 0;
        this.interrupt_flag = 0;

        this.shouldEI = false;
        this.shouldDI = false;

        this.mem = {
            rom: new Uint8Array(0x8000), // ROM 0000-7FFF
            vram: new Uint8Array(0x2000), // RAM 8000-9FFF
            cram: new Uint8Array(0x2000), // RAM A000-BFFF (cart RAM)
            wram: new Uint8Array(0x2000 * 8), // RAM C000-CFFF & D000-DFFF (working RAM) (mirror RAM = E000-FDFF)
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
     * - should be called before a ROM is loaded
     */
    initialize() {
        this.mbcHandler = null;
        this.reset();
    }

    initRegisters() {
        this.pc.v = 0x100;
        this.sp.v = 0xFFFE;
        this.af.v = this.cgb ? 0x11B0 : 0x01B0;
        this.bc.v = 0x0013;
        this.de.v = 0x00D8;
        this.hl.v = 0x014D;

        if(this.cgb)
            this.bc.high &= 254;
    }

    /**
     * Resets registers and stuff. Useful for resetting the game that is loading
     */
    reset() {
        this.initRegisters();
        this.ppu.regs.stat = 0x85;
        this.ppu.regs.lcdc = 0x91;
        this.interrupt_master = true;
        this.isHalted = false;
        this.currentCycles = 0;
        
        if(this.mbcHandler)
        this.mbcHandler.reset();
        
        for(let i = 0xFF00; i <= 0xFFFF; i++)
        // skip HDMA
        if(i != 0xFF55)
        this.write8(i, 0);
        
        this.timerRegs.reset();
        this.ppu.reset();
    }

    // true if the CPU is currently running a ROM
    get isRunning() {
        return this.timer != null;
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

        if(this.interrupt_master && fired != 0 ) {
            for(let i = 0; i < 5; i++) {
                // if both bits are set
                if(UInt8.getBit(fired, i))
                {
                    // if we are HALTed
                    if(this.isHalted) {
                        this.isHalted = false;
                        this.pc.v++; // pass the HALT instruction
                    }

                    this.interrupt_flag = UInt8.clearBit(this.interrupt_flag, i);
                    this.interrupt_master = false;
                    this.pushStack(this.pc.v);
                    this.pc.v = handlerAddress[i];
                    this.cycles += 12;
                    return;
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
     * Performs an DMA to OAM transfer for GBC
     * Bit 7 - 0 = general purpose DMA. All data is done at once.
     *       - 1 = HBlank DMA. 0x10 bytes are transferred at H-blank (LY in range of 0-143)
     * Bit 0-6 - length of the transfer. Range is 0x10-0x800 bytes
     * @param {UInt8} data
     */
    DMATransferCGB(data) {
        const mode = UInt8.getBit(data, 7);
        const length = data & 0x7F;
        // preliminary support for some of the CGB's DMA transfers

        // if we are in the middle of a HDMA Transfer but we want to stop it.
        if(UInt8.getBit(this.ppu.cgb.hdma, 7) && !mode && this.HDMAInProgress)
        {
            this.HDMAInProgress = false;
            this.ppu.cgb.hdma = data;
            return;
        }


        if(!mode)
        {
            for(let i = 0; i < (length + 1) * 0x10; i++) {
                const byte = this.read8(this.ppu.cgb.HDMASrc++);
                this.write8(this.ppu.cgb.HDMADest++, byte);
            }
            this.ppu.cgb.hdma = 0xFF;
        } else {
            this.HDMAInProgress = true;
            this.ppu.cgb.hdma = data;
        }
        // console.log("HDMA mode " + mode);
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
            const shouldWrite = this.mbcHandler.write8(this, address, byte);
            if(shouldWrite === false)
                return;
        }

        if(address < 0x8000) {
            console.log("illegal ROM write: " + hex(address, 4));
        } else if(address < 0xA000) {
            // VRAM
            if(this.cgb && this.ppu.cgb.vbank != 0)
                this.ppu.cgb.vram[address - 0x8000] = byte;
            else
                this.mem.vram[address - 0x8000] = byte;
        } else if(address < 0xC000) {
            // cart RAM
            console.log("illegal RAM read");
            this.mem.cram[address - 0xA000] = byte;
        } else if(address < 0xD000) {
            // this is unbanked WRAM
            address -= 0xC000;
            this.mem.wram[address] = byte;
        } else if(address < 0xE000) {
            // working RAM
            address -= 0xD000;
            if(this.cgb)
                this.mem.wram[address + this.ppu.cgb.svbk * 0x2000] = byte;
            else
                this.mem.wram[address] = byte;
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
        } else if(address == 0xFF07) {
            const tac = this.timerRegs.regs.tac;
            this.timerRegs.regs.tac = byte;
            if((tac & 0x3) != (byte & 0x3))
                this.timerRegs.setClockFrequency();
        } else if(address == 0xFF0F) {
            this.interrupt_flag = byte;
        } else if(address == 0xFF40) {
            this.ppu.regs.lcdc = byte;
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
        } else if(address == 0xFF4F) {
            // cgb only
            this.ppu.cgb.vbank = byte & 0x1;
        } else if(address == 0xFF51) {
            // cgb. HDMA src high
            this.ppu.cgb.HDMASrc &= 0xF0;
            this.ppu.cgb.HDMASrc |= byte << 8;
        } else if(address == 0xFF52) {
            // cgb. HDMA src low
            this.ppu.cgb.HDMASrc &= 0xFF00;
            this.ppu.cgb.HDMASrc |= byte & 0xF0;
        } else if(address == 0xFF53) {
            // cgb. HDMA dest high
            this.ppu.cgb.HDMADest &= 0xFF;
            this.ppu.cgb.HDMADest |= 0x8000 | ((byte & 0xF) << 8);
        } else if(address == 0xFF54) {
            // cgb. HDMA dest low
            this.ppu.cgb.HDMADest &= 0xFF00;
            this.ppu.cgb.HDMADest |= byte & 0xF0;
        } else if(address == 0xFF55) {
            this.DMATransferCGB(byte);
        } else if(address == 0xFF68) {
            // cgb only (BCPS/BGPI)
            this.ppu.cgb.bgi = byte & 0x3F;
            this.ppu.cgb.bgAutoInc = (byte & 0x80) == 0x80;
        } else if(address == 0xFF69) {
            // cgb only
            this.ppu.cgb.bgPal[this.ppu.cgb.bgi] = byte;
            // must convert this modified palette into usable RGB
            const palNum = this.ppu.cgb.bgi >> 3;
            this.ppu.cgb.rgbBG[palNum] = PPU.linearToRGB(this.ppu.cgb.bgPal.slice(palNum * 8, palNum * 8 + 8));

            if(this.ppu.cgb.bgAutoInc)
                this.ppu.cgb.bgi = (this.ppu.cgb.bgi + 1) & 0x3F;
        } else if(address == 0xFF6A) {
            // cgb only (OCPS/OBPI)
            this.ppu.cgb.obji = byte & 0x3F;
            this.ppu.cgb.objAutoInc = (byte & 0x80) == 0x80;
        } else if(address == 0xFF6B) {
            // cgb only
            this.ppu.cgb.objPal[this.ppu.cgb.obji] = byte;

            const palNum = this.ppu.cgb.obji >> 3;
            this.ppu.cgb.rgbOBJ[palNum] = PPU.linearToRGB(this.ppu.cgb.objPal.slice(palNum * 8, palNum * 8 + 8));

            if(this.ppu.cgb.objAutoInc)
                this.ppu.cgb.obji = (this.ppu.cgb.obji + 1) & 0x3F;
        } else if(address == 0xFF70) {
            // cgb WRAM bank
            if(byte == 0)
                byte = 1;
            this.ppu.cgb.svbk = byte & 0x07;
        } else if(address == 0xFFFF) {
            this.interrupt_enable = byte;
        } else if(address < 0xFFFF) {
            this.mem.hram[address - 0xFF00] = byte;
        } else {
            console.log("ERROR WRITING FROM ADDRESS: 0x" + hex(address, 4));
        }

    };

    /**
     * Attempts to copy the screen buffer to the canvas
     *  - this will do nothing if we are fastforwarded to maintain 60fps
     */
    requestBufferCopy() {
        this.renderer.drawBuffer();
    }


    /**
     * Loads the rom into memory
     * @param {ArrayBuffer} array
     */
    loadROM(array) {
        const untrimmedROM = new Uint8Array(array);

        const trimmed = [...new Uint8Array(array)];
        this.mem.rom = new Uint8Array(trimmed.splice(0, 0x8000));

        // detect CGB mode
        this.cgb = this.forceDMG ? false : ((this.mem.rom[0x0143] & 0x80) == 0x80);

        if(this.cgb) {
            this.initRegisters();
        }

        // get MBC type
        const mbc = getMBCType(this.mem.rom[0x0147]);

        // create our memory bank controller
        switch(mbc) {
            case MBCType.MBC_1:
                this.mbcHandler = new MBC1(untrimmedROM, 1);
                break;
            case MBCType.MBC_2:
                this.mbcHandler = new MBC2(untrimmedROM, 2);
                alert("MBC2 Untested");
                break;
            case MBCType.MBC_3:
                this.mbcHandler = new MBC3(untrimmedROM, 3);
                break;
            case MBCType.MBC_5:
                this.mbcHandler = new MBC5(untrimmedROM, 5);
                break;
            case MBCType.NONE:
                this.mbcHandler = null;
                break;

        }

        console.log("MBC Type:" + MemoryControllerText[this.mem.rom[0x0147]]);
        console.log("ROM Name: " + readROMName());
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
            const v = this.mbcHandler.read8(this, address);
            if(v != null)
                return v;
        }

        if(address < 0x8000) {
            return this.mem.rom[address];
        } else if(address < 0xA000) {
            // VRAM read from bank
            if(this.cgb && this.ppu.cgb.vbank != 0)
                return this.ppu.cgb.vram[address - 0x8000];
            else
                return this.mem.vram[address - 0x8000];
        } else if(address < 0xC000) {
            // cart RAM
            console.log("illegal read: " + hex(address, 4));
            return this.mem.cram[address - 0xA000];
        } else if(address < 0xD000) {
            // unbanked WRAM
            address -= 0xC000;
            return this.mem.wram[address];
        } else if(address < 0xE000) {
            address -= 0xD000;
            if(this.cgb)
                return this.mem.wram[address + this.ppu.cgb.svbk * 0x2000];
            else
                return this.mem.wram[address];
        } else if(address < 0xFE00) {
            // mirror WRAM
            return this.mem.wram[address - 0xE000]
        } else if(address < 0xFEA0) {
            return this.mem.oam[address - 0xFE00]
        } else if(address <= 0xFEFF) {
            return 0xFF;
        } else if(address == 0xFF00) {
            let chkDpad = UInt8.getBit(this.mem.hram[0], 5);
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
        } else if(address == 0xFF51) {
            // cgb
            return this.ppu.cgb.HDMASrc >> 8;
        } else if(address == 0xFF52) {
            // cgb
            return this.ppu.cgb.HDMASrc & 0xFF;
        } else if(address == 0xFF53) {
            // cgb
            return this.ppu.cgb.HDMADest >> 8;
        } else if(address == 0xFF54) {
            // cgb
            return this.ppu.cgb.HDMADest & 0xFF;
        } else if(address == 0xFF55) {
            if(this.HDMAInProgress)
                return 0x80;
            else
                return this.ppu.cgb.hdma
        } else if(address == 0xFF68) {
            // cgb only
            return this.cgb ? this.ppu.cgb.bgi : 0xff;
        } else if(address == 0xFF69) {
            // cgb only
            return this.ppu.cgb.bgPal[this.ppu.cgb.bgi];
        } else if(address == 0xFF6A) {
            // cgb only
            return this.ppu.cgb.obji;
        } else if(address == 0xFF6B) {
            return this.ppu.cgb.objPal[this.ppu.cgb.obji];
        } else if(address == 0xFF4F) {
            // cgb only
            return this.ppu.cgb.vbank | 0xFE;
        } else if(address == 0xFF70) {
            return this.ppu.cgb.svbk | 0xF8;
        } else if(address == 0xFFFF) {
            return this.interrupt_enable;
        } else if(address < 0xFFFF) {
            return this.mem.hram[address - 0xFF00];
        } else {
            console.log("ERROR READING FROM ADDRESS: " + hex(address, 4));
            throw "Cannot read here."
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
        const opcode = this.read8(this.pc.v);
        this.cycles = opcodeCycles[opcode];

        // execute opcode
         if(opTable[opcode] == undefined) {
            illegalOpcode(opcode, this, false);
            return false;
        } else if(this.isHalted === false) {
            opTable[opcode](this);
        }

        if(this.isHalted)
        {
            this.haltedCycles += 4;
            // if interrupts are disabled but we have something pending, then break from HALT
            if(!this.interrupt_master && (this.interrupt_enable & this.interrupt_flag) != 0)
            {
                this.skip(1);
                this.isHalted = false;
            }
        }

        // manage interrupts
        if(opcode != 0xF3 && opcode != 0xFB)
        {
            if(this.shouldDI === true)
            {
                this.interrupt_master = false;
                this.shouldDI = false;
            } else if(this.shouldEI === true)
            {
                this.interrupt_master = true;
                this.shouldEI = false;
            }
        }

        // update timers
        this.timerRegs.updateTimers(this);

        // handle interrupts
        this.serviceInterrupts();

        // update GPU
        this.ppu.step(this);


        // HDMA stuff
        if(this.HDMAInProgress && (this.ppu.mode == PPUMODE.hblank || !this.ppu.lcdEnabled) && (this.currentCycles % 20) == 0)
        {
            for(let i = 0; i < 0x10; i++)
                this.write8(this.ppu.cgb.HDMADest + i, this.read8(this.ppu.cgb.HDMASrc + i));

            this.ppu.cgb.HDMADest += 0x10;
            this.ppu.cgb.HDMASrc += 0x10;
            this.ppu.cgb.hdma = (this.ppu.cgb.hdma - 1) | 0x80;
            // when HDMA ends
            if((this.ppu.cgb.hdma & 0x7F) == 0) {
                this.HDMAInProgress = false;
                this.ppu.cgb.hdma = 0x7F;
            }
        }

        this.currentCycles += this.cycles;
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
        this.write16(this.sp.v, v);
    }


    /**
     * Increases the program counter
     * @param {number} dx
     */
    skip(dx) {
        if(this.haltBug) {
            this.haltBug = false;
            return;
        }
        this.pc.v += dx;
    };

}
