

var Themes = new function() {
    this.curTheme = 0;
    const themes = [
        "none",
        "icy-blue-theme",
        "dark-theme",
        "light-theme",
        "dmg-theme",
    ];

    this.next = function() {
        if(themes[this.curTheme] != "none")
            document.body.classList.remove(themes[this.curTheme]);
            
        this.curTheme++;
        if(this.curTheme > themes.length - 1)
            this.curTheme = 0;
        
        if(themes[this.curTheme] != "none")
            document.body.classList.add(themes[this.curTheme]);
    };

};