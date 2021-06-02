class Timer {
    constructor() {
        this.divCycles = 0;
        this.shouldReload = false;

        this.regs = {
            tima: 0,
            div: 0,
            tma: 0,
            tac: 0
        }

        this.frequency = 0;
    }

    reset() {
        this.regs.tima = 0;
        this.regs.div  = 0; 
        this.regs.tma  = 0;
        this.regs.tac  = 0;
        this.divCycles = 0; 
    }

    updateTimers(cpu) {
        let cycles = cpu.cycles;
        
        this.increaseDiv(cycles);

        if(this.shouldReload)
        {
            this.regs.tima = this.regs.tma;
            this.shouldReload = false;
            cpu.requestInterrupt(InterruptType.timer);
        }
        
        // return if timer is disabled
        if(!UInt8.getBit(this.regs.tac, 2))
            return;

        this.frequency -= cycles;
    
        if(this.frequency > 0) { return }
        
        this.setClockFrequency();

        // if we are about to overflow
        if(this.regs.tima == 0xFF)
            this.shouldReload = true;

        this.regs.tima++;
        this.regs.tima &= 255;
    }
    
    
    increaseDiv(cycles) {
        this.divCycles += cycles;
        if(this.divCycles >= 256) {
            this.regs.div++;
            this.regs.div &= 0xFF;
            this.divCycles -= 256;
        }

    }

    setClockFrequency() {
        switch(this.regs.tac & 0x3) {
            case 0: this.frequency = 1024; break;
            case 1: this.frequency = 16; break;
            case 2: this.frequency = 64; break;
            case 3: this.frequency = 256; break;
        }
    }
}