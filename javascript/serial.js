class SerialPort {
    constructor(cpu) {
        this.parent = cpu;
        this.sc = 0;
        this.sb = 0;
        
        this.cycles = 0;
        this.inProgress = false;
        this.freq = 512;
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
        if(this.cycles > (this.freq << 3)) {
            this.receiveByte();
        }
    }
    
    set master(v) {
        this.sc = v ? this.sc | 1 : this.sc & 0xfe;
    }
    
    get master() {
        return (this.sc & 1) == 1;
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
                
                if(this.parent.cgb)
                    if(UInt8.getBit(this.sc, 1))
                        this.freq = 16; // fast
                    else
                        this.freq = 512; // normal
                    
                
                if(this.master && UInt8.getBit(this.sc, 7)) {
                    this.start();
                }
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
    
    receiveByte() {
        this.inProgress = false;
        
        this.sc &= 0x7f;
        this.sb = Transfer.receive(this.master);
        
        this.parent.requestInterrupt(InterruptType.serial);
    }
    
    checkSendSlave() {
        Transfer.send(this.sb, this.master);
    }
    
    start() {
        this.inProgress = true;
    }
    
}