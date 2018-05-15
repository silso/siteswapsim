'use strict';

//TODO: (maybe) instead of destroying sliders in resetLadder, delete handles. this way functions aren't redefined each time ladder is reset
//TODO: make slider handle value not on top of slider (by appending an element)
//TODO: give ladder lines colors based on the loop they are in
//TODO: when bottom handle on right slider is brought to very bottom, allow to then be dragged down from the top (wrap around)
//TODO: remove 0's from multiplexes
//TODO BAD SITESWAPS:
	//5505051
	//61305
	//63051

//temporary global to figure out animation stuff
var preset;
var animationInstance;
var examplePresetArr = [];
var customPresetArr = [];

$(document).ready(function() {
	//cookies
	function bakeCookie(name, value) {
		var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
		console.log(cookie);
		document.cookie = cookie;
	}
	function readCookie(name) {
		var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
		result && (result = JSON.parse(result[1]));
		return result;
	}
	function deleteCookie(name) {
		document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	}

	var customPresetCookie = readCookie(customPresetArr);
	if (customPresetCookie) {
		console.log('here');
		customPresetArr = customPresetCookie;
	}

	function clone(obj){
   	if (obj == null || typeof(obj) != 'object')
       	return obj;

   	var temp = new obj.constructor();
   	for (var key in obj)
      	temp[key] = clone(obj[key]);

   	return temp;
	}

	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function setShareLinkCopyText() {
		let copyText = document.getElementById('presetShareCopyText');
		let encodeText = encode(encodePreset(preset));
		copyText.value = window.location.href.replace(/[?&]p=.+?(?=&|$)/, '') + "?p=" + encodeText;
	}

	function addCustomPresetCard(preset, imported) {
		preset.index = customPresetArr.length;
		preset.custom = true;
		let card = makeCardElement(Object.assign({}, preset), imported);
		document.getElementById('customPresets').appendChild(card); //add card to custom presets
		updateCurrentPreset(card);

		customPresetArr.push(preset); //add to custom preset array by value

		document.getElementById('updatePreset').disabled = false;
		updatePreset.title = 'change the name, description or siteswap of your preset';

		bakeCookie('customPresetArr', customPresetArr);
	}

	//DOM objects
	var siteswapForm = document.getElementById('siteswapForm');
	var siteswapInput = document.getElementById('siteswapInput');
	var repeatCount = document.getElementById('repeatCount');

	//adding input options automatically
	var siteswapOptionsForm = document.getElementById('siteswapOptionsForm');
	var optInputs = [
		//starting value for time between any throw and catch (in slider length units)
		{
			id: 'throwTime',
			entryName: 'throw time:',
			description: 'Default time spent without a ball in hand',
			defaultValue: 0.5,
			logSpin: false,
			step: 0.05
		},
		//smallest allowed value for dwell time (default dwell time is 1 - throwTime)
		{id:'dwellLimit',entryName:'dwell limit:',description:'Limits how soon you can throw a ball after catching it',defaultValue:0.4,logSpin:false,step:0.05},
		//smallest allowed value to throw one ball then catch a different ball in the same hand
		{id:'throwLimit',entryName:'throw limit:',description:'Limits how soon you can catch a ball after throwing one',defaultValue:0.25,logSpin:false,step:0.05},
		//smallest allowed value to throw a ball to the other hand (maybe shouldn't have this or throwLimit, doesn't make a ton of sense physically)
		{id:'speedLimit',entryName:'speed limit:',description:'Limits how fast a ball can be thrown then caught',defaultValue:0.4,logSpin:false,step:0.05},
		//multiplier for how fast time goes
		{id:'speedMultiplier',entryName:'speed multiplier:',description:'Changes how fast time moves',defaultValue:1,logSpin:true,step:0.0000000000001},
		//adjusts rhythm to juggle faster without affecting apparent gravity
		{id:'paceMultiplier',entryName:'pace multiplier:',description:'Changes how fast the juggler tries to juggle',defaultValue:1,logSpin:true,step:0.0000000000001}
	];
	//append each option to the siteswap tab along with their spinners
	for (let i = 0; i < optInputs.length; i++) {
		siteswapOptionsForm.innerHTML += "																										\
			<div id='"+optInputs[i].id+"Container' class='spinnerContainer' title='"+optInputs[i].description+"'>			\
				<label for='"+optInputs[i].id+"' class='ui-widget'>"+optInputs[i].entryName+"</label>							\
				<input id='"+optInputs[i].id+"' name='value' type='number' step='"+optInputs[i].step+"'> 						\
			</div>";
	}
	//submit button at the end
	siteswapOptionsForm.innerHTML += "<input type='submit' value='Apply changes' class='ui-button ui-widget ui-corner-all'>";
	//need to set element pointers after dom editing otherwise the pointers lose track
	for (let i = 0; i < optInputs.length; i++) {
		optInputs[i].element = document.getElementById(optInputs[i].id);
	}


	//allow resizing of user entry
	$('#userEntryWrapper').resizable({
		handles: 'e',
		minWidth: 310
	});
	//intialize tabs
	$('#tabs').tabs();
	//disable ladder tab until preset is entered
	$('#tabs').tabs('disable', '#ladderDiagram');

	//<editor-fold> INFO ********************************************************
	$('#accordion').accordion({
		animate: 0,
		heightStyle: 'content',
		activate: function(event, ui) {
			//stop video from playing when changing header
			if (ui.newHeader[0].id != 'welcome') {
				document.getElementById('introVid').src = '/default.asp';
				document.getElementById('introVid').src = 'https://www.youtube-nocookie.com/embed/7dwgusHjA0Y?rel=0';
			}

		}
	});
	// maybe add url navigation?
	// $('#accordion').accordion({
	// 	header: 'h3',
	// 	navigation: true
	// });

	//</editor-fold> INFO *******************************************************

	//<editor-fold> PRESET DEFINITION *******************************************
	var Preset = function(site, params = ['a', 'b', 1, true], options = [1, 1, 1, 1, 1, 1, 1, 1]) {
		//this class holds the config of the siteswap, including rhythm.

		this.site = site; //siteswap object
		this.name = params[0];
		this.description = params[1];
		this.repeats = params[2]; //get # of repeats from spinner
		this.throwInfo; //this has info about where lines go
		this.beats = {left: [], right: [], custom:false}; //rhythm of this instance of a siteswap
		this.options = {}; //numerical options for mostly timing described above at optInputs filled in below
		for (let i = 0; i < optInputs.length; i++) {
			this.options[optInputs[i].id] = options[i];
		}
		this.index; //index in custom preset array (for editing existing presets)
		this.custom = params[3]; //if it is not custom, we will disable update preset

		// this.init = function(isNew) {
		// 	if (isNew) getAttributes(this); //user entered
		// 	else this.throwInfo = this.site.printThrowInfo(this.repeats); //example preset
		// 	makeBeats(this);
		// 	makeColors(this);
		// }
	}
	var initPreset = function(preset, isNew) {
		if (isNew) getAttributes(preset); //user entered
		else preset.throwInfo = preset.site.printThrowInfo(preset.repeats); //example preset
		makeBeats(preset);
		if (preset.colors === undefined) makeColors(preset);
	}
	var makeBeats = function(preset) {
		//makes an object with two arrays: the beat times of catches and throws for each hand. Catches are even, throws are odd
		preset.beats = {left: [], right: []};
		preset.beats.left.push(0);
		var syncDiff = !preset.site.sync; //make right hand throws 1 beat out of sync with left hand when pattern isn't sync
		for (let i = 2; i <= preset.throwInfo.endTime; i += 2) {
			preset.beats.left.push(i - 1 + preset.options.throwTime); //left hand catch time
			preset.beats.left.push(i); //left hand throw time
			preset.beats.right.push(i - syncDiff - 1 + preset.options.throwTime); //right hand catch time
			preset.beats.right.push(i - syncDiff); //right hand throw time
		}
	}
	var makeThrowInfo = function(preset, repeats) {
		preset.throwInfo = preset.site.printThrowInfo(repeats);
	}
	var makeColors = function(preset) {
		preset.colors = [];
		for (let i = 0; i < preset.site.loops.length; i++) {
			preset.colors.push("rgb(" +
				Math.floor(Math.random()*192 + 32) + "," +
				Math.floor(Math.random()*192 + 32) + "," +
				Math.floor(Math.random()*192 + 32) + ")");
		}
	}
	var setForms = function(preset) {
		//take attributes and put them into input forms
		siteswapInput.value = preset.site.siteStr;
		//options attributes
		for (let i = 0; i < optInputs.length; i++) {
			optInputs[i].element.value = preset.options[optInputs[i].id];
		}
		repeatCount.value = preset.repeats;
	}
	var getAttributes = function(preset) {
		//take attributes from forms and put into preset
		//options attributes
		for (let i = 0; i < optInputs.length; i++) {
			preset.options[optInputs[i].id] = parseFloat(optInputs[i].element.value);
		}
		preset.repeats = parseFloat(repeatCount.value);
		preset.throwInfo = preset.site.printThrowInfo(preset.repeats);
	}
	var printInfo = function(preset) {
		console.log('siteswap array:', preset.site.printArray());
		console.table({
			'valid': preset.site.isValid(),
			'siteswap': preset.site.printSite(),
			'loops': preset.site.printLoops(),
			'looptime': preset.site.printLoopTime()
		});
		console.log('throwInfo: ', preset.throwInfo);
		console.log('beats: ', preset.beats);
		console.log('timings: ', [
			preset.options,
			['repeatCount', preset.repeats]
		]);
	}
	//</editor-fold> PRESET DEFINITION ******************************************

	//<editor-fold> PRESET OPTIONS **********************************************
	var loadPreset = function(pr) {
		preset = Object.assign({}, pr);
		preset.index = pr.index;
		setForms(preset);
		resetLadder();


		var updatePreset = document.getElementById('updatePreset');
		if (preset.custom) {
			updatePreset.disabled = false;
			updatePreset.title = 'change the name, description or siteswap of your preset';
		}
		else {
			updatePreset.disabled = true;
			updatePreset.title = 'cannot change information of example presets (press save preset first)';
		}

		document.getElementById('siteswapEntryError').style.visibility = 'hidden';

		setShareLinkCopyText();

		//unsure if this is needed
      // animationInstance = undefined;
      // animationInstance = new AnimationScript();
		if (animationInstance === undefined) animationInstance = new AnimationScript();
      animationInstance.init(preset, false);
	}

	//set the "current preset" to a given card
	var updateCurrentPreset = function(presetCard) {
		var currentPresetWrapper = document.getElementById('currentPresetWrapper');
		var current = document.getElementById('currentPreset');
		var newNode = presetCard.cloneNode(true);
		newNode.id = 'currentPreset';

		currentPresetWrapper.removeChild(current);
		currentPresetWrapper.appendChild(newNode);

		// current.replaceWith(newNode);
		// newNode.id = 'currentPreset';
	}

	//takes in preset object, returns card element
	var makeCardElement = function(preset, imported) {
		let card, p, strong, text, hr;
		card = document.createElement('DIV');
		card.classList.add('presetCard');
		card.classList.add('pointer');
		p = document.createElement('P');
		p.classList.add('presetName');
		strong = document.createElement('STRONG');
		if (imported) {
			strong.innerHTML = '<em>' + preset.name + '</em>';
		}
		else {
			text = document.createTextNode(preset.name);
			strong.appendChild(text);
		}
		p.appendChild(strong);
		card.appendChild(p); //name
		hr = document.createElement('HR');
		card.appendChild(hr); //horizontal line
		p = document.createElement('P');
		p.classList.add('presetSiteswap');
		text = document.createTextNode(preset.site.siteStr);
		p.appendChild(text);
		card.appendChild(p); //siteswap
		p = document.createElement('P');
		p.classList.add('presetDescription');
		text = document.createTextNode(preset.description);
		p.appendChild(text);
		card.appendChild(p); //description

		card.onclick = function() {
			loadPreset(preset);
			updateCurrentPreset(card);
			examplePresets.dialog('close');
			customPresets.dialog('close');
		}

		return card;
	}

	//push into example presets dialog
	var makeCards = function(arr, container) {
		container = document.getElementById(container);
		for (let i = 0; i < arr.length; i++) {
			let card = makeCardElement(Object.assign({}, arr[i]), false);

			container.appendChild(card);
		}
	}

	//fill example preset array
	var pr;
	pr = new Preset(new Siteswap('3'), ['3 ball cascade', 'the simplest and easiest juggling pattern', 1, false], [0.5, 0.4, 0.25, 0.4, 1, 1]);
	initPreset(pr, false);
	examplePresetArr.push(pr);
	pr = new Preset(new Siteswap('534'), ['mmmmmmasdf', 'description, huh?', 1, false], [0.5, 0.4, 0.25, 0.4, 1, 1]);
	initPreset(pr, false);
	examplePresetArr.push(pr);

	makeCards(examplePresetArr, 'examplePresets');
	makeCards(customPresetArr, 'customPresets');

	var examplePresets = $('#examplePresets');
	examplePresets.dialog({
		autoOpen: false,
		show: {
			effect: 'fade',
			duration: 100
		},
		hide: {
			effect: 'fade',
			duration: 100
		},
		resizable: false,
		draggable: false,
		position: {my: 'left+6px top+6px', at: 'left top', of: '#presetOptions'},
		height: $('#tabs').height() - $('#tabNames').height() - 14,
		width: $('#tabs').width() - 20
	});

	var customPresets = $('#customPresets');
	customPresets.dialog({
		autoOpen: false,
		show: {
			effect: 'fade',
			duration: 100
		},
		hide: {
			effect: 'fade',
			duration: 100
		},
		resizable: false,
		draggable: false,
		position: {my: 'left+6px top+6px', at: 'left top', of: '#presetOptions'},
		height: $('#tabs').height() - $('#tabNames').height() - 14,
		width: $('#tabs').width() - 20
	});

	document.getElementById('examplePresetButton').onclick = function() {
		examplePresets.dialog('open');
	}

	document.getElementById('currentPresetWrapper').onclick = function() {
		if (preset.custom) {
			customPresets.dialog('open');
		}
		else {
			examplePresets.dialog('open');
		}
	}

	document.getElementById('customPresetButton').onclick = function() {
		customPresets.dialog('open');
	}

	//close dialog when another tab is selected
	$('#tabs').tabs({
		activate: function(event, ui) {
			examplePresets.dialog('close');
			customPresets.dialog('close');
			//use Array.prototype.indexOf.call to find the index of the active tab among all of the tabs
			//this strange usage of indexOf is because what we're searching is a NodeList, not an array
			//subtract 1 and divide by 2 because of random text elements between its siblings
			let index = (Array.prototype.indexOf.call(ui.newTab[0].parentNode.childNodes, ui.newTab[0]) - 1) / 2;
			if (index === 1) {
				setShareLinkCopyText();
			}

			//stop video from playing when changing tabs
			if (index != 0) {
				document.getElementById('introVid').src = '/default.asp';
				document.getElementById('introVid').src = 'https://www.youtube-nocookie.com/embed/7dwgusHjA0Y?rel=0';
			}
		}
	});

	document.getElementById('presetInfoForm').onsubmit = function(e) {
		e.preventDefault();

		preset.name = document.getElementById('presetName').value;
		preset.description = document.getElementById('presetDescription').value;
		addCustomPresetCard(preset, false);
	}

	document.getElementById('updatePreset').onclick = function() {
		preset.name = document.getElementById('presetName').value;
		preset.description = document.getElementById('presetDescription').value;
		let newCard = makeCardElement(Object.assign({}, preset), false);

		//replace card in custom cards
		var customPresets = document.getElementById('customPresets');
		var oldCard = customPresets.childNodes[preset.index];
		customPresets.removeChild(oldCard);
		customPresets.insertBefore(newCard, customPresets.childNodes[preset.index]);

		//update current preset card
		updateCurrentPreset(newCard);

		customPresetArr[preset.index] = Object.assign({}, preset);
	}

	//share link
	document.getElementById('presetShareCopyButton').onclick = function() {
		let copyText = document.getElementById('presetShareCopyText');

		//append p variable value to current url (minus previous p)
		//does not quite work for multiple parameters yet
		setShareLinkCopyText();
		copyText.focus();
		copyText.select();

		try {
			document.execCommand('copy');
		} catch (e) {
			console.log('unable to copy share link');
		}
	}

	document.getElementById('presetShareLoadWrapper').onsubmit = function(e) {
		e.preventDefault();
		//get p url parameter value and ignore others
		let loadText = getParameterByName('p', document.getElementById('presetShareLoadText').value);
		let newPreset = decodePreset(decode(loadText));
		loadPreset(newPreset);
		preset.index = customPresetArr.length;
		preset.name = "imported " + (preset.index + 1);
		preset.description = "imported " + (new Date).toLocaleString();
		addCustomPresetCard(preset, true);
	}

	//</editor-fold> PRESET OPTIONS *********************************************

	//<editor-fold> INPUT *******************************************************
	//<editor-fold> SITESWAP ENTRY **********************************************
	siteswapForm.onsubmit = function(e) {
		e.preventDefault();
		parseInput(siteswapInput.value);

      animationInstance = undefined;
      animationInstance = new AnimationScript();
      animationInstance.init(preset, false);
	}

	//create siteswap and preset objects from entry
	var parseInput = function(input) {
		var siteString = String(input).toLowerCase();
		siteString = siteString.replace(/\s/g, ''); //remove spaces
		//SYNTAX CHECKER
		//Modified (stolen) from gunswap.co
		var SIMPLETOSS = '(\\d|[a-w])';
		var CUSTOMTOSS = '(\\{\\d+\\})';
		var TOSS = '(' + SIMPLETOSS + '|' + CUSTOMTOSS + ')';
		var MULTIPLEX = '(\\[' + TOSS + '+\\])';
		var SYNCMULTIPLEX = '(\\[(' + TOSS + 'x?)+\\])';
		var SYNC = '\\(((' + TOSS + 'x?)|' + SYNCMULTIPLEX + '),((' + TOSS + 'x?)|' + SYNCMULTIPLEX + ')\\)';
		var PATTERN = new RegExp('(^(' + TOSS + '|' + MULTIPLEX + ')+$|^(' + SYNC + ')+\\*?$)|🤹');

		var error = document.getElementById('siteswapEntryError');
		if(!PATTERN.test(siteString)) {
			error.innerHTML = 'Invalid syntax';
			error.style.visibility = 'visible';
			error.title = 'You may be using some incorrect characters. See the preset tab for a guide';
		}
		else if (siteString == '🤹') {
			var index = preset.index;
			preset = new Preset(new Siteswap('3'));
			preset.index = index;
			preset.site.siteStr = '🤹';
			initPreset(preset, true);
			printInfo(preset);
			resetLadder();
		}
		else {
			var site = new Siteswap(siteString);
			if (!site.valid) {
				error.innerHTML = 'Invalid pattern';
				error.style.visibility = 'visible';
				error.title = 'Throws are colliding in your pattern. See the preset tab for a guide';
			}
			else if (!site.site[0]) {
				error.innerHTML = '0 at start';
				error.style.visibility = 'visible';
				error.title = 'Ladder diagram needs a throw on the first beat, cycle your pattern one beat';
			}
			else { //if pattern valid
				error.style.visibility = 'hidden';
				error.title = '';

				var index = preset.index;
				preset = new Preset(new Siteswap(siteString)); //new Siteswap to pass by value and keep methods
				preset.index = index;
				initPreset(preset, true);
				printInfo(preset);
				resetLadder();
			}
		}
	}
	//</editor-fold> SITESWAP ENTRY *********************************************

	//<editor-fold> SITESWAP OPTIONS ********************************************
	var REPEATS = 1;

	var spinnerConfig = {step: 0.05, numberFormat: 'n'};
	var fillWhenEmpty = function(val, id) {
		if (document.getElementById(id).value == '') {
			document.getElementById(id).value = val;
		}
	}
	var logSpinnerConfig = {
		step: 0.0001,
		spin: function(event, ui) {
			event.preventDefault();
			//multiplier - how much it will multiply or divide when you click up or down respectively
			let m = 1.2;
			let spinner = $(this);
			let curVal = spinner.spinner('value');
			//set the upper limit (when clicking) to 12 clicks up
			if($(event.currentTarget).hasClass('ui-spinner-up')) {
				if (curVal*m <= Math.pow(m, 12)) {
					spinner.spinner('value', curVal*m);
				}
			}
			//set the lower limit similarly
			else {
				if (curVal/m >= Math.pow(m, -12)) {
					spinner.spinner('value', curVal/m);
				}
			}
			let newVal = spinner.spinner('value');
			//if the new value is close enough to 1 just round it to it
			if (newVal < 1.001 && newVal > 0.999) {
				spinner.spinner('value', 1);
			}
		},
		numberFormat: 'n',
		min: 0,
		max: 100
	};

	//initialize spinners, and make them default to specified values
	for (let i = 0; i < optInputs.length; i++) {
		$('#' + optInputs[i].id).spinner(optInputs[i].logSpin ? logSpinnerConfig : spinnerConfig);
		$('#' + optInputs[i].id).blur(function() {fillWhenEmpty(optInputs[i].defaultValue, optInputs[i].id)});
	}

	document.getElementById('siteswapOptionsForm').onsubmit = function(e) {
		e.preventDefault();
		getAttributes(preset);
		makeThrowInfo(preset, repeatCount.value);
		makeBeats(preset);
		resetLadder();

		animationInstance.generateMovements(preset, false);
	};

	document.getElementById('restoreDefaults').onclick = function() {
		for (let i = 0; i < optInputs.length; i++) {
			optInputs[i].element.value = optInputs[i].defaultValue;
		}
		repeatCount.value = REPEATS;
	}
	//</editor-fold> SITESWAP OPTIONS *******************************************

	//<editor-fold> LADDER DIAGRAM **********************************************
	//initialize repeat count selector
	$('#repeatCount').spinner();
	$('#repeatCount').blur(function() {fillWhenEmpty(REPEATS, 'repeatCount')});

	//initialize reset button
	$('#resetLadder').click(function() {
		try {
			var repeats = repeatCount.value;
			makeThrowInfo(preset, repeats);
			makeBeats(preset);
			resetLadder();
		}
		catch(e) {
			console.log(e);
			console.log('no preset');
		}
	});

	//<editor-fold> SLIDER FUNCS ************************************************
	$('.slider').slider({orientation: 'vertical'}); //initialize sliders
	var restrictHandleMovement = function(preset, ui, slider, isLeft) {
		var handleIndex = ui.handleIndex, //handle number, starting with 0 from bottom, index is same in beats
			value = ui.value,
			newValue = ui.value,
			beats = isLeft ? preset.beats.left : preset.beats.right,
			otherBeats = isLeft ? preset.beats.right : preset.beats.left,
			throwArray = preset.throwInfo.throws,
			dwellLimit = preset.options.dwellLimit, //shortest time you can hold the ball for
			throwLimit = preset.options.throwLimit, //shortest time you can throw a ball then catch another
			speedLimit = preset.options.speedLimit, //shortest time you can throw a ball to the other hand
			lowerLimit = 0,
			upperLimit = preset.throwInfo.endTime,
			endTime = preset.throwInfo.endTime,
			isThrow = (handleIndex % 2) ^ isLeft; //right hand throws are offset by one, so isLeft takes that into account

		//Find limits of handle
		//first set limits to neighboring handles: most common case
		if (handleIndex > 0) { //exclude bottom handle, already limited by slider
			lowerLimit = beats[handleIndex - 1] + (isThrow ? throwLimit : dwellLimit);
		}
		if (isLeft || handleIndex < beats.length - 1) { //every movable left handle has handle above, top right handle already limited by slider
			upperLimit = beats[handleIndex + 1] - (isThrow ? dwellLimit : throwLimit);
		}

		// sometimes, however, they are limited by the hand throwing to it/they are throwing to (this is always true for 1 throws)
		// also sometimes, we are limiting our throws with invisible zero throw handles. We want to avoid this
		if (isThrow) { //throw handle (will set upper limit)
			//first, we find the nearest non-zero handle above this throw
			var upperIndex = handleIndex + 2;
			for (let i = 0; i < throwArray.length; i++) {
				if (throwArray[i].end == upperIndex) {
					if (throwArray[i].start == throwArray[i].end) {
						upperIndex += 2;
						upperLimit = beats[upperIndex];
						i = 0;
					}
				}
			}

			//find nearest connected catch handle. we have to use for loops because there could be multiplexes
			for (let i = 0; i < throwArray.length; i++) { //find throws that this handle matches
				if (throwArray[i].start == handleIndex) {
					//first part of following if is to make sure we wont index out of beats
					if (throwArray[i].end <= preset.throwInfo.endTime && otherBeats[throwArray[i].end - 1] - speedLimit < upperLimit) { //in case there was a multiplex, we want to ensure it is the shortest throw
						upperLimit = otherBeats[throwArray[i].end - 1] - speedLimit;
					}
				}
			}
		} else { //catch handle (will set lower limit)
			//first, we find the nearest non-zero handle below this throw
			var lowerIndex = handleIndex - 1;
			for (let i = 0; i < throwArray.length; i++) {
				if (throwArray[i].start == lowerIndex) {
					if (throwArray[i].start == throwArray[i].end) {
						lowerIndex -= 2;
						lowerLimit = beats[lowerIndex];
						i = 0;
					}
				}
			}

			for (let i = 0; i < throwArray.length; i++) { //same deal as above
				if (throwArray[i].end == handleIndex + 1) { //+1 since the catch handle seen the same as the throw handle above it in throwArray
					if (otherBeats[throwArray[i].start] + speedLimit > lowerLimit) { //dont have to do check like above since start is always inside the ladder
						lowerLimit = otherBeats[throwArray[i].start] + speedLimit;
					}
				}
			}
		}

		//get rid of slider text
		slider.find('.ui-slider-handle').text((''));

		//if out of bounds, set value to the limit
		if (value > upperLimit) {
			slider.slider('values', handleIndex, upperLimit);
			newValue = upperLimit;
		}
		if (value < lowerLimit) {
			slider.slider('values', handleIndex, lowerLimit);
			newValue = lowerLimit;
		}

		//store new value in beats
		if (isThrow) {
			beats[handleIndex] = newValue;
		} else {
			beats[handleIndex] = newValue;
		}
	}

	//stolen from here, updated:
	//https://stackoverflow.com/questions/16152033/jquery-ui-slider-trying-to-disable-individual-handles
	$.widget("ui.slider", $.ui.slider, {
		_mouseCapture: function(event) {
			var position, normValue, distance, closestHandle, index, allowed, offset, mouseOverHandle,
				that = this,
				o = this.options;

			if (o.disabled) {
				return false;
			}

			this.elementSize = {
				width: this.element.outerWidth(),
				height: this.element.outerHeight()
			};
			this.elementOffset = this.element.offset();

			position = {
				x: event.pageX,
				y: event.pageY
			};
			normValue = this._normValueFromMouse(position);
			distance = this._valueMax() - this._valueMin() + 1;
			this.handles.each(function(i) {
				// Added condition to skip closestHandle test if this handle is disabled.
				// This prevents disabled handles from being moved or selected.
				if (!$(this).hasClass("ui-slider-handle-disabled")) {
					var thisDistance = Math.abs(normValue - that.values(i));
					if ((distance > thisDistance) || (distance === thisDistance && (i === that._lastChangedValue || that.values(i) === o.min))) {
						distance = thisDistance;
						closestHandle = $(this);
						index = i;
					}
				}
			});

			// Added check to exit gracefully if, for some reason, all handles are disabled
			if (typeof closestHandle === 'undefined')
				return false;

			allowed = this._start(event, index);
			if (allowed === false) {
				return false;
			}
			this._mouseSliding = true;

			this._handleIndex = index;

			this._addClass(closestHandle, null, "ui-state-active");
			closestHandle.trigger('focus');

			offset = closestHandle.offset();
			// Added extra condition to check if the handle currently under the mouse cursor is disabled.
			// This ensures that if a disabled handle is clicked, the nearest handle will remain under the mouse cursor while dragged.
			mouseOverHandle = !$(event.target).parents().addBack().is(".ui-slider-handle") || $(event.target).parents().addBack().is(".ui-slider-handle-disabled");
			this._clickOffset = mouseOverHandle ? {
				left: 0,
				top: 0
			} : {
				left: event.pageX - offset.left - (closestHandle.width() / 2),
				top: event.pageY - offset.top - (closestHandle.height() / 2) -
					(parseInt(closestHandle.css("borderTopWidth"), 10) || 0) -
					(parseInt(closestHandle.css("borderBottomWidth"), 10) || 0) +
					(parseInt(closestHandle.css("marginTop"), 10) || 0)
			};

			if (!this.handles.hasClass("ui-state-hover")) {
				this._slide(event, index, normValue);
			}
			this._animateOff = true;
			return true;
		}
	});
	//</editor-fold> SLIDER FUNCS ***********************************************

	//<editor-fold> CANVAS FUNCS ************************************************
	//canvas initializations
	var c = document.getElementById('ladderLines'); //initialize canvas
	var ctx = c.getContext('2d');
	c.height = $('#sliders').height() - 2; //same size as sliders, but accounting for border
	c.width = $('#sliders').width() - 2;
	var marginTop = parseInt($('#leftSlider').css('marginTop')) + 1; //+1 for border
	var marginSide = parseInt($('#leftSlider').css('marginLeft')) + 4; //+4 for border and inside width

	var sizeRatio;
	var windowResize = function() {
		ctx.transform(-1, 0, 0, 1, -marginSide, -(c.height - marginTop));
		c.height = $('#tabs').height() - $('#tabNames').height() - 48;
		c.width = $('#tabs').width();
		sizeRatio = c.height / preset.throwInfo.endTime;

		// ctx.resetTransform(); //not compatible with edge
		ctx.transform(1, 0, 0, -1, marginSide, c.height - marginTop);

		updateCanvasLines(preset, c, marginSide, sizeRatio);

		//update preset dialog sizes
		examplePresets.dialog('option', 'height', $('#tabs').height() - $('#tabNames').height() - 14);
		examplePresets.dialog('option', 'width', $('#tabs').width() - 20);
		customPresets.dialog('option', 'height', $('#tabs').height() - $('#tabNames').height() - 14);
		customPresets.dialog('option', 'width', $('#tabs').width() - 20);


		// document.getElementById('introVid').style.height = String($('#accordion').width() - 2) + 'px';
		// $('#introVid').width($('#accordion').width() - 2);
		// $('#introVid').height($('#accordion').width() * 9 / 16);

		// document.getElementById('info').style.height = String($('#tabs').height() - 20) + 'px';
		// console.log($('#tabs').height() - 20);
	}
	window.onresize = windowResize; //change element sizes when height changes
	if (animationInstance !== undefined) animationInstance.generateMovements(preset, false);

	//fills canvasLines array with start and end points on the canvas
	var updateCanvasLines = function(preset, canvas, marginSide, sizeRatio) {
		var endTime = preset.throwInfo.endTime;
		var canvasLines = [];
		var zeroThrows = new Array(endTime / 2).fill(0);
		//coordinate conversion, needs to know where y slider is (marginSide) and conversion between canvas pixels and slider values (sizeRatio)
		var coordinateFinder = function(throwNum, isLeft, marginSide, sizeRatio) { //isThrow should be 1 or 0
			if (isLeft) {
				return {
					x: 0,
					y: throwNum * sizeRatio
				};
			}
			return {
				x: marginSide * 2,
				y: throwNum * sizeRatio
			};
		}

		//fill canvasLines array with pixel start and pixel end coords, as well as info about the throw
		for (let i = 0; i < preset.throwInfo.throws.length; i++) {
			var curThrow = preset.throwInfo.throws[i]; //curThrow has start and end
			//when start is odd, it is right hand, so select from right array
			//within the array, select appropriate beat value. use endTime + 1 because the first beat is repeated at the top and bottom
			var start = (curThrow.start % 2 ? preset.beats.right : preset.beats.left)[curThrow.start % (endTime + 1)];
			var end = (curThrow.end % 2 ? preset.beats.right : preset.beats.left)[(curThrow.end - 1) % endTime];
			//curThrow.start is throw number without its position on slider, so we have to use preset.beats as well
			//same goes for .end, with +5 since the catch node is on the previous throw
			//(eg the catch for 7 is at time 6.9, which is on throw 6). also we dont want to mod negative nums so we add 6 (-1 + 6 = 5).
			var coords = coordinateFinder(start, !(curThrow.start % 2), marginSide, sizeRatio),
				nextCoords = coordinateFinder(end, curThrow.start % 2, marginSide, sizeRatio),
				odd = true,
				left = true;

			if (curThrow.start == curThrow.end) { //dont draw those silly 0 throws
				zeroThrows[(curThrow.start - 1) % endTime] = 1;
				continue;
			}

			if (!((curThrow.end - curThrow.start) % 2)) {
				odd = false; //throw lands in same hand its thrown from
				if (curThrow.start % 2) {
					left = false; //whether this line is on the left slider
				}
			}

			if (curThrow.start < curThrow.end % (preset.throwInfo.endTime + 1)) { //if line doesnt go off chart (+1 so we can still draw to node at the end of diagram)
				canvasLines.push({
					coords: coords,
					nextCoords: nextCoords,
					odd: odd,
					left: left,
					throw: true //this is not a dwell line but a throw line
				});
			} else {
				canvasLines.push({ //draw two lines, one going off bottom of canvas
					coords: {
						x: coords.x,
						y: coords.y - canvas.height
					},
					nextCoords: nextCoords,
					odd: odd,
					left: left,
					throw: true
				});
				canvasLines.push({ //and other going off the top of canvas
					coords: coords,
					nextCoords: {
						x: nextCoords.x,
						y: nextCoords.y + canvas.height
					},
					odd: odd,
					left: left,
					throw: true
				});
			}
		}

		//push catch lines, excluding zero throws
		for (let i = 2; i <= endTime; i += 2) {
			if (!zeroThrows[i - 1]) { //right hand dwells
				canvasLines.push({
					coords: coordinateFinder(preset.beats.right[i - 2], false, marginSide, sizeRatio),
					nextCoords: coordinateFinder(preset.beats.right[i - 1], false, marginSide, sizeRatio),
					odd: true, //odd so it draws straight lines
					left: true,
					throw: false
				});
			}
			if (!zeroThrows[i]) { //left hand dwells
				canvasLines.push({
					coords: coordinateFinder(preset.beats.left[i - 1], true, marginSide, sizeRatio),
					nextCoords: coordinateFinder(preset.beats.left[i], true, marginSide, sizeRatio),
					odd: true, //odd so it draws straight lines
					left: true,
					throw: false
				});
			}
		}

		//draw canvas lines
		(function() {
			ctx.clearRect(-100, -100, c.width + 100, c.height + 100);
			//draw throw lines
			for (let i = 0; i < canvasLines.length; i++) {
				ctx.beginPath();
				if (canvasLines[i].throw) {
					ctx.lineWidth = 3;
					var coords = {
							x: canvasLines[i].coords.x,
							y: canvasLines[i].coords.y
						},
						nextCoords = {
							x: canvasLines[i].nextCoords.x,
							y: canvasLines[i].nextCoords.y
						};

					ctx.moveTo(coords.x, coords.y);
					if (canvasLines[i].odd) {
						ctx.lineTo(nextCoords.x, nextCoords.y);
					} else {
						var offset = 40; //(nextCoords.y - coords.y) * 0.05; //how far the even throws go from sliders
						if (canvasLines[i].left) {
							ctx.bezierCurveTo(coords.x + offset, coords.y, coords.x + offset, nextCoords.y, coords.x, nextCoords.y);
						} else {
							ctx.bezierCurveTo(coords.x - offset, coords.y, coords.x - offset, nextCoords.y, coords.x, nextCoords.y);
						}
					}
				}
				else {
					var coords = {
							x: canvasLines[i].coords.x,
							y: canvasLines[i].coords.y
						},
						nextCoords = {
							x: canvasLines[i].nextCoords.x,
							y: canvasLines[i].nextCoords.y
						};

					ctx.moveTo(coords.x, coords.y);
					ctx.lineWidth = 8;
					ctx.lineTo(nextCoords.x, nextCoords.y);
				}

				ctx.stroke();
			}
		})();

	}
	//</editor-fold> CANVAS FUNCS ***********************************************

	var resetLadder = function() {
		$('#tabs').tabs('enable', '#ladderDiagram');
		windowResize(); //make canvas actually have stuff

		preset.beats.custom = false;

		//<editor-fold> SLIDER STUFF *********************************************
		//create arrays of values which will represent starting handle positions on the sliders
		var leftNodes = preset.beats.left,
			rightNodes = preset.beats.right;

		//must destroy old sliders so extra handles get added when necessary
		$('.slider').slider('destroy');

		//left slider creation
		$('#leftSlider').slider({
			orientation: 'vertical',
			step: 0.05,
			min: 0,
			max: preset.throwInfo.endTime,
			values: leftNodes,
			//i can either add a static handle to the top here, or add a weird element to the beats array
			//leftNodes.map(a => a.start).concat(leftNodes.map(a => a.end)).sort().concat([preset.throwInfo.endTime])

			create: function(ev, ui) {
				//disable t=0 and t=max handle, these handles restrict the time it takes the repeat
				$('#leftSlider').find('.ui-slider-handle:first').addClass('ui-slider-handle-disabled');
				$('#leftSlider').find('.ui-slider-handle:last').addClass('ui-slider-handle-disabled');
				//disable 0 catches
            for (let i = 0; i < preset.throwInfo.throws.length; i++) {
					var curThrow = preset.throwInfo.throws[i];
               if (curThrow.start == curThrow.end) { //if zero throw
						if (!(curThrow.start % 2)) { //if on left slider
							$('#leftSlider span:nth-child(' + curThrow.start + ')').addClass('ui-slider-handle-disabled'); //disable nth and nth + 1 handles
							document.querySelector('#leftSlider span:nth-child(' + curThrow.start + ')').style.display = 'none';
							$('#leftSlider span:nth-child(' + parseInt(curThrow.start + 1) + ')').addClass('ui-slider-handle-disabled');
							document.querySelector('#leftSlider span:nth-child(' + parseInt(curThrow.start + 1) + ')').style.display = 'none';
						}
               }
            }

				//set title of each handle to its starting value
				var arr = document.getElementById('leftSlider').children;
				for (let i = 0; i < arr.length; i++) {
					arr[i].title = leftNodes[i];
				}
			},

			slide: function(ev, ui) {

				// //show slider value when sliding
				// $('#leftSlider').find('.ui-state-active')
				// 	.text($('#leftSlider').slider('values', ui.handleIndex));

				//store current in beats (if it is out of range, it will be set appropriately with stop function. this just moves lines with handles)
				preset.beats.left[ui.handleIndex] = ui.value;

				updateCanvasLines(preset, c, marginSide, sizeRatio);
			},

			stop: function(ev, ui) { //when you stop moving the handle, it jumps to valid bounds
				restrictHandleMovement(preset, ui, $('#leftSlider'), true);
				updateCanvasLines(preset, c, marginSide, sizeRatio);

				if (ui.value == 0) {

				}

				//set title of handle to its resulting value
				var i = ui.handleIndex;
				document.getElementById('leftSlider').children[i].title = preset.beats.left[i];

				preset.beats.custom = true;

				animationInstance.generateMovements(preset, false);
			}
		});

		//right slider creation
		$('#rightSlider').slider({
			orientation: 'vertical',
			step: 0.05,
			min: 0,
			max: preset.throwInfo.endTime,
			values: rightNodes,

			create: function(ev, ui) {
				//disable 0 catches
				for (let i = 0; i < preset.throwInfo.throws.length; i++) {
					var curThrow = preset.throwInfo.throws[i];
					if (curThrow.start == curThrow.end) { //if zero throw
						if (curThrow.start % 2) { //if on right slider
							$('#rightSlider span:nth-child(' + curThrow.start + ')').addClass('ui-slider-handle-disabled'); //disable nth and nth + 1 handles
							document.querySelector('#rightSlider span:nth-child(' + curThrow.start + ')').style.display = 'none';
							$('#rightSlider span:nth-child(' + parseInt(curThrow.start + 1) + ')').addClass('ui-slider-handle-disabled');
							document.querySelector('#rightSlider span:nth-child(' + parseInt(curThrow.start + 1) + ')').style.display = 'none';
						}
					}
				}

				//set title of each handle to its starting value
				var arr = document.getElementById('rightSlider').children;
				for (let i = 0; i < arr.length; i++) {
					arr[i].title = rightNodes[i];
				}
			},

			slide: function(ev, ui) {
				// //show slider value when sliding
				// $('#rightSlider').find('.ui-state-active')
				// 	.text($('#rightSlider').slider('values', ui.handleIndex));

				//store current in beats (if it is out of range, it will be set appropriately with stop function. this is just for lines)
				preset.beats.right[ui.handleIndex] = ui.value;

				updateCanvasLines(preset, c, marginSide, sizeRatio);
			},

			stop: function(ev, ui) { //when you stop moving the handle, it jumps to valid bounds
				restrictHandleMovement(preset, ui, $('#rightSlider'), false);
				updateCanvasLines(preset, c, marginSide, sizeRatio);

				//set title of handle to its resulting value
				var i = ui.handleIndex;
				document.getElementById('rightSlider').children[i].title = preset.beats.right[i];

				preset.beats.custom = true;

				animationInstance.generateMovements(preset, false);
			}
		});

		document.querySelectorAll('.ui-slider-handle').forEach(function(a) {
			a.onclick = function(e) {
				e.preventDefault();
				//console.log(this);
			}
		});
		//</editor-fold> SLIDER STUFF ********************************************
	};

	let p = getParameterByName('p');
	if (p === null) {
		loadPreset(examplePresetArr[0]);
		updateCurrentPreset(document.getElementsByClassName('presetCard')[1]);
	}
	else {
		loadPreset(decodePreset(decode(p)));
		preset.index = customPresetArr.length;
		preset.name = "imported " + (preset.index + 1);
		preset.description = "imported " + (new Date).toLocaleString();
		addCustomPresetCard(preset, true);
	}

	//</editor-fold> LADDER DIAGRAM *********************************************
	//</editor-fold> INPUT ******************************************************
});
