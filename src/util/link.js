/**

This feature has been untested. Idea will likely be scraped or
  WebRTC will be used. It is unlikely that a server will be set up for
  full peer-to-peer support
*/

const LinkDiv = document.getElementById('LinkDiv');
var conn, peer;

var Link = new function() {
    this.startSess = function() {
        Menu.message.show(`Open this URL in another tab and join the session`, "Started Session");
        Transfer.setMaster();
    }
    
    this.joinSess = function() {
        if(Transfer.setSlave())
            Menu.message.show(`Session joined.`, "Success");
        else
            Menu.message.show("No session to join. Create a session first", "Unable to Connect");
    }
    
    this.start = function() {
        showElement(LinkDiv);
    }
    
    this.hide = function() {
        hideElement(LinkDiv);
    }
};


class Transfer {
    static isMaster = false;
    static linked = false;
    
    constructor(byte, isMaster) {
        this.byte = byte;
        this.master = isMaster;
        this.completed = false;
    }
    
    static active(v) {
        const key = "__core_serial_active";
        if(v == null)
            return (localStorage.getItem(key) || "false") == "true";
        
        localStorage.setItem(key, v);
    }
    
    static getKey(isMaster) {
        return `__core_serial_out_byte_${isMaster ? 'master' : 'slave'}`;
    }
    
    static setMaster() {
        Transfer.isMaster = true;
        localStorage.setItem(`__core_serial_handshake`, 'true');
    }
    
    static setSlave() {
        Transfer.isMaster = false;
        return localStorage.getItem('__core_serial_handshake') == 'true';
    }
    
    static send(b, isMaster) {
        const key = Transfer.getKey(isMaster);
        
        if(isMaster) {
            Transfer.active(true);
        }
        
        const str = JSON.stringify(new Transfer(b, isMaster));
        localStorage.setItem(key, str);
    }
    
    static receive(isMaster) {
        const key = Transfer.getKey(!isMaster);
        
        const obj = JSON.parse(localStorage.getItem(key));
        
        if(isMaster)
            Transfer.active(false);
        
        return obj.byte;
    }
    
    static init() {
        localStorage.setItem(Transfer.getKey(true), 0xff);
        localStorage.setItem(Transfer.getKey(false), 0xff);
        localStorage.setItem(`__core_serial_handshake`, 'false');
    }
}

window.addEventListener('storage', e => {
    console.log(`Storage: key '${e.key}' value '${e.newValue}'`);
});


Transfer.init();