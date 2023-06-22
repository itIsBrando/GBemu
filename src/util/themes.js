
/**
 * This module originally describes the user's `skin` but
 *  code relating to the UI theme has been tied in.
 */
var Themes = new function() {
    const themes = [
        "none",
        "icy-blue-theme",
        "dark-theme",
        "black-theme",
        "light-theme",
        "purple-theme",
        "yellow-theme",
        "green-theme",
    ];
    const uiThemeButton = document.getElementById('uiThemeButton');
    this.prefersDarkUITheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.curTheme = 0;

    this.init = function() {
        const t = Settings.get_core("theme", 0);

        Themes.apply(Number(t));
    }

    this.set_theme_color = function(color) {
        const tags = document.getElementsByTagName('meta');

        for(let i = 0; i < tags.length; i++)
        {
            if(tags[i].name == "theme-color")
            {
                tags[i].setAttribute("content", color.trim());
            }
        }
    }

    this.next = function() {
        this.curTheme++;
        this.curTheme %= themes.length;

        this.apply(this.curTheme);
    };

    this.prev = function() {
        if(--this.curTheme < 0) {
            this.curTheme = themes.length - 1;
        }

        this.apply(this.curTheme);
    };

    this.apply = function(i) {
        i %= themes.length;
        Themes.curTheme = i;
        document.body.classList.remove(...themes);
        document.body.classList.add(themes[i]);

        this.setStatusBar();
        Settings.set_core("theme", String(i));
    }

    this.setStatusBar = function() {
        this.set_theme_color(getComputedStyle(document.body).getPropertyValue('--bg-color'));
    }


    this.setSettingsBar = function() {
        this.set_theme_color(getComputedStyle(document.body).getPropertyValue('--ui-background'));
    }


    this.setUI = function(i) {
        // auto/system
        let theme = CoreSetting.getVal("UITheme");

        uiThemeButton.innerText = theme;
        this.applyUITheme(theme);
        Themes.setSettingsBar();
    }

    this.applyUITheme = function(theme) {
        document.body.classList.remove("ui-light-theme");
        document.body.classList.remove("ui-dark-theme");

        document.body.classList.add(theme == "dark" || (theme == "system" && this.prefersDarkUITheme) ? "ui-dark-theme" : "ui-light-theme");
    }

};

/**
 * To detect user's current system theme
 */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    Themes.prefersDarkUITheme = event.matches;
    Themes.applyUITheme(CoreSetting.getVal("UITheme"));
});