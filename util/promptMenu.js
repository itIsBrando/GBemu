var PromptMenu = new function() {
    const textInput = document.getElementById('PromptText');
    const menu = document.getElementById('PromptMenu');
    const title = document.getElementById('PromptTitle');
	const submit = document.getElementById('PromptSubmit');
	const div = document.getElementById('PromptDiv');
	const infoDiv = document.getElementById('PromptInfo');
    
    this._onsubmit = null;
    this._oncancel = null;
    
    this.new = function(t, p, accepts = /\w+/g, maxlen = 999999, onsubmit = null, oncancel = null, defaulttext = '', buttontext = 'submit') {
		div.innerHTML = "";
        return {
            "accepts": accepts,
            "title": t,
            "placeholder": p,
			"value": defaulttext,
            "maxlength": maxlen,
            "onsubmit": onsubmit,
            "oncancel": oncancel,
			"buttontext": buttontext
        };
    }

	/**
	 * @returns {String}, {HTMLElement} id and the element that is checked
	 */
	this.getChoice = function() {
		const list = div.getElementsByTagName('fieldset')[0];
		
		if(list == null)
			return null;

		const id = list.id;
		
		for(let i = 0; i < list.children.length; i++) {
			const child = list.children[i];

			if(child.checked) {
				return [id, child];
			}
		}
	}

	this._createChoice = function(name, i) {
		const d = document.createElement('div');
		const lbl = document.createElement('label');
		const btn = document.createElement('input');
		lbl.className = "prompt-menu-choice";
		lbl.innerText = name;

		btn.type = 'radio';
		btn.value = name;
		btn.name = "PromptChoices";
		btn.className = "prompt-menu-radio";
		lbl.htmlFor = btn.id = "PromptMenu"+name;


		if(i == 0)
			btn.setAttribute('checked', true);

		d.appendChild(lbl);
		d.appendChild(btn);

		return {lbl, btn};
	}

	/**
	 * Call before calling `show`
	 * @param {Array} options string array of options
	 * @param {String} id unique identifier. namespaced used on the return value of the `onsubmit` function
	 * @param {String?} title Title of the choice menu
	 */
	this.addChoices = function(options, id, title=null) {
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

	this.setInfo = function(content) {
		infoDiv.innerHTML = content;
		showElement(infoDiv.parentElement);
	}
    
    this.show = function(m) {

		if(!m["maxlength"])
			m["maxlength"] = 999999;
		
        textInput.oninput = function(e) {
            e.target.value = e.target.value.match(m["accepts"]);
            e.target.value = e.target.value.toUpperCase().slice(0, m["maxlength"]);
        }

		textInput.setAttribute("placeholder", m["placeholder"]);

		textInput.onkeydown = function(event) {
			if(event.keyCode === 13)
			{
				event.preventDefault();
				PromptMenu.submit();
			}
		}
        
        textInput.value = m["value"];
        title.innerHTML = m["title"];
        
        this._onsubmit = m["onsubmit"];
        this._oncancel = m["oncancel"];

		submit.innerText = m["buttontext"];
        
        showElement(menu);

		textInput.focus();
    }
    
    this.submit = function() {
		const [id, chc] = this.getChoice();

		if(textInput.value.length == 0)
			return;
		
        if(this._onsubmit) {
			const dict = {};
			dict[id] = {
				"checked": chc ? chc.value : null,
			};
			this._onsubmit(textInput.value, dict);
		}
        
        this.hide();
    }
    
    this.hide = function() {
        hideElement(menu);
		hideElement(infoDiv.parentElement);

		textInput.value = "";
		infoDiv.innerHTML = "";
    }
}