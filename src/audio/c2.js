class Channel2 extends Channel1 {
    constructor(parent) {
        super(parent);

        this.NRx0 = 0xff15; // never used hehehehe
        this.NRx1 = 0xff16;
        this.NRx2 = 0xff17;
        this.NRx3 = 0xff18;
        this.NRx4 = 0xff19;
    }

    accepts(addr) {
        return addr >= 0xFF16 && addr <= 0xFF19;
    }

    write8(addr, byte) {
        super.write8(addr, byte);
    }

    read8(addr) {
        // abuse the fact that the reads for channel 1 and 2 are the exact same!
        return super.read8(addr);
    }
}