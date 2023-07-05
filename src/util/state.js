
const MainState = {
    Main: { id:0, onload: null, onunload: null },
    SettingsMenu: { id: 1, onload: Settings.show, onunload: Settings.hide },
    DebugMenu: { id: 2, onload: Debug.start, onunload: Debug.quit },
    SaveMenu: { id: 3, onload: SaveManager.show, onunload: SaveManager.hide },
    KeyboardAssign: { id: 4, onload: null, onunload: () => {KeyBinding.fillButtonText();} },
}

var state = MainState.Main;
let stateStack = [MainState.Main];

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

        if('history' in window)
            window.history.replaceState({'hello': s.id}, '', `?m=${s.id}`);

        this.set(s);
        // console.log('pushed state');
    }

    this.pop = function() {
        if(state.onunload) {
            state.onunload();
        }

        // console.log('popped state');
        stateStack.pop();


        this.set(stateStack[stateStack.length - 1]);
    }
}


function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}


window.onload = function() {
    if(('history' in window) && Settings.get_core('pwa', 'false') != false && !isSafari()) {
        window.history.pushState({'base': 1}, ''); // object is actually unused

        window.addEventListener('popstate', function(e) {
            // console.log(e.state);

            window.history.pushState(e.state, '');
            // console.log('push history');

            if(stateStack.length > 1) {
                State.pop();
            }
        })
    }
}