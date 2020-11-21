/**
 * Enters full screen if possible, or does nothing
 * @returns true if we could get fullscreen, otherwise false
 */
function requestFullscreen() 
{
    if(canvas.requestFullscreen)
    {
        canvas.requestFullscreen();
        return true;
    } else if(canvas.webkitRequestFullscreen)
    {
        canvas.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        return true;
    } else if(canvas.msRequestFullscreen)
    {
        canvas.msRequestFullscreen();
        return true;
    }

    return false;
}

/**
 * Exits full screen mode if possible
 */
function exitFullscreen() {
    if(canvas.requestFullscreen)
    {
        canvas.exitFullscreen();
    } else if(canvas.webkitRequestFullscreen)
    {
        canvas.webkitExitFullscreen();
    } else if(canvas.msRequestFullscreen)
    {
        canvas.msExitFullscreen();
    }
}

/**
 * Shows/Hides a menu
 * @param {number} num index of the menu entry
 */
function toggleMenu(num) {
    const wasShown = menus[num].shown;
    // hide all other menus
    for(let i = 0; i < menus.length; i++) {
        menus[i].shown = false;
        menus[i].shown = false;
        menus[i].div.style.display = "none";
        menus[i].header.style.backgroundColor = "aquamarine";
    }

    if(wasShown)
        return;

    // show this one
    menus[num].shown = true;
    menus[num].div.style.display = "block";
    menus[num].header.style.backgroundColor = "lightblue";
}

/**
 * Reads the game title embeded inside the ROM
 * @returns
 */
function readROMName() {
    let str = "";
    let i = 0;
    do {
        str += String.fromCharCode(c.mem.rom[0x134 + i]);
        i++;
    } while(i <= 16 && c.mem.rom[0x134 + i] != 0);
    return str;
}