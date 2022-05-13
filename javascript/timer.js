class Timer {
    constructor() {
        this.shouldReload = false;

        this.regs = {
            tima: 0,
            div: 0,
            tma: 0,
            tac: 0
        }
        
        this.tima_cycles = 0;
        this.div_cycles = 0;

        this.frequency = 0;
    }

    reset() {
        this.regs.tima = 0;
        this.regs.div  = 0; 
        this.regs.tma  = 0;
        this.regs.tac  = 0;
        this.div_cycles = 0;
        this.tima_cycles = 0;
    }

    updateTimers(cpu) {
        let cycles = cpu.cycles;
        
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
                //this.shouldReload = true;
                this.regs.tima = this.regs.tma;
                cpu.requestInterrupt(InterruptType.timer);
            } else {
                this.regs.tima++;
            }
            
            this.regs.tima &= 255;
        }
    }
    
    increaseDiv(cycles) {
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
        this.regs.div_cycles = 0;
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