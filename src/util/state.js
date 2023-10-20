
const MainState = {
    Main: { id:0, onload: null, onunload: null },
    SettingsMenu: { id: 1, onload: Settings.show, onunload: Settings.hide },
    DebugMenu: { id: 2, onload: Debug.start, onunload: Debug.quit },
    SaveMenu: { id: 3, onload: SaveManager.show, onunload: SaveManager.hide },
    KeyboardAssign: { id: 4, onload: null, onunload: () => {KeyBinding.fillButtonText();} },
    Prompt: {id: 5, onload: null, onunload: PromptMenu._hide},
    PaletteMenu: {id: 6, onload: Palette.show, onunload: Palette.hide},
    SkinMenu: {id: 7, onload: Skin.show, onunload: Skin.hide},
};

var state = MainState.Main;
let stateStack = [MainState.Main];
let useHistory = false;

var State = new function() {

    /**
     * @param {MainState} s Object
     */
    this.set = function(s) {
        state = s;

        if(s && s.onload)
            s.onload();

        // console.log(`State set to ${s.id}`)
    }

    /**
     * Adds a new state to the stack. Preferred over `set`
     * @param {MainState} s Object
     */
    this.push = function(s) {
        stateStack.push(s);

        if(useHistory)
            window.history.replaceState({'hello': s.id}, '', `?m=${s.id}`);

        this.set(s);
        // console.log('pushed state');
    }

    this.pop = function() {
        if(state.onunload) {
            state.onunload();
        }

        // console.log('popped state');
        if(stateStack.length > 1) {
            stateStack.pop();
        } else {
            // fallback in case we somehow pop the first elem
            stateStack[0] = MainState.Main;
        }


        this.set(stateStack[stateStack.length - 1]);
    }
}


function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}


/**
 * Disabled feature on safari because it partially reloads the page when
 *  rewinding so no thank you.
 */
window.onload = function() {
    useHistory = ('history' in window) && Settings.get_core('pwa', 'false') != false && !isSafari();

    if(useHistory) {
        window.history.pushState({'base': 1}, ''); // object is actually unused

        window.addEventListener('popstate', function(e) {
            window.history.pushState(e.state, '');
            // console.log('push history');

            if(stateStack.length > 1) {
                State.pop();
            }
        })
    }
}