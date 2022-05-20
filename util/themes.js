

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
        localStorage.setItem("__core_theme", String(i));
    }

};

const t = localStorage.getItem("__core_theme");

if(t) {
    Themes.apply(Number(t));
}