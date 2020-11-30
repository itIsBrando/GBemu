"use strict";

class UInt16 {

    /**
     * Creates an unsigned integer
     * @param {number} num
     */
    constructor(num) {
        this.value = num == null ? 0 : num & 0xFFFF;
    }

    /**
     * @param {number} _v
     */
    set v(_v) {
        this.value = _v & 0xFFFF;
    }

    /**
     * @returns {number}
     */
    get v() {
        return this.value;
    }

    /**
     * @returns {number} uint8
     */
    get low() {
        return this.value & 0xFF;
    }

    /**
     * @returns {number} uint8
     */
    get high() {
        return this.value >> 8;
    }

    /**
     * @param {number} uint8
     */
    set low(uint8) {
        this.value &= 0xFF00;
        this.value |= uint8 & 0xFF;
    }

    /**
     * @param {number} uint8
     */
    set high(uint8) {
        this.value &= 0x00FF;
        this.value |= (uint8 & 0xFF) << 8;
    }

    /**
     * Creates a 16-bit number, not a UInt16 object
     * @param {UInt8} a MSB
     * @param {UInt8} b LSB
     * @returns {number} a number between 0x0000-0xFFFF
     */
    static makeWord(a, b) {
        return ((a & 0xFF) << 8) | (b & 0xFF);
    }

    /**
     * Converts a signed 8-bit number into a signed 16-bit number
     * @param {UInt8} a 8-bit signed number to convert to 16-bit signed
     */
    static toSigned(a) {
        a &= 0xFF;
        if(a > 127) {
            return a | 0xFF00;
        } else {
            return a;
        }
    }

    /**
     * Reverses the bit order of a 16-bit number
     * @param {UInt16} a 16-bit number
     */
    static reverseBits(a)
    {
        let result = 0;
        for(let i = 0; i < 16; i++) 
        {
            result = (result << 1) | (a & 1);
            a >>= 1;
        }
        return result;
    }
}


class UInt8 {
    
    /**
     * Creates an unsigned integer between 0x00-0xFF
     * @param {number} num
     */
    constructor(num) {
        this.value = num == null ? 0 : num & 0xFF;
    }

    /**
     * @param {number} _v
     */
    set v(_v) {
        this.value = _v & 0xFF;
    }

    get v() {
        return this.value;
    }

    /**
     * Returns a bit of a UInt8 or UInt16
     * @param {number} v number
     * @param {number} bit bit number (0-15) or (0-7)
     */
    static getBit(v, bit) {
        return (v >> bit) & 1;
    }
    /**
     * Sets a bit of a UInt8 or UInt16
     * @param {number} v number
     * @param {number} bit bit number (0-15) or (0-7)
     */
    static setBit(v, bit) {
        return v | (1 << bit);
    }
    /**
     * Clears a bit of a UInt8 or UInt16
     * @param {number} v number
     * @param {number} bit bit number (0-15) or (0-7)
     */
    static clearBit(v, bit) {
        return (v & ~(1<<bit)) & 0xFF;
    }

}
