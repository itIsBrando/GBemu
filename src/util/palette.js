const ALL_PALETTES = {
    "Default": [
        [240, 255, 240],// lighest
        [170, 210, 170],// lighter
        [85, 145, 85],  // darker
        [0, 40, 0],     // darkest
    ],
    "DMG": [
        [0xd0, 0xe0, 0x40],
        [0xa0, 0xa8, 0x30],
        [0x60, 0x70, 0x28],
        [0x38, 0x48, 0x28]
    ],
    "Mild Blue": [
        [220, 230, 255],
        [170, 170, 220],
        [85, 85, 175],
        [0, 0, 80],
    ],
    "Mild Red": [
        [255, 230, 220],
        [220, 170, 170],
        [175, 85, 85],
        [80, 0, 0]
    ],
    "Dandelion": [
        [218, 172, 0],
        [166, 131, 6],
        [102, 80, 3],
        [38, 30, 1]
    ],
    "Teal": [
        [0, 147, 138],
        [0, 112, 105],
        [0, 69, 64],
        [0, 25, 24]
    ],
    "Pink": [
        [248, 192, 248],
        [232, 136, 136],
        [120, 48, 232],
        [40, 40, 152]
    ],
    "Rustic": [
        [0xed, 0xb4, 0xa1],
        [0xa9, 0x68, 0x68],
        [0x76, 0x44, 0x62],
        [0x2c, 0x21, 0x37]
    ],
    "Black & White": [
        [250, 250, 250],
        [170, 170, 170],
        [80, 80, 80],
        [0, 0, 0]
    ],
    "Inverted": [
        [0, 0, 0],
        [80, 80, 80],
        [170, 170, 170],
        [250, 250, 250]
    ],
};

var Palette = new function() {
    // color palette
    const paletteSetDiv = document.getElementById('paletteSetDiv');
    const paletteNames = Object.keys(ALL_PALETTES);

    // color index
    let appliedPaletteIndex = 0;

    this.show = function() {
        showElement(paletteSetDiv);
        Palette.draw();
    }

    // hides the palette selection menu
    this.hide = function() {
        hideElement(paletteSetDiv);
    }

    // sets the preview color's background color
    this.getPreviewCol = function(pal) {
        return `rgb(${pal[0]}, ${pal[1]}, ${pal[2]})`;
    }

    /**
     * Changes the color index that the user is editing
     */
    this.draw = function() {
        const PaletteList = document.getElementById('PaletteList');

        let s = '';

        for(let i in paletteNames) {
            const key = paletteNames[i];
            const bg = i == appliedPaletteIndex ? 'var(--ui-accent)' : 'var(--ui-primary-button)';
            const prototype = `
            <div class="menubtn palette-card" style="background: ${bg};" onclick="Palette.apply(${i});">
                    <div class="palette-menu-text">${key}</div>
                    <div class="palette-menu">
                        <div style="background: ${this.getPreviewCol(ALL_PALETTES[key][0])}"></div>
                        <div style="background: ${this.getPreviewCol(ALL_PALETTES[key][1])}"></div>
                        <div style="background: ${this.getPreviewCol(ALL_PALETTES[key][2])}"></div>
                        <div style="background: ${this.getPreviewCol(ALL_PALETTES[key][3])}"></div>
                    </div>
            </div>`;

            s += prototype;
        }

        PaletteList.innerHTML = s;
    }


    this.setPalette = function(i) {
        if(i > paletteNames.length - 1)
            i = 0;

        Renderer.setPalette(ALL_PALETTES[paletteNames[i]]);
        appliedPaletteIndex = i;
    }


    this.apply = function(i) {
        const data = i;
        Settings.set_core("defaultPalette", data);
        this.setPalette(i);
        this.draw();
    }

    this.load = function() {
        const palIndex = Settings.get_core("defaultPalette");

        // this conversion will always produce a number.
        this.setPalette(Number(palIndex) | 0);

    }
}