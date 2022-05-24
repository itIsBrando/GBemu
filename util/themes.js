

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


    this.set_theme_color = function(color) {
        const tags = document.getElementsByTagName('meta');

        for(let i = 0; i < tags.length; i++)
        {
            if(tags[i].name == "theme-color")
            {
                tags[i].setAttribute("content", color.substring(0, 8));
            }
        }
    }


    this.next = function() {
        this.curTheme++;
        if(this.curTheme > themes.length - 1)
            this.curTheme = 0;
        
            this.apply(this.curTheme);
    };
    
    this.apply = function(i) {
        i %= themes.length;
        Themes.curTheme = i;
        document.body.classList.remove(...themes);
        document.body.classList.add(themes[i]);

        this.set_theme_color(getComputedStyle(document.documentElement).getPropertyValue('--bg-color'));
        localStorage.setItem("__core_theme", String(i));
    }

};

const t = localStorage.getItem("__core_theme");

if(t) {
    Themes.apply(Number(t));
}