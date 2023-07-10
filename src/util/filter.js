const WIDTH = 160;
const HEIGHT= 144;

const FilterType = {
    none: 0,
    scale2x: 1,
    scale3x: 2,
    LCD: 3,
    Monochrome: 4,
};

const changeFilterElem = document.getElementById('changeFilter');
const filterScreen = document.getElementById('filterScreen');

const FilterScaleFactor = [
    1,
    2,
    3,
    3,
    1
];


class Filter {
    static current = 0;
    static supportsWasm = false;

    constructor(canvasElem, scaleBy) {
        this.target = canvasElem;
        this.data = null;
        this.out = null;

        this.setScale(scaleBy);

        Filter.supportsWasm = typeof Filter.wasmScale2x == "function";

        this.setBorder("#00000040");
    }

    setBorder(colorString) {
        let ctx = filterScreen.getContext('2d');

        ctx.strokeStyle = colorString;
        for(let y = 0; y < 144; y++) {
            ctx.rect(0, y * 7, filterScreen.width, y * 7);
        }
        for(let x = 0; x < 160; x++) {
            ctx.rect(x * 7, 0, x * 7, filterScreen.height);

        }
        ctx.stroke();
    }

    setScale(scaleBy) {
        this.scaleFactor = scaleBy;

        this.width = scaleBy * WIDTH;
        this.height = scaleBy * HEIGHT;
        this.out = new Uint32Array(this.width * this.height);

        this.target.width = this.width;
        this.target.height = this.height;
    }


    getpx(x, y) {
        if(x >= WIDTH || y >= HEIGHT || x < 0 || y < 0)
            return 0;

        return this.data[x + y * WIDTH];
    }

    setoutpx(x, y, c) {
        if(x >= this.width || y >= this.height || x < 0 || y < 0)
            return;

        this.out[x + y * this.width] = c;
    }

    scale2x(d) {
        this.data = d;

        for(let y = 0; y < HEIGHT; y++) {
            for(let x = 0; x < WIDTH; x++) {
                let e0, e1, e2, e3;
                let a = this.getpx(x, y - 1);
                let b = this.getpx(x + 1, y);
                let c = this.getpx(x - 1, y);
                let d = this.getpx(x, y + 1);

                e0 = e1 = e2 = e3 = this.getpx(x, y);

                if(c == a && c != d && a != b)
                    e0 = a;
                if(a == b && a != c && b != d)
                    e1 = b;
                if(d == c && d != b && c != a)
                    e2 = c;
                if(b == d && b != a && d != c)
                    e3 = d;

                this.setoutpx(x << 1, y << 1, e0);
                this.setoutpx((x << 1) + 1, y << 1, e1);
                this.setoutpx(x << 1, (y << 1) + 1, e2);
                this.setoutpx((x << 1) + 1, (y << 1) + 1, e3);
            }
        }

        return this.createImageData();
    }


    scale3x(d) {
        this.data = d;

        for(let y = 0; y < HEIGHT; y++) {
            for(let x = 0; x < WIDTH; x++) {
                let e0, e1, e2, e3, e4, e5, e6, e7, e8, e;
                let a = this.getpx(x - 1, y - 1);
                let b = this.getpx(x, y - 1);
                let c = this.getpx(x + 1, y - 1);
                let d = this.getpx(x - 1, y);
                let f = this.getpx(x + 1, y);
                let g = this.getpx(x - 1, y + 1);
                let h = this.getpx(x, y + 1);
                let i = this.getpx(x + 1, y + 1);

                e = e0 = e1 = e2 = e3 = e4 = e5 = e6 = e7 = e8 = this.getpx(x, y);

                if(d==b && d!=h && b!=f)
                    e0 = d;
                if((d==b && d!=h && b!=f && e!=c) || (b==f && b!=d && f!=h && e!=a))
                    e1 = b;
                if(b==f && b!=d && f!=h)
                    e2 = f;
                if((h==d && h!=f && d!=b && e!=a) || (d==b && d!=h && b!=f && e!=g))
                    e3 = d;
                if((b==f && b!=d && f!=h && e!=i) || (f==h && f!=b && h!=d && e!=c))
                    e5 = f;
                if(h==d && h!=f && d!=b)
                    e6 = d;
                if((f==h && f!=b && h!=d && e!=g) || (h==d && h!=f && d!=b && e!=i))
                    e7 = h;
                if(f==h && f!=b && h!=d)
                    e8 = f;

                const xout = x * 3, yout = y * 3;

                this.setoutpx(xout - 1, yout - 1, e0);
                this.setoutpx(xout, yout - 1, e1);
                this.setoutpx(xout + 1, yout - 1, e2);
                this.setoutpx(xout - 1, yout, e3);
                this.setoutpx(xout, yout, e4);
                this.setoutpx(xout + 1, yout, e5);
                this.setoutpx(xout - 1, yout + 1, e6);
                this.setoutpx(xout, yout + 1, e7);
                this.setoutpx(xout + 1, yout + 1, e8);
            }
        }

        return this.createImageData();
    }

    brighten(color, intensity) {
        let r = (color >> 16) * intensity,
        g = ((color >> 8) & 0xff) * intensity,
        b = (color & 0xff) * intensity;

        r = Math.min(r, 255);
        g = Math.min(g, 255);
        b = Math.min(b, 255);

        return 0xff000000 | (r << 16) | (g << 8) | b;
    }

    lcd(data) {
        let j = 0;
        for(let y = 0; y < 144; y++) {
            for(let x = 0; x < 160; x++) {
                const rr = data[j];
                const rg = (0x71 * data[j] + 1) >> 8;
                const rb = (0x45 * data[j] + 1) >> 8;
                const color_r = 0xff00_0000 | (rb << 16) | (rg << 8) | (rr);
                this.setoutpx(x * 3, y * 3, color_r);
                this.setoutpx(x * 3, y * 3 + 1, color_r);
                this.setoutpx(x * 3, y * 3 + 2, this.brighten(color_r, 0.8));
                j += 1;

                const gr = (0xc1 * data[j] + 1) >> 8;
                const gg = (0xd6 * data[j] + 1) >> 8;
                const gb = (0x50 * data[j] + 1) >> 8;
                const color_g = 0xff00_0000 | (gb << 16) | (gg << 8) | (gr);
                this.setoutpx(x * 3 + 1, y * 3, color_g);
                this.setoutpx(x * 3 + 1, y * 3 + 1, color_g);
                this.setoutpx(x * 3 + 1, y * 3 + 2, this.brighten(color_g, 0.8));
                j += 1;

                const br = (0x3b * data[j] + 1) >> 8;
                const bg = (0xce * data[j] + 1) >> 8;
                const bb = data[j];
                const color_b = 0xff00_0000 | (bb << 16) | (bg << 8) | br;
                this.setoutpx(x * 3 + 2, y * 3, color_b);
                this.setoutpx(x * 3 + 2, y * 3 + 1, color_b);
                this.setoutpx(x * 3 + 2, y * 3 + 2, this.brighten(color_b, 0.8));
                j += 2; // skip alpha
            }
        }

        return this.createImageData();
    }


    createImageData() {
        const outArray = new Uint8ClampedArray(this.out.buffer);

        return new ImageData(outArray, this.width, this.height);
    }

    /**
     *
     * @param {ImageData} data
     * @returns {ImageData}
     */
    apply(data) {
        switch(Filter.current) {
            case FilterType.none:
            case FilterType.Monochrome:
                return data;
            case FilterType.LCD:
                // if(Filter.supportsWasm) {
                    // Filter.wasmLcd(data.data, this.out);
                    // return this.createImageData();
                // } else {
                    return this.lcd(data.data);
                // }
            case FilterType.scale2x:
                if(Filter.supportsWasm) {
                    Filter.wasmScale2x(new Uint32Array(data.data.buffer), this.out);
                } else {
                    this.scale2x(new Uint32Array(data.data.buffer));
                }
                return this.createImageData();
            case FilterType.scale3x:
                if(Filter.supportsWasm) {
                    Filter.wasmScale3x(new Uint32Array(data.data.buffer), this.out);
                } else {
                    this.scale3x(new Uint32Array(data.data.buffer));
                }
                return this.createImageData();
        }

    }

    static change(i) {
        Filter.current = i;

        changeFilterElem.innerText = Object.keys(FilterType)[i];

        // set canvas size
        c.renderer.filter.setScale(FilterScaleFactor[Filter.current]);

        if(Filter.current === FilterType.LCD) {
            canvas.style.imageRendering = "auto";
            canvas.style.filter = "blur(1px)";
        } else {
            canvas.style.imageRendering = "pixelated";
            canvas.style.filter = "none";
        }

        if(Filter.current === FilterType.Monochrome) {
            showElement(filterScreen);
        } else {
            hideElement(filterScreen);
        }

        c.renderer.drawBuffer();

        if(c.romLoaded) {
            Settings.hide();
            pauseEmulation(); // keep this jawn paused
            setTimeout(
                Settings.show, 425
            )
        }
    }

}