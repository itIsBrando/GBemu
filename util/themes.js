

var Themes = new function() {
    this.curTheme = 0;
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

    this.init = function() {
        const t = Settings.get_core("theme", 0);

        Themes.apply(Number(t));

        // change UI theme
        if(Settings.get_core("uitheme", "dark") == "light")
            Themes.changeUI();
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


    this.setSettingsBar = function(force = false) {
        if(force || Settings.get_temp("change_status_bar", "false") == "true")
            this.set_theme_color(getComputedStyle(document.body).getPropertyValue('--ui-background'));
    }


    this.changeUI = function() {
        const newTheme = uiThemeButton.innerText == "dark" ? "light" : "dark";

        Settings.set_core("uitheme", newTheme);
        document.body.className = newTheme == "dark" ? "ui-dark-theme" : "ui-light-theme";
        uiThemeButton.innerText = newTheme;

    }

};