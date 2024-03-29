function hideElement(e) {
    e.style.display = 'none';
}

function showElement(e, style = 'block') {
    e.style.display = style;
}

function hideElementFadeOut(e) {
    e.style.opacity = 0;
    setTimeout(() => {
        hideElement(e);
    }, 200);
}

function showElementFadeIn(e, style = 'block') {
    let opacity = 0;

    showElement(e, style);
    const a = function() {
        opacity += 0.2;
        e.style.opacity = opacity;

        if(opacity < 1)
            setTimeout(a, 5);
    }

    a();
}


function getCheckedRadio(formName) {
    const elems = document.getElementsByName(formName);

    for(let i in elems) {
        if(elems[i].checked)
            return elems[i].value;
    }
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
            messageHeader.textContent = title || "";

            showElement(messageDiv);

            if(useCancel)
                showElement(messageCancel);
            else
                hideElement(messageCancel);


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
            }, 300);

            if(this && this == messageConfirm && onconfirm)
                onconfirm();
            else if(this && this == messageCancel && oncancel)
                oncancel();
            }
    }

    this.alert = new function() {
        const div = document.getElementById('AlertDiv');
        let timer;

        this.isVisible = function() {
            return div.style.top === '15px';
        }

        this.show = function(content, time=3000) {
            if(this.isVisible()) {
                clearTimeout(timer);
            }

            timer = setTimeout(this.hide, time);
            div.innerHTML = content;
            div.style.top = '15px';
        }

        this.hide = function() {
            div.style.top = '-100%';
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
            viewport.classList.remove('viewport-no-title');
        }

        this.hide = function() {
            for(let i = 0; i < 3; i++) {
                hideElement(d[i])
            }

            viewport.classList.add('viewport-no-title');
        }
    }
}


messageConfirm.addEventListener('click', Menu.message.hide);
messageCancel.addEventListener('click', Menu.message.hide);
