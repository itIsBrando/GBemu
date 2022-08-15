function hideElement(e) {
    e.style.display = 'none';
}

function showElement(e, style = 'block') {
    e.style.display = style;
}



let oncancel, onconfirm;

var Menu = new function() {
    
    
    this.message = new function() {
        var messageDiv = document.getElementById('messageID');
        var messageConfirm = document.getElementById('messageConfirm');
        var messageCancel = document.getElementById('messageCancel');

        /**
         * Shows a message to the user
         * @param {String} string message to tell
         * @param {String?} title string to display at the top
         * @param {Boolean} useCancel true to have a cancel button
         * @param {Function} oncancel function called when cancel button is used
         * @param {Function} onconfirm same as above
         */
        this.show = function(string, title, useCancel = false, _oncancel = null, _onconfirm = null) {
            const messageContent = document.getElementById('messageContent');
            const messageHeader = document.getElementById('messageHeader');
        
            messageContent.innerHTML = string || "";
            messageHeader.textContent = title || "ALERT";
        
            showElement(messageDiv);
        
            if(useCancel) {
                messageConfirm.style.width = "50%"
                showElement(messageCancel);
            } else {
                hideElement(messageCancel);
                messageConfirm.style.width = "100%"
            }
        
            oncancel = _oncancel;
            onconfirm = _onconfirm;
        
            messageConfirm.focus();
        
            messageConfirm.onkeydown = function(event)
            {
                if(event.key.toLowerCase() == "enter") {
                    messageConfirm.click();
                }
            }
            
            messageDiv.style.opacity = "1";
        }
        
        this.hide = function() {
            messageDiv.style.opacity = "0";
            
            setTimeout(function() {
                hideElement(messageDiv);
            }, 600);
            
            if(this && this == messageConfirm && onconfirm)
                onconfirm();
            else if(this && this == messageCancel && oncancel)
                oncancel();
            }
    }
    
    this.alert = new function() {
        const div = document.getElementById('AlertDiv');
        
        this.show = function(content, time=3000) {
            if(div.style.display != 'none')
                setTimeout(this.hide, time);
            
            div.innerHTML = content;
            div.style.top = '15px';
        }
        
        this.hide = function() {
            div.style.top = '-200px';
        }
    }
    
    
    this.title = new function() {
        const viewport = document.getElementById('viewport');
        const d = [document.getElementById('dropdown1'), document.getElementById('dropdown2'), document.getElementById('dropdown3')];

        this.toggle = function() {
            const isVisible = d[0].style.display != 'none';

            if(isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
        
        this.show = function() {
            for(let i = 0; i < 3; i++) {
                showElement(d[i])
            }
            viewport.style.top = '25px';
        }
        
        this.hide = function() {
            for(let i = 0; i < 3; i++) {
                hideElement(d[i])
            }
            viewport.style.top = '5px';
        }
    }
}


messageConfirm.addEventListener('click', Menu.message.hide);
messageCancel.addEventListener('click', Menu.message.hide);