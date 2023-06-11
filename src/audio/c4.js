class Channel4 extends Channel1 {


    accepts(addr) {
        return (addr >= 0xff20 && addr <= 0xff23);
    }

    write8(addr, byte) {
        switch(addr & 0xFF) {
            case 0x20:
            case 0x21:
            case 0x22:
            case 0x23:
        }
    }

    read8(addr) {
        switch(addr & 0xFF) {
            case 0x20:
                return 0xff;
            case 0x21:
                return 0xff;
            case 0x22:
                return 0xff;
            case 0x23:
                return 0xff;
        }
    }
    
}