
const def_bindings = {
    "s" : "A",
    "a" : "B",
    "enter" : "START",
    "shift" : "SELECT",
    "arrowleft" : "LEFT",
    "arrowright" : "RIGHT",
    "arrowup" : "UP",
    "arrowdown" : "DOWN",
    "=" : "RESET",
    "d" : "FAST",
    "f" : "FULLSCREEN"
};


var KeyBinding = new function() {
    const keyBindingDiv = document.getElementById('keyBindingDiv');
    const styling = document.createElement('style');
    // used by our keyboard event
    this.isAssigning = false;    
    this.bindings = JSON.parse(
        Settings.get_core('keybinding', JSON.stringify(def_bindings)
    ));

    this.modifyingButton = "";


    this.init = function() {
        styling.innerHTML = `.keybinding-assigning::after {
            content: 'hello?';
            background-color: #333;
            color: aliceblue;
            position: absolute;
            bottom: 100%;
            right: 0;
            padding: 5px;
            z-index: 1;
            box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.4);
        }`;
        
        document.head.append(styling);
    }
    
    // shows the keybinding menu
    this.show = function() {
        FrontEndMenu.showOverlay();
        showElement(keyBindingDiv);
        keyBindingDiv.focus();

        this.fillButtonText();
    }

    this.fillButtonText = function() {
        // initialize button texts
        const keywordbuttons = keyBindingDiv.getElementsByClassName("key-binding");
        const strings = [
            "A button",
            "B button",
            "SELECT button",
            "START button",
            "UP",
            "DOWN",
            "LEFT",
            "RIGHT",
            "RESET",
            "FAST FORWARD",
            "FULLSCREEN"
        ];
        const keyboardBindings = Object.keys(this.bindings);

        const bindingsValues = Object.values(this.bindings);
        for(let i = 0; i < keywordbuttons.length; i++)
        {
            /* this complicated shiz idek how it works
                just don't touch it!!
                the order of `this.bindings` changes whenever a key is reassigned,
                 so we must ensure that everything lines up in the same order
            */
            const index = bindingsValues.findIndex(txt => txt == strings[i].split(' ')[0]);
            keywordbuttons[i].innerHTML = `<i>${keyboardBindings[index] || "<b style='color:red;'>unset</b>"}</i>`;
            keywordbuttons[i].classList.remove("keybinding-assigning");

        }
        
    }

    this.setDefault = function() {
        Settings.del_core('keybinding');
        this.bindings = {
            "s" : "A",
            "a" : "B",
            "enter" : "START",
            "shift" : "SELECT",
            "arrowleft" : "LEFT",
            "arrowright" : "RIGHT",
            "arrowup" : "UP",
            "arrowdown" : "DOWN",
            "=" : "RESET",
            "d" : "FAST",
            "f" : "FULLSCREEN"
        }

        this.fillButtonText();
    }
    
    this.hide = function() {
        FrontEndMenu.hideOverlay();
        this.isAssigning = false;
        hideElement(keyBindingDiv);
    }

    /**
     * @param {String} buttonName the string representation of the gameboy button that should be changed.
     *                  - Ex: `A`, `SELECT`, `LEFT`
     * @param {HTMLElement} elem button that was clicked
     */
    this.assign = function(buttonName, elem) {
        if(this.isAssigning)
            this.fillButtonText();
        
        this.isAssigning = true;
        this.modifyingButton = buttonName;
        elem.classList.add("keybinding-assigning");
        styling.innerHTML = styling.innerHTML.replace(/content: *'.*'/, `content:'Press key to bind for ${buttonName}.<esc> to cancel'`);
    }

    /**
     * @param keyName is the string representation of the keyboard key
     * for some reason this function gets called 8 times from the keyboard event but whatever
    */
    this.setKey = function(keyName) {
        if(!this.isAssigning)
            return;
        
        this.isAssigning = false;
        if(keyName === 'escape') {
            this.fillButtonText();
            return;
        }

        Object.keys(this.bindings).forEach((btn, index) => {
            if(this.bindings[btn] == this.modifyingButton)
                delete this.bindings[btn];
                this.bindings[keyName] = this.modifyingButton;
                showMessage(`<code>${this.modifyingButton}</code> assigned to <i>${keyName}</i>`, "Key rebound");
                this.fillButtonText();
                Settings.set_core('keybinding', JSON.stringify(this.bindings));
                return;
        });
    }
}

KeyBinding.init();