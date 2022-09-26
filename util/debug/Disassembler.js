const DisassemblyDiv = document.getElementById('DisassemblyDiv');
const DisText = document.getElementById('DisasmContent');
const DisScrollDiv = DisassemblyDiv.getElementsByTagName('div')[0];


var Disassembler = new function() {
    const INSTR_SHOWN = 65;
    this.scrolling = false;
    this.numInstructions = INSTR_SHOWN;
    this.base = 0x200; // inclusive
    this.end = 0x200; // exclusive



    this.init = function() {
        // Add scroll event to disassembler
        DisScrollDiv.addEventListener("scroll", (e) => {
            if(Disassembler.scrolling)
                return;
            
            window.requestAnimationFrame(() => {
                if(Math.ceil(e.target.clientHeight + e.target.scrollTop) >= e.target.scrollHeight) {
                    Disassembler.scroll();
                }
                Disassembler.scrolling = false;
            });
            
            Disassembler.scrolling = true;
        });

        this.show();
    }

    this.isInRange = function(addr) {
        return addr >= this.base && addr < this.end;
    }

    /**
     * 
     * @param {Opcode} op 
     * @returns {String}
     */
    this.getLine = function(op) {
        let s = ` ${hex(op.address, 4, '')} | ${op.getOpcodeString().padEnd(6)} :    ${op.getString()}<br>`;

        if(op.address == c.pc.v) {
            s = `<b style="background-color: green; color: white; padding-right: 1rem;">${s}</b>`;
        }
        
        return s;
    }

    /**
     * Draws one line to `DisText`
     * @param {Number} addr Address to render
     * @param {Dictionary?} flags Optional list of flags
     * @returns Opcode at `addr`
     */
    this.renderLine = function(addr, flags={}) {
        const o = new Opcode(addr);
        const len = o.getLength();
        let s = this.getLine(o);

        if('highlight' in flags && flags['highlight'] == addr) {
            s = `<i style="background:teal;">${s}</i>`;
        }

        let lbl = Opcode.getAddressName(addr);
        if(lbl != '') {
            s = `<b style="color:white;">${lbl.replace(' ', '_').replace(/; +/g, '')}</b>:<br>${s}`;
        }
        
        DisText.innerHTML += s;
        return o;
    }

    /**
     * @param {Number} startPC base address
     * @param {Number} numInstr num of lines to draw
     * @param {Dictionary?} flags Optional list of flags
     */
    this.render = function(startPC=this.base, numInstr=this.numInstructions, flags={}) {
        let i = 0;
        let addr = startPC;

        DisText.innerHTML = "";
        
        this.base = startPC;

        while(i < numInstr) {
            const o = this.renderLine(addr, flags);
            
            addr += o.getLength();
            i++;
        }

        this.numInstructions = i;
        this.end = addr;

        Debug.showRegister();
    }

    /**
     * Appends instructions to the current rendering
     */
    this.renderTail = function() {
        let i = 15;
        let addr = this.end;

        this.numInstructions += i;

        while(i > 0) {
            const o = this.renderLine(addr);

            addr += o.getLength();
            i--;
        }

        this.end = addr;
    }


    this.show = function() {
        showElement(DisassemblyDiv, 'grid');
        DisScrollDiv.scrollTo(0, 0);
        this.numInstructions = INSTR_SHOWN;

        this.render(c.pc.v);
    }

    this.hide = function() {
        hideElement(DisassemblyDiv);
    }

    this.scroll = function() {
        this.renderTail();
    }

    this.step = function() {
        do {
			c.execute();
		} while(c.isHalted);

        if(this.isInRange(c.pc.v))
            this.numInstructions++;
        else {
            this.base = c.pc.v;
            this.numInstructions = INSTR_SHOWN;
        }
        
        this.render();
    }


    this.stepLine = function() {
        const exclude = [0xE9, 0xC3, 0x18, 0xC0, 0xD0, 0xC8, 0xC9, 0xD8, 0xD9];
        const condBranches = [0x20, 0x30, 0x28, 0x38, 0xC2, 0xD2, 0xCA, 0xDA];
        
        const op = c.read8(c.pc.v);
        let target = c.pc.v + Opcode.getOpLength(op);
        let cnt = 20000; // max iterations
        
        // if we are a branch or return, then we do not want to go to next line
        if(exclude.includes(op) || (condBranches.includes(op) && c.read8(c.pc.v + 1) < 0x80)) {
            c.execute();
        } else { 
            do {
                c.execute();
                if(cnt-- == 0)
                    break;
            } while(c.isHalted || c.pc.v != target);
        }

        if(this.isInRange(c.pc.v))
            this.render();
        else
            this.render(c.pc.v);
    }

    this.stepOut = function() {
        const rets = [0xE9, 0xC3, 0x18, 0xC0, 0xD0, 0xC8, 0xC9, 0xD8, 0xD9]; // @TODO CHECK ALL OPS
        let op, cnt = 20000;

        do {
            op = c.read8(c.pc.v);
            c.execute();
        } while(!rets.includes(op) && --cnt > 0);

        if(cnt == 0) {
            this.render(c.pc.v);
        } else {
            this.render();
        }

    }

    this.runToBreak = function() {
        if(Debug.breakpoints.length == 0) {
            Menu.message.show("Add a breakpoint first.", "No Breakpoints");
            return;
        }
        
        if(this.timer) {
            this.stopRunTilBreak();
        } else {
            this.timer = setInterval(Debug._runTilBreak, 1);
            setLEDStatus(true);
        }
    
        if(this.isInRange(c.pc.v))
            this.render();
        else
            this.render(c.pc.v);
    }

    this._gotocallback = function(a) {
        const addr = Number("0x" + a);
        if(addr == null)
            return;
            
        if(!Disassembler.isInRange(addr))
            Disassembler.base = addr;
        
        Disassembler.render(Disassembler.base, INSTR_SHOWN, {'highlight': addr});
    }

    this.goto = function(addr) {
        const m = new PromptMenu("Enter Address", "0000-FFFF", /[0-9A-Fa-f]+/g, 4, Disassembler._gotocallback);
        
        m.show();
    }
}