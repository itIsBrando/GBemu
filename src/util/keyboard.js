
const def_bindings = {
    "s" : "A",
    "a" : "B",
    "enter" : "START",
    "shift" : "SELECT",
    "arrowleft" : "LEFT",
    "arrowright" : "RIGHT",
    "arrowup" : "UP",
    "arrowdown" : "DOWN",
    "d" : "FAST",
    "f" : "FULLSCREEN",
    "p" : "PAUSE",
};


var KeyBinding = new function() {
    const keyBindingDiv = document.getElementById('keyBindingDiv');
    const styling = document.createElement('style');

    this.bindings = JSON.parse(
        Settings.get_core('keybinding', JSON.stringify(def_bindings))
    );

    this.modifyingButton = "";


    this.init = function() {
        styling.innerHTML = `.keybinding-assigning::after {
            content: '';
            background-color: var(--ui-background);
            color: var(--ui-background-text);
            position: absolute;
            bottom: 100%;
            right: 0;
            padding: 5px;
            z-index: 1;
            box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.4);
        }`;

        document.head.append(styling);

        // incase any key bindings are added or removed, we will delete user-defined bindings
        if(Object.keys(this.bindings).length != Object.keys(def_bindings).length) {
            Settings.del_core('keybinding');
        }
    }

    // shows the keybinding menu
    this.show = function() {
        showElementFadeIn(keyBindingDiv);
        this.fillButtonText();
    }

    this.fillButtonText = function() {
        // initialize button texts
        const keywordbuttons = keyBindingDiv.getElementsByClassName("key-binding");
        const def_binding_values = Object.values(def_bindings);
        const keyboardBindings = Object.keys(this.bindings);

        const bindingsValues = Object.values(this.bindings);
        for(let i = 0; i < keywordbuttons.length; i++)
        {
            /* this complicated shiz idek how it works
                just don't touch it!!
                the order of `this.bindings` changes whenever a key is reassigned,
                 so we must ensure that everything lines up in the same order
            */
            const index = bindingsValues.findIndex(txt => txt == def_binding_values[i].split(' ')[0]);
            keywordbuttons[i].innerHTML = `${keyboardBindings[index] || "<b style='color:red;'>unset</b>"}`;
            keywordbuttons[i].classList.remove("keybinding-assigning");

        }

    }

    this.setDefault = function() {
        Menu.message.show(
            '',
            "Set keybindings to default?",
            true,
            null,
            function() {
                Settings.del_core('keybinding');
                KeyBinding.bindings = def_bindings;

                KeyBinding.fillButtonText();
            }
        );
    }

    this.hide = function() {
        hideElementFadeOut(keyBindingDiv);
    }

    /**
     * @param {String} buttonName the string representation of the gameboy button that should be changed.
     *                  - Ex: `A`, `SELECT`, `LEFT`
     * @param {HTMLElement} elem button that was clicked
     */
    this.assign = function(buttonName, elem) {
        if(state === MainState.KeyboardAssign)
            this.fillButtonText();

        setState(MainState.KeyboardAssign);
        this.modifyingButton = buttonName;
        elem.classList.add("keybinding-assigning");
        styling.innerHTML = styling.innerHTML.replace(/content: *'.*'/, `content:'Press key to bind for ${buttonName}.<esc> to cancel'`);
    }

    /**
     * @param keyName is the string representation of the keyboard key
     * for some reason this function gets called 8 times from the keyboard event but whatever
    */
    this.setKey = function(keyName) {
        setState(MainState.SettingsMenu);

        if(keyName === 'escape') {
            this.fillButtonText();
            return;
        }

        Object.keys(this.bindings).forEach((btn, index) => {
            if(this.bindings[btn] == this.modifyingButton)
                delete this.bindings[btn];
                this.bindings[keyName] = this.modifyingButton;
                // Menu.message.show(`<code>${this.modifyingButton}</code> assigned to ${keyName}`, "Key rebound");
                this.fillButtonText();
                Settings.set_core('keybinding', JSON.stringify(this.bindings));
                return;
        });
    }
}