extern crate console_error_panic_hook;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}


fn get_px(data: &[u32], x: usize, y: usize) -> u32 {
    data[x + y * 160]
}

fn set_px(out: &mut [u32], x: usize, y: usize, width: usize, val: u32) {
    out[x + y * width] = val;
}


#[wasm_bindgen]
pub fn lcd_filter(data: &[u8], out: &mut [u32]) {
    const WIDTH: usize = 160 * 3;
    let mut j = 0;

    for y in 0..144 {
        for x in 0..160 {
            let rr = data[j] as u32;
            let rg = (0x71 * (data[j] as u32) + 1) >> 8;
            let rb = (0x45 * (data[j] as u32) + 1) >> 8;
            let color_r = 0xff00_0000 | (rb << 16) | (rg << 8) | (rr);
            set_px(out, x * 3, y * 3, WIDTH, color_r);
            set_px(out, x * 3, y * 3 + 1, WIDTH, color_r);
            set_px(out, x * 3, y * 3 + 2, WIDTH, color_r);
            j += 1;

            let gr = (0xc1 * (data[j] as u32) + 1) >> 8;
            let gg = (0xd6 * (data[j] as u32) + 1) >> 8;
            let gb = (0x50 * (data[j] as u32) + 1) >> 8;
            let color_g = 0xff00_0000 | (gb << 16) | (gg << 8) | (gr);
            set_px(out, x * 3 + 1, y * 3, WIDTH, color_g);
            set_px(out, x * 3 + 1, y * 3 + 1, WIDTH, color_g);
            set_px(out, x * 3 + 1, y * 3 + 2, WIDTH, color_g);
            j += 1;

            let br = (0x3b * (data[j] as u32) + 1) >> 8;
            let bg = (0xce * (data[j] as u32) + 1) >> 8;
            let bb = data[j] as u32;
            let color_b = 0xff00_0000 | (bb << 16) | (bg << 8) | br;
            set_px(out, x * 3 + 2, y * 3, WIDTH, color_b);
            set_px(out, x * 3 + 2, y * 3 + 1, WIDTH, color_b);
            set_px(out, x * 3 + 2, y * 3 + 2, WIDTH, color_b);
            j += 2; // skip alpha
        }
    }

}


#[wasm_bindgen]
pub fn scale3x(data: &[u32], out: &mut [u32]) {
    const WIDTH: usize = 160 * 3;
    for y in 1..144 - 1 {
        for x in 1..160 - 1 {
            let mut ee = [get_px(data, x, y); 9];

            // let a = get_px(data, x, y.saturating_sub(1));
            // let b = get_px(data, x + 1, y);
            // let c = get_px(data, x.saturating_sub(1), y);
            // let d = get_px(data, x, y + 1);
            let a = get_px(data, x - 1, y - 1);
            let b = get_px(data, x, y - 1);
            let c = get_px(data, x + 1, y - 1);
            let d = get_px(data, x - 1, y);
            let e = ee[0]; // at this point any element of `e` is the center pixel
            let f = get_px(data, x + 1, y);
            let g = get_px(data, x - 1, y + 1);
            let h = get_px(data, x, y + 1);
            let i = get_px(data, x + 1, y + 1);


            if d==b && d!=h && b!=f {
                ee[0] = d;
            }
            if (d==b && d!=h && b!=f && e!=c) || (b==f && b!=d && f!=h && e!=a) {
                ee[1] = b;
            }
            if b==f && b!=d && f!=h {
                ee[2] = f;
            }
            if (h==d && h!=f && d!=b && e!=a) || (d==b && d!=h && b!=f && e!=g) {
                ee[3] = d;
            }
            if (b==f && b!=d && f!=h && e!=i) || (f==h && f!=b && h!=d && e!=c) {
                ee[5] = f;
            }
            if h==d && h!=f && d!=b {
                ee[6] = d;
            }
            if (f==h && f!=b && h!=d && e!=g) || (h==d && h!=f && d!=b && e!=i) {
                ee[7] = h;
            }
            if f==h && f!=b && h!=d {
                ee[8] = f;
            }

            let xout = x * 3;
            let yout = y * 3;

            set_px(out, xout - 1, yout - 1, WIDTH, ee[0]);
            set_px(out, xout, yout - 1, WIDTH, ee[1]);
            set_px(out, xout + 1, yout - 1, WIDTH, ee[2]);
            set_px(out, xout - 1, yout, WIDTH, ee[3]);
            set_px(out, xout, yout, WIDTH, ee[4]);
            set_px(out, xout + 1, yout, WIDTH, ee[5]);
            set_px(out, xout - 1, yout + 1, WIDTH, ee[6]);
            set_px(out, xout, yout + 1, WIDTH, ee[7]);
            set_px(out, xout + 1, yout + 1, WIDTH, ee[8]);
        }
    }
}


#[wasm_bindgen]
pub fn scale2x(data: &[u32], out: &mut [u32]) {
    for y in 1..144 - 1 {
        for x in 1..160 - 1 {
            let a = get_px(data, x, y - 1);
            let b = get_px(data, x + 1, y);
            let c = get_px(data, x - 1, y);
            let d = get_px(data, x, y + 1);

            let mut e0: u32 = get_px(data, x, y);
            let mut e1: u32 = e0;
            let mut e2: u32 = e0;
            let mut e3: u32 = e0;

            if c == a && c != d && a != b {
                e0 = a;
            }
            if a == b && a != c && b != d {
                e1 = b;
            }
            if d == c && d != b && c != a {
                e2 = c;
            }
            if b == d && b != a && d != c {
                e3 = d;
            }

            set_px(out, x << 1, y << 1, 320, e0);
            set_px(out, (x << 1) + 1, y << 1, 320, e1);
            set_px(out, x << 1, (y << 1) + 1, 320, e2);
            set_px(out, (x << 1) + 1, (y << 1) + 1, 320, e3);
        }
    }
}