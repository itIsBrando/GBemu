

var Themes = new function() {
    this.curTheme = 0;
    const themes = [
        "none",
        "icy-blue-theme",
        "dark-theme",
        "light-theme",
        "purple-theme",
        "yellow-theme",
        "green-theme",
    ];

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

};