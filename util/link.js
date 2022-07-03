const ID_PREFIX = "GbEmUlInKKAbLE";
const OPTIONS = {
};

const PacketType = {
    StartTransfer: 0,
    EndTransfer: 1,
}


const LinkDiv = document.getElementById('LinkDiv');
var conn, peer;

var Link = new function() {
    
    this.error = function(err) {
        console.log(`ERROR:   ${err.type}`);
    }
    
    
    this.setupPeer = function() {
        peer.on('error', this.error);
        
        peer.on('open', function(id) {
            console.log(id)
        });
    }
    
    this.setupConnection = function(c) {
        console.log('connected');
        conn = c;
        
        conn.on('data', function(data) {
            console.log(data);
        });
        
        showMessage("Connected to other emulator!", "Success");
    }
    
    this.startSess = function() {
        const m = PromptMenu.new("Generate a unqiue Code", "code", /\w+/g, 10, (v) => {
            peer = new Peer(ID_PREFIX + v, OPTIONS);
            
            this.setupPeer();
            
            peer.on('open', (id) => {
                showMessage(`Session started with code <b>${v}</b>`, "Waiting for Response");
            });
            
            peer.on('connection', function(c) {
                this.setupConnection(c);
            });
        });
        
        PromptMenu.show(m);
    }
    
    this.joinSess = function() {
        const m = PromptMenu.new("Enter session code", "code", /[0-9a-zA-Z]+/g, 10, (v) => {
            peer = new Peer(ID_PREFIX+'sender', OPTIONS);
            
            this.setupPeer();
            
            conn = peer.connect(ID_PREFIX + v);
            
            console.log(conn);
            
            conn.on('open', () => {
                this.setupConnection(conn);
                console.log('hi', conn);
                conn.send({hello:"test"});
            });
        });
        
        PromptMenu.show(m);
    }
    
    this.connected = function() {
        if(!conn)
            return false;
            
        return conn.open;
    }
    
    this.attemptTransfer = function(byte, isMaster) {
        if(!this.connected())
            return;
            
        conn.send({
            type: PacketType.SendMaster,
            data: isMaster
        });
    }
    
    this.start = function() {
        showElement(LinkDiv);
    }
    
    this.hide = function() {
        hideElement(LinkDiv);
    }
};