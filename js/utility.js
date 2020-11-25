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
 * Reads the game title embeded inside the ROM
 * @returns
 */
function readROMName() {
    let str = "";
    let i = 0;

    if(c.mem.rom[0x134] == 0)
        return null;

    do {
        str += String.fromCharCode(c.mem.rom[0x134 + i]);
        i++;
    } while(i <= 16 && c.mem.rom[0x134 + i] != 0);
    return str;
}


function hex(v) {
    return v.toString(16);
}







const messageDiv = document.getElementById('messageID');
const messageConfirm = document.getElementById('messageConfirm');

messageConfirm.onclick = hideMessage;

/**
 * Shows a message to the user
 * @param {String} string message to tell
 * @param {String?} title string to display at the top
 */
function showMessage(string, title) {
    const messageContent = document.getElementById('messageContent');
    const messageHeader = document.getElementById('messageHeader');
    messageContent.textContent = string;
    messageHeader.textContent = title || "ALERT";
    // show 
    messageDiv.style.display = "block";
    
    messageDiv.style.opacity = "1";
}


function hideMessage() {
    // hide
    messageDiv.style.opacity = "0";
    setTimeout(function() {
        messageDiv.style.display = "none";
    }, 600);
}