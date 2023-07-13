
const COMMANDS = {
    EWDS:  {op: 0b0000, len: 4},
    READ:  {op: 0b10, len: 2},
    WRITE: {op: 0b01, len: 2},
    ERASE: {op: 0b11, len: 2},
    ERAL:  {op: 0b0010, len: 4},
    WRAL:  {op: 0b0001, len: 4},
    EWEN:  {op: 0b0011, len: 4},
};


const STATE = {
    IDLE: 0,        // waiting for start condition
    READ_CMD: 1,    // reading 10bit command
    READ_EXTRA: 2,  // reading extra 16-bit data (WRAL & WRITE)
};

const INPUT = {
    ACCELEROMETER: 0,
    MOUSE: 1,
};

// const display = document.getElementById('accel');


class EEPROM {
    constructor(parent) {
        this.sensitivity = 0x70 * 2; // doubled because accelerometer datasheet detects up to 2g
        this.x = 0x8000; // 16-bit value
        this.y = 0x8000; // 16-bit value
        this.accelX = 0; // raw data from the accelerometer if present
        this.accelY = 0; // raw data from the accelerometer if present
        this.latched = false;
        this.inputMode = 'ondevicemotion' in window ? INPUT.ACCELEROMETER : INPUT.MOUSE;

        Menu.alert.show(this.inputMode == INPUT.ACCELEROMETER ? 'Your device supports the accelerometer' : 'Your device does not support an accelerometer.',
        'Allow Accelerometer?', false, null, (e)=> {
            window.addEventListener("devicemotion", (e) => {
                this.accelX =  Math.trunc(e.accelerationIncludingGravity.x * 100 / 9.8) / 100;
                this.accelY = -Math.trunc(e.accelerationIncludingGravity.y * 100 / 9.8) / 100;
                // display.innerHTML = `ACCELX: ${this.accelX}, x: ${this.getX()}<br>ACCELY: ${this.accelY} y: ${this.getY()}`;
            });

        });

        this.DO = 0;
        this.DI = false;
        this.CS = false;
        this.CLK = false;
        this.state = STATE.IDLE;

        this.clockNums = 0;
        this.opcode = 0; // 10bit
        this.extraData = 0;

        this.outLength = 0;
        this.outData = 0;

        this.parent = parent;
    }

    reset() {
        this.latched = false;
        this.DO = 0;
        this.CS = false;
        this.CLK = false;
        this.state = STATE.IDLE;
        this.clockNums = 0;
        this.outLength = 0;
    }


    getX() {
        // max is 2g
        let ax = this.accelX * this.sensitivity;
        return (0x81d0 + ax) & 0xffff;
    }


    getY() {
        let ay = this.accelY * this.sensitivity;
        return (0x81d0 + ay) & 0xffff;
    }


    read(address) {
        switch(address & 0xf0f0) {
            case 0xa020: // x low
                return this.x & 0xff;
            case 0xa030: // x high
                return this.x >> 8;
            case 0xa040: // y low
                return this.y & 0xff;
            case 0xa050: // y high
                return this.y >> 8;
            case 0xa060: // z axis (unknown)
                return 0x00;
            case 0xa080: // EEPROM read
                let out = this.outLength == 0 ? 1 : this.DO;
                out |= this.CS << 7;
                out |= this.CLK << 6;
                out |= this.DI << 1;
                return out;
            default:
                return 0xff;
        }
    }

    /**
     * The issue i have made is with the opcode decoding and address population.
     * @todo optimize everything. every command is 10bits so lets clean this shit up
     * @note this is the 93LC56 with ORG=1 (16-bit mode)
     */

    write(address, byte) {
        switch(address & 0xf0f0) {
            case 0xa000: // reset latched data @todo
                if(byte == 0x55) {
                    this.latched = false;
                    this.x = this.y = 0x8000;
                    CPU.LOG(`Unlatching accel`);
                }
                break;
            case 0xa010: // latch
                if(!this.latched && byte == 0xaa) {
                    this.latched = true;
                    this.x = this.getX();
                    this.y = this.getY();
                    CPU.LOG(`latching accel. X:${this.x}, Y: ${this.y}`);
                }
                break;
            case 0xa080: // eeprom write
                const newCLK = UInt8.getBit(byte, 6);
                this.CS = UInt8.getBit(byte, 7);
                this.DI = UInt8.getBit(byte, 1);

                // rising edge
                if(!this.CLK && newCLK && this.CS) {
                    this.proccessCycle();
                }

                this.CLK = newCLK;
                break;
        }
    }

    proccessCycle() {
        // shift data out if present
        if(this.outLength > 0) {
            this.outLength--;
            this.DO = (this.outData & (1 << this.outLength)) != 0;
        } else {
            this.DO = 1; // this is held high when nothing is out
        }

        switch(this.state) {
            case STATE.IDLE:
                if(this.CS == 1 && this.DI == 1) {
                    this.clockNums = 0;
                    this.opcode = 0;
                    this.state = STATE.READ_CMD;
                }
                break;
            case STATE.READ_CMD:
                // shift in new data
                this.clockNums++;
                this.opcode <<= 1;
                this.opcode |= this.DI;

                // once we gather FULL command
                if(this.clockNums == 10) {
                    if(this.hasExtraData(this.opcode)) {
                        this.state = STATE.READ_EXTRA;
                        this.clockNums = 0;
                        this.extraData = 0;
                    } else {
                        this.runCommand(this.getFullCommand());
                        this.state = STATE.IDLE;
                    }
                }
                break;
            case STATE.READ_EXTRA:
                this.extraData <<= 1;
                this.extraData |= this.DI;

                if(++this.clockNums == 16) {
                    this.runCommand(this.getFullCommand());
                    this.state = STATE.IDLE;
                }
                break
        };

    }

    /**
     * @param {Number} op 10-bit opcode
     * @returns true if the opcode has extra data that needs to be shifted in
     */
    hasExtraData(op) {
        const cmd = this.getFullCommand(op);
        return cmd == "WRITE" || cmd == "ERASE";
    }

    /**
     * Sends data to `DO` pin of the EEPROM
     * @param {Number} data data
     * @param {Number} bits number of bits to shift out
     */
    sendDataOut(data, bits) {
        this.outLength += bits;
        this.outData <<= bits;
        this.outData |= data;
    }

    /**
     * Opcodes are only 2bits long but opcode 00 has other meanings depending on the two MSBs of the address
     * @returns {String} command name. Keys of `COMMANDS`
     */
    getFullCommand() {
        const shortOp = (this.opcode >> 8) & 0b11; // two bit opcode according to datasheet
        const longOp = (this.opcode >> 6) & 0b1111; // four bit ops

        for(let i in COMMANDS) {
            const cmd = COMMANDS[i];
            if((cmd.len == 2 && cmd.op == shortOp) || (cmd.len == 4 && cmd.op == longOp))
                return i;
        }

        CPU.LOG(`Invalid command lookup: ${hex(this.opcode, 3)}!!`);
    }

    /**
     * Executes a command. Some instructions need extraData to be populated first
     * @param {String} cmd name of command from the `COMMANDS` object
     */
    runCommand(cmd) {
        const addr = this.opcode & 0x7f;

        switch(cmd) {
            case "READ":
                this.sendDataOut(0, 1); // datasheet says that a `0` preceeds data
                this.sendDataOut(this.readEEPROM(addr), 16);
                break;
            case "EWEN":
                // write enable @todo
                break;
            case "EWDS":
                // write disable @todo
                break;
            case "WRITE":
                this.writeEEPROM(addr, this.extraData);
                this.setRDY();
                break;
            case "ERASE":
                // this.writeEEPROM(addr, 0xffff);
                this.setRDY();
                break;
            case "ERAL":
                this.fillEEPROM(0xffff);
                this.setRDY();
                break;
            case "WRAL":
                this.fillEEPROM(this.extraData);
                this.setRDY();
                break;
            default:
                CPU.LOG(`UNKNOWN COMMAND: ${cmd}, Opcode: ${hex(this.opcode)}, address: ${hex(addr)}`);
        }
    }

    /**
     * @todo this really does nothing
     */
    setRDY() {
        this.DO = 1;
    }

    /**
     * Fills the EEPROM with a 16-bit value :)
     * @param {Number} val 16-bit value
     */
    fillEEPROM(val) {
        for(let i = 0; i < 128; i++) {
            this.writeEEPROM(i, val);
        }
    }


    /**
     * Writes a word to the 128x16-bit EEPROM
     * @param {Number} address 0-127
     * @param {Number} word 16-bit value
     */
    writeEEPROM(address, word) {
        address &= 0x7f;
        address <<= 1;
        this.parent.ram[address] = word & 0xff;
        this.parent.ram[address + 1] = word >> 8;
    }


    /**
     * Reads a word from the 128x16-bit EEPROM
     * @param {Number} address 0-127
     * @returns {Number} word 16-bit value
     */
    readEEPROM(address) {
        address &= 0x7f;
        address <<= 1;
        return UInt16.makeWord(this.parent.ram[address + 1], this.parent.ram[address]);
    }
}