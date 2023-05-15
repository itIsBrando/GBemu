"use strict";

let USE_LOG = false;

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
            Menu.message.show("Unsupport MBC type.", MemoryControllerText[v]);
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
    20, 12, 16,  0, 24, 16,  8, 16, 20, 16, 16, 0, 24,  0, 8, 16, // D
    12, 12, 8,   0,  0, 16,  8, 16, 16,  4, 16, 0,  0,  0, 8, 16, // E
    12, 12, 8,   4,  0, 16,  8, 16, 12,  8, 16, 4,  0,  0, 8, 16, // F
];


class CPU {
    createSaveState() {
        return JSON.stringify({
            cpu: this.export(),
            timer: this.timerRegs.export(),
            ppu: this.ppu.export(),
            renderer: this.renderer.export(),
            mbc: this.mbcHandler?.export() ?? null,
            version: SaveManager.CUR_VERSION
        });
    }

    loadSaveState(data) {
        data = JSON.parse(data);
        this.import(data);
        this.timerRegs.import(data);
        this.ppu.import(data);
        this.renderer.import(data);
        this.mbcHandler?.import(data);
    }

    export() {
        return {
            pc: this.pc.v,
            sp: this.sp.v,
            af: this.af.v,
            bc: this.bc.v,
            de: this.de.v,
            hl: this.hl.v,
            flags: this.flags,

            mem: {
                vram: SaveManager.pack(this.mem.vram),
                wram: SaveManager.pack(this.mem.wram),
                cram: SaveManager.pack(this.mem.cram),
                hram: SaveManager.pack(this.mem.hram),
                oam: SaveManager.pack(this.mem.oam),
            },

            currentCycles: this.currentCycles,
            cycles: this.cycles,
            cgb: this.cgb,

            isHalted: this.isHalted,
            interrupt_master: this.interrupt_master,
            interrupt_enable: this.interrupt_enable,
            interrupt_flag: this.interrupt_flag,
    
            shouldEI: this.shouldEI,
            shouldDI: this.shouldDI,
        }
    }

    import(data) {
        const cpu_data = data["cpu"];
        const version = data.version || "0.1.0";

        this.pc.v = cpu_data.pc;
        this.sp.v = cpu_data.sp;
        this.af.v = cpu_data.af;
        this.bc.v = cpu_data.bc;
        this.de.v = cpu_data.de;
        this.hl.v = cpu_data.hl;
        this.flags = cpu_data.flags;

        const mem = cpu_data.mem;
        this.mem.vram = SaveManager.unpack(mem.vram);
        this.mem.wram = SaveManager.unpack(mem.wram);
        this.mem.cram = SaveManager.unpack(mem.cram);
        this.mem.hram = SaveManager.unpack(mem.hram);
        this.mem.oam = SaveManager.unpack(mem.oam);

        this.currentCycles = cpu_data.currentCycles;
        this.cycles = cpu_data.cycles;
        this.cgb = cpu_data.cgb;

        this.isHalted = cpu_data.isHalted;
        this.interrupt_master = cpu_data.interrupt_master;
        this.interrupt_enable = cpu_data.interrupt_enable;
        this.interrupt_flag = cpu_data.interrupt_flag;

        this.shouldEI = cpu_data.shouldEI;
        this.shouldDI = cpu_data.shouldDI;
    }

    constructor() {
        // timer that runs every 100ms
        this.timer = null;
        // used to boot in DMG mode
        this.forceDMG = false;
        // Bool to show/hide "power consumption"
        this.powerConsumptionShown = false;
        // set to true once a ROM file has been loaded
        this.romLoaded = false;
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
        this.hdma = new HDMA(this);
        this.ppu = new PPU(this);
        this.serial = new SerialPort(this);
        this.apu = new APU(this);
        this.renderer = new Renderer(this);
        this.cycles = 0;
        this.cgb = false;
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

        this.isHalted = false;
        this.interrupt_master = false;
        this.interrupt_enable = 0;
        this.interrupt_flag = 0;

        this.shouldEI = false;
        this.shouldDI = false;

        this.mem = {
            rom: new Uint8Array(0x8000), // ROM 0000-7FFF
            vram: new Uint8Array(0x2000 * 2), // RAM 8000-9FFF
            cram: new Uint8Array(0x2000), // RAM A000-BFFF (cart RAM)
            wram: new Uint8Array(0x2000 * 8), // RAM C000-CFFF & D000-DFFF (working RAM) (mirror RAM = E000-FDFF)
            oam : new Uint8Array(0x00A0), // OAM RAM FE00-FE9F
            hram: new Uint8Array(0x0100) // HRAM FF00-FFFF
        };
        
        this.cheats = new Cheats()
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
        this.ticks = 0;
        
        if(this.mbcHandler)
            this.mbcHandler.reset();
        
        for(let i = 0xFF00; i <= 0xFFFF; i++)
            // skip HDMA
            if(i != 0xFF55)
                this.write8(i, 0);
        
        this.timerRegs.reset();
        this.ppu.reset();
        this.apu.reset();
        this.serial.reset();
        this.cheats.reset();
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
        let src = high << 8;

        for(let i = 0xfe00; i < 0xfea0; i++) {
            this.write8(i, this.read8(src++));
        }
    }

    /**
     * Writes a byte to an address in memory
     * @param {UInt16} address
     * @param {UInt8} byte
     */
    write8(address, byte) {
        byte &= 255;

        if(this.mbcHandler && this.mbcHandler.acceptsWrite(address)) {
            this.mbcHandler.write8(address, byte);
            return;
        } else if(this.ppu.accepts(address)) {
            this.ppu.write8(address, byte);
            return;
        } else if(this.hdma.accepts(address)) {
            this.hdma.write8(address, byte);
            return;
        } else if(this.timerRegs.accepts(address)) {
            this.timerRegs.write8(address, byte);
            return;
        } else if(this.serial.accepts(address)) {
            this.serial.write8(address, byte);
            return;
        } else if(this.apu.accepts(address)) {
            this.apu.write8(address, byte);
            return;
        }

        if(address < 0x8000) {
            CPU.LOG("illegal ROM write: " + hex(address, 4));
        } else if(address < 0xA000) {
            // VRAM
            address -= 0x8000;

            if(this.ppu.vramAccessible())
                this.mem.vram[address + 0x2000 * this.ppu.getVRAMBank()] = byte;
        } else if(address < 0xC000) {
            // cart RAM
            CPU.LOG("illegal RAM read");
            this.mem.cram[address - 0xA000] = byte;
        } else if(address < 0xD000) {
            // this is unbanked WRAM
            address -= 0xC000;
            this.mem.wram[address] = byte;
        } else if(address < 0xE000) {
            // working RAM
            address -= 0xD000;
            if(this.cgb)
                this.mem.wram[address + this.ppu.cgb.svbk * 0x1000 + 0x1000] = byte;
            else
                this.mem.wram[address + 0x1000] = byte;
        } else if(address < 0xFE00) {
            // mirror WRAM
            this.mem.wram[address - 0xE000] = byte;
        } else if(address < 0xFEA0) {
            if(this.ppu.oamAccessible())
                this.mem.oam[address - 0xFE00] = byte;
        } else if(address <= 0xFEFF) {
            // do nothing
            return;
        } else if(address == 0xFF00) {
            this.mem.hram[0] = byte & 0b00110000;
        } else if(address == 0xFF0F) {
            this.interrupt_flag = byte;
        } else if(address == 0xFF70) {
            // cgb WRAM bank
            byte &= 7;
            if(byte == 0)
                byte = 1;
            this.ppu.cgb.svbk = byte;
        } else if(address == 0xFFFF) {
            this.interrupt_enable = byte;
        } else if(address < 0xFFFF) {
            this.mem.hram[address - 0xFF00] = byte;
        } else {
            CPU.LOG("ERROR WRITING FROM ADDRESS: 0x" + hex(address, 4));
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

        CPU.LOG(`MBC Type: ${MemoryControllerText[this.mem.rom[0x0147]]}`);
        CPU.LOG(`ROM Name: ${this.readROMName()}`);

        this.romLoaded = true;
    }

    /**
     * Logs an error/warning
     * @param {String} str output
     */
    static LOG(str, throwException = false) {
        if(!USE_LOG)
            return;
        else if(throwException)
            throw str;
        else
            console.log(str);
    }

    
    /**
     * Reads the game title embeded inside the ROM
     * @returns String
     */
    readROMName() {
        let str = "", i = 0;

        if(this.mem.rom[0x134] == 0)
            return null;

        do {
            str += String.fromCharCode(this.mem.rom[0x134 + i]);
            i++;
        } while(i <= 16 && this.mem.rom[0x134 + i] != 0);
        return str;
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
     * @returns {Boolean} true if the current ROM has a MBC
     */
    hasMbc() {
        return this.mbcHandler != null;
    }

    /**
     * Read a byte from an address from memory
     * @param {UInt16} address
     * @returns {UInt8} byte
     */
    read8(address) {
        if(this.cheats.accepts(address))
            return this.cheats.read(address);
        else if(this.mbcHandler && this.mbcHandler.acceptsRead(address))
            return this.mbcHandler.read8(address);        
        else if(this.ppu.accepts(address))
            return this.ppu.read8(address);
        else if(this.hdma.accepts(address))
            return this.hdma.read8(address);
        else if(this.timerRegs.accepts(address))
            return this.timerRegs.read8(address);
        else if(this.serial.accepts(address))
            return this.serial.read8(address);
        else if(this.apu.accepts(address)) {
            return this.apu.read8(address);
        }

        if(address < 0x8000) {
            return this.mem.rom[address];
        } else if(address < 0xA000) {
            // VRAM read from bank
            address -= 0x8000;

            if(this.ppu.vramAccessible())
            return this.mem.vram[address + 0x2000 * this.ppu.getVRAMBank()];
        } else if(address < 0xC000) {
            // cart RAM
            CPU.LOG("illegal read: " + hex(address, 4));
            return this.mem.cram[address - 0xA000];
        } else if(address < 0xD000) {
            // unbanked WRAM
            address -= 0xC000;
            return this.mem.wram[address];
        } else if(address < 0xE000) {
            // banked WRAM (CGB only)
            address -= 0xD000;
            if(this.cgb)
                return this.mem.wram[address + this.ppu.cgb.svbk * 0x1000 + 0x1000];
            else
                return this.mem.wram[address + 0x1000];
        } else if(address < 0xFE00) {
            // mirror WRAM
            return this.mem.wram[address - 0xE000]
        } else if(address < 0xFEA0) {
            // block OAM read/write on mode 1 & 2
            if(!this.ppu.oamAccessible())
                return 0xff;

            return this.mem.oam[address - 0xFE00];
        } else if(address <= 0xFEFF) {
            return 0xFF;
        } else if(address == 0xFF00) {
            let chkDpad = UInt8.getBit(this.mem.hram[0], 5);
            return Controller.getButtons(chkDpad);
        } else if(address == 0xFF0F) {
            return this.interrupt_flag;
        } else if(address == 0xFF70) {
            return this.ppu.cgb.svbk | 0xF8;
        } else if(address == 0xff74) {
            // readonly in cgb mode, otherwise locked at $ff
            return this.cgb ? this.mem.hram[0x74] : 0xff;
        } else if(address == 0xFFFF) {
            return this.interrupt_enable;
        } else if(address < 0xFFFF) {
            return this.mem.hram[address - 0xFF00];
        } else {
            CPU.LOG("ERROR READING FROM ADDRESS: " + hex(address, 4));
            throw "Cannot read here:" + hex(address, 4);
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
        } else if(this.hdma.shouldTransfer()) {
            this.cycles = 4;
            this.hdma.tick(this.ppu.getAdjustedCycles(this.cycles));
        } else if(!this.isHalted) {
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
        this.timerRegs.step(this);

        // handle interrupts
        this.serviceInterrupts();

        // update GPU
        this.ppu.step(this.ppu.getAdjustedCycles(this.cycles));
        
        // serial port
        this.serial.tick(this.ppu.getAdjustedCycles(this.cycles));

        // update sound
        this.apu.tick(this.ppu.getAdjustedCycles(this.cycles));

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
                this.flags.hc = (a & 0x7FF) + (b & 0x7FF) > 0x7FF;
                break;
            case Arithmetic.SUB:
                this.flags.hc = (a & 0x7FF) - (b & 0x7FF) < 0x0;
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
        this.pc.v += dx;
    };

}