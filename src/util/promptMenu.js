const textInput = document.getElementById('PromptText');
const menu = document.getElementById('PromptMenu');
const title = document.getElementById('PromptTitle');
const submit = document.getElementById('PromptSubmit');
const cancel = document.getElementById('PromptCancel');
const div = document.getElementById('PromptDiv');
const infoDiv = document.getElementById('PromptInfo');


/**
  * Only one prompt menu object can exist at a time
  * 'onexit' event is never called
 */
class PromptMenu {

    static onsubmit;
    static onexit;
	static oncancel;

    constructor(t, p='', accepts = /\w+/g, maxlen=999999, onsubmit=null, onexit=null, defaulttext='', buttontext='OK', cancelText=null, oncancel=null) {
        div.innerHTML = "";
        this.accepts = accepts;
        this.title = t || 'Title';
        this.placeholder = p;
        this.value = defaulttext;
        this.maxlength = maxlen;
        this.submitText = buttontext;
		this.cancelText = cancelText;
        PromptMenu.onsubmit = onsubmit;
        PromptMenu.oncancel = oncancel;
        PromptMenu.onexit = onexit;
        this.submitText = buttontext;
    }

	/**
	 * @returns {String}, {HTMLElement} id and the element that is checked
	 */
	static getChoice() {
		const list = div.getElementsByTagName('fieldset')[0];

		if(list == null)
			return [null, null];

		const id = list.id;

		for(let i = 0; i < list.children.length; i++) {
			const child = list.children[i];

			if(child.checked) {
				return [id, child];
			}
		}
	}

	_createChoice(name, i) {
		const d = document.createElement('div');
		const lbl = document.createElement('label');
		const btn = document.createElement('input');
		lbl.className = "prompt-menu-choice";
		lbl.innerText = name;

		btn.type = 'radio';
		btn.value = name;
		btn.name = "PromptChoices";
		btn.className = "prompt-menu-radio";
		btn.id = `PromptMenu${name}`;
		lbl.htmlFor = btn.id;

		if(i == 0)
			btn.setAttribute('checked', true);

		d.appendChild(lbl);
		d.appendChild(btn);

		return {lbl, btn};
	}

	/**
	 * Call before calling `show`
	 * @param {Array} options string array of options
	 * @param {String} id unique identifier. namespace used on the return value of the `onsubmit` function
	 * @param {String?} title Title of the choice menu
	 */
	addChoices(options, id, title=null) {
		const f = document.createElement('fieldset');
		const l = document.createElement('legend');

		f.id = id;
		f.className = "prompt-menu-fieldset";
		l.className = "prompt-menu-legend";

		l.innerText = title;
		f.appendChild(l);

		for(let i = 0; i < options.length; i++) {
			const {lbl, btn} = this._createChoice(options[i], i);
			f.appendChild(btn);
			f.appendChild(lbl);
		}

		div.appendChild(f);
	}


	addText(content) {
		const elem = document.createElement('div');
		elem.className = "debug-box";
		elem.innerHTML = content;
		div.appendChild(elem);
	}

	setInfo(content) {
		infoDiv.innerHTML = content;
		showElement(infoDiv.parentElement);
	}

	static shake() {
		setTimeout(function() {
			menu.classList.remove('shake-anim');
		}, 400);
		menu.classList.add('shake-anim');
	}

    show() {
        const pat = this.accepts;
        const len = this.maxlength;

		if(!this.maxlength)
			this.maxlength = 999999;

        textInput.oninput = function(e) {
			const match = e.target.value.match(pat);
            e.target.value = match ? match[0] : '';
            e.target.value = e.target.value.toUpperCase().slice(0, len);
        }

		textInput.setAttribute("placeholder", this.placeholder);

		textInput.onkeydown = function(event) {
			if(event.keyCode === 13)
			{
				event.preventDefault();
				PromptMenu.submit();
			}
		}

        textInput.value = this.value;
        title.innerHTML = this.title;

        submit.innerText = this.submitText;

		// using cancel button
		if(this.cancelText) {
			showElement(cancel);
			cancel.innerText = this.cancelText;
			cancel.onclick = PromptMenu.oncancel;
		} else {
			hideElement(cancel);
		}

        showElement(menu);

		textInput.focus();

		State.push(MainState.Prompt);
    }

    static submit() {
		const [id, chc] = this.getChoice();

		if(textInput.value.length == 0) {
			PromptMenu.shake();
			return;
		}

        if(PromptMenu.onsubmit) {
			const dict = {};
			dict[id] = {
				"checked": chc ? chc.value : null,
			};

			if(PromptMenu.onsubmit(textInput.value, dict) === false) {
				// do not hide
				PromptMenu.shake();
				return;
			}
		}

        this.hide();
    }

	static shown() {
		return menu.style.display != 'none';
	}

	static _hide() {
		hideElement(menu);
		hideElement(infoDiv.parentElement);

		textInput.value = "";
		infoDiv.innerHTML = "";
	}

    static hide() {
		if(PromptMenu.shown())
			State.pop();
    }
}