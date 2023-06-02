class Timer {
    constructor(cpu) {
        this.parent = cpu;
        
        this.regs = {
            tima: 0,
            div: 0,
            tma: 0,
            tac: 0
        }
        
        this.tima_cycles = 0;
        this.div_cycles = 0;

        this.frequency = 0;
        this.skipDivInc = false;
    }

    export() {
        return {
            regs: this.regs,
            frequency: this.frequency,
            div_cycles: this.div_cycles,
            tima_cycles: this.tima_cycles,
        };
    }

    import(data) {
        const timer_data = data["timer"];

        this.regs = timer_data.regs;
        this.frequency = timer_data.frequency;
        this.div_cycles = timer_data.div_cycles;
        this.tima_cycles = timer_data.tima_cycles;
    }

    reset() {
        this.regs.tima = 0;
        this.regs.div  = 0; 
        this.regs.tma  = 0;
        this.regs.tac  = 0;
        this.div_cycles = 0;
        this.tima_cycles = 0;
    }

    accepts(addr) {
        return addr >= 0xFF04 && addr <= 0xFF07;
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x04:
                this.resetDiv();
                this.skipDivInc = true;
                break;
            case 0x05:
                this.regs.tima = byte;
                break;
            case 0x06:
                this.regs.tma = byte;
                break;
            case 0x07:
                this.writeTAC(byte);
                break;
        }
    }

    read8(addr) {
        switch(addr & 0xFF) {
            case 0x04:
                return this.regs.div;
            case 0x05:
                return this.regs.tima;
            case 0x06:
                return this.regs.tma;
            case 0x07:
                return this.regs.tac | 0xF8;
        }

        return 0xFF;
    }

    step(cycles) {        
        this.increaseDiv(cycles);

        // return if timer is disabled
        if(!UInt8.getBit(this.regs.tac, 2))
            return;

        this.tima_cycles += cycles;
        
        this.setClockFrequency();
        
        while(this.tima_cycles >= this.frequency) {
            this.tima_cycles -= this.frequency;
            
            // if we are about to overflow
            if(this.regs.tima == 0xFF) {
                this.regs.tima = this.regs.tma;
                this.parent.requestInterrupt(InterruptType.timer);
            } else {
                this.regs.tima++;
            }
            
            this.regs.tima &= 255;
        }
    }
    
    increaseDiv(cycles) {
        /**
         * DIV is reset on the very last cycle mircocode.
         *  As a result, when `resetDIV` is called from writing to the DIV register,
         *  this write instruction should not contribute to the write cycle
         *  */

        if(this.skipDivInc) {
            this.skipDivInc = false;
            return;
        }

        this.div_cycles += cycles;
        
        while(this.div_cycles >= 256) {
            this.regs.div++;
            this.regs.div &= 0xFF;
            this.div_cycles -= 256;
        }

    }

    setClockFrequency() {
        const freqs = [1024, 16, 64, 256];
        this.frequency = freqs[this.regs.tac & 0x3];
    }
    
    
    resetDiv() {
        this.regs.div = 0;
        this.div_cycles = 0;
        this.tima_cycles = 0;
    }
    
    writeTAC(v) {
        const tac = this.regs.tac;
        this.regs.tac = v & 0x7;
        
        if((tac & 0x3) != (v & 0x3)) {
            this.tima_cycles = 0;
            this.regs.tima = this.regs.tma;
        }
    }
}