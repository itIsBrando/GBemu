const WIDTH = 160;
const HEIGHT= 144;

const FilterType = {
    none: 0,
    scale2x: 1,
    scale3x: 2,
    length: 3,
};

const FilterScaleFactor = [1, 2, 3];

class Filter {
    static current = 0;

    constructor(canvasElem, scaleBy) {
        this.target = canvasElem;
        this.data = null;
        this.out = new Uint32Array(WIDTH * 4 * HEIGHT * 4);

        this.setScale(scaleBy);
    }

    setScale(scaleBy) {
        this.scaleFactor = scaleBy;

        this.width = scaleBy * WIDTH;
        this.height = scaleBy * HEIGHT;

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


    createImageData() {
        const outArray = new Uint8ClampedArray(this.width * this.height * 4);
        let i = 0;

        for(let x = 0; x < this.width * this.height; x++) {
            let short = this.out[x];

            for(let j = 0; j < 4; j++) {
                outArray[i++] = short & 0xff;
                short >>= 8;
            }
        }

        return new ImageData(outArray, this.width, this.height);
    }

    /**
     * 
     * @param {ImageData} data
     * @returns {ImageData}
     */
    apply(data) {
        const funcs = [
            this.nofilter,
            this.scale2x,
            this.scale3x,
        ]

        switch(Filter.current) {
            case FilterType.none:
                return data;
            case FilterType.scale2x:
                return this.scale2x(new Uint32Array(data.data.buffer));
            case FilterType.scale3x:
                return this.scale3x(new Uint32Array(data.data.buffer));
        }

    }


    static change(elem) {
        Filter.current++;
        Filter.current %= FilterType.length;

        // set canvas size
        c.renderer.filter.setScale(FilterScaleFactor[Filter.current]);
        
        // set button text
        elem.innerText = Object.keys(FilterType)[Filter.current];

        c.renderer.drawBuffer();
    }

}