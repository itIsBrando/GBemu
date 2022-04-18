

var Themes = new function() {
    this.curTheme = 2;
    const themes = [
        "icy-blue-theme",
        "dmg-theme",
        "none"
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