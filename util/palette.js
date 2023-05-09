const ALL_PALETTES = {
    "Default": [
        [240, 255, 240],// lighest
        [170, 210, 170],// lighter
        [85, 145, 85],  // darker
        [0, 40, 0],     // darkest
    ],
    "DMG": [
        [110, 177, 34],
        [84, 135, 25],
        [51, 83, 16],
        [19, 42, 6]
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
    const colorSelected = document.getElementById('colorSelected');
    const paletteSetDiv = document.getElementById('paletteSetDiv');
    const paletteTitle = document.getElementById('paletteTitle');
    const colorPreviews = [
        document.getElementById('colorPreview0'),
        document.getElementById('colorPreview1'),
        document.getElementById('colorPreview2'),
        document.getElementById('colorPreview3'),
    ];
    const paletteNames = Object.keys(ALL_PALETTES);
    
    // color index
    let currentPaletteIndex = 0;
    let appliedPaletteIndex = 0;
    
    this.show = function() {
        showElement(paletteSetDiv);
        this.onPaletteArrow(0);
    }
    
    // hides the palette selection menu
    this.hide = function() {
        hideElement(paletteSetDiv);
    }
    
    // sets the preview color's background color
    this.setPreviewCol = function() {
        const pal = ALL_PALETTES[paletteNames[currentPaletteIndex]];
        
        paletteTitle.innerText = paletteNames[currentPaletteIndex];
        for(let i = 0; i < 4; i++) {
            const col = "rgb(" + pal[i][0] + ', ' + pal[i][1] + ', ' + pal[i][2] + ')';
            colorPreviews[i].style.backgroundColor = col;
        }
    }


    this.applyPalette = function() {
        Renderer.setPalette(ALL_PALETTES[paletteNames[currentPaletteIndex]]);
        appliedPaletteIndex = currentPaletteIndex;
    }
    
    /**
     * Changes the color index that the user is editing
     * @param dir -1 to move left or 1 to move right
     */
    this.onPaletteArrow = function(dir) {
        if(currentPaletteIndex + dir < 0)
            currentPaletteIndex = paletteNames.length - 1;
        else
            currentPaletteIndex = (currentPaletteIndex + dir) % paletteNames.length;

        if(currentPaletteIndex == appliedPaletteIndex) {
            colorSelected.disabled = true;
            colorSelected.className = "menubtn-no-hover";
            colorSelected.innerText = "selected";
        } else {
            colorSelected.disabled = false;
            colorSelected.className = "menubtn";
            colorSelected.innerText = "select";
        }
        
        this.setPreviewCol();
    }

    this.apply = function() {
        const data = currentPaletteIndex;
        Settings.set_core("defaultPalette", data);
        this.applyPalette();
        this.onPaletteArrow(0);
    }

    this.load = function() {
        const palIndex = Settings.get_core("defaultPalette");

        if(!palIndex)
            return;

        currentPaletteIndex = Number(palIndex) || 0;
        this.applyPalette();

    }
}

Palette.load();