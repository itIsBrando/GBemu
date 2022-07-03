class SerialPort {
    constructor(cpu) {
        this.parent = cpu;
        this.sc = 0;
        this.sb = 0;
        
        this.cycles = 0;
        this.inProgress = false;
    }
    
    reset() {
        this.sb = 0;
        this.sc = 0;
        
        this.cycles = 0;
        this.inProgress = false;
    }
    
    tick(c) {
        if(!this.inProgress)
            return;
        
        this.cycles += c;
        
        // running at 8192Hz for DMG
        if(this.cycles > 512 * 8) {
            this.sendByte();
        }
    }
    
    set master(v) {
        this.sc = v ? this.sc | 1 : this.sc & 0xfe;
    }
    
    get master() {
        return UInt8.getBit(this.sc, 7);
    }
    
    accepts(addr) {
        return addr == 0xff01 || addr == 0xff02;
    }
    
    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 1:
                this.sb = byte;
                break;
            case 2:
                this.sc = byte & 0xf3;
                
                if(this.master && UInt8.getBit(this.sc, 7))
                    this.start();
                break;
        }
    }
    
    read8(addr) {
        switch(addr & 0xFF) {
            case 1:
                return this.sb;
            case 2:
                return this.sc;
        }
    }
    
    
    sendByte() {
        
        this.inProgress = false;
        
        this.sc &= 0x7F;
        Link.attemptTransfer(this.sb, this.master);
        
        this.parent.requestInterrupt(InterruptType.serial);
    }
    
    start() {
        this.inProgress = true;
    }
    
}