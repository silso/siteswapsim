//import 'siteswapFuncs.js';

var Siteswap = function(siteswapString){
	var siteStr = siteswapString;
	var site = new Object();
	var valid = true;
	var loops = null;
	var numOfLoops = null;
	var loopTime = null;
	var multiplex = false;
	var sync = false;

	var results = siteswapTranslator(siteStr);
	site = results.site;
	multiplex = results.multiplex;
	sync = results.sync;
	valid = results.valid;

	if (valid) {
		site = repeatRemover(site);
		valid = siteswapTest(site);
		var tested = true;
	}
	else {
		console.log('failed syntax');
	}

	if (valid) {
		loops = loopFinder(site);
		numOfLoops = loops.length;
		loopTime = loopTimeFinder(loops);
	}
	else if (tested) {
		console.log('failed testing');
	}

	this.printSite = function() {
		var returnStr = '';
		if (!valid) {
			returnStr = 'Invalid siteswap. Siteswap requested: ' + siteStr;
		}
		else {
			if (sync) {
				var tempSite = site;
				if (site.length < 2) {
					tempSite = 2 * site;
				}
				for (i = 0; i < tempSite.length; i++) {
					var beat = tempSite[i];
					if (!(i % 2)) {
						returnStr += '(';
					}
					if (beat instanceof Array) {
						returnStr += '[';
						for (var j = 0; j < beat.length; j++) {
							var toss = beat[j];
							if (toss > 9) {
								returnStr += String.fromCharCode(toss + 87);
							}
							else {
								returnStr += toss;
							}
						}
						returnStr += ']';
					}
					else {
						if (beat > 9) {
							returnStr += String.fromCharCode(beat + 87);
						}
						else {
							returnStr += beat;
						}
					}
					if (!(i % 2)) {
						returnStr += ',';
					}
					else {
						returnStr += ')';
					}
				}
			}
			else {
				for (var i = 0; i < site.length; i++) {
					var beat = site[i];
					if (beat instanceof Array) {
						returnStr += '[';
						for (var j = 0; j < beat.length; j++) {
							var toss = beat[j];
							if (toss > 9) {
								returnStr += String.fromCharCode(toss + 87);
							}
							else {
								returnStr += toss;
							}
						}
						returnStr += ']';
					}
					else {
						if (site[i] > 9) {
							returnStr += String.fromCharCode(beat + 87);
						}
						else {
							returnStr += beat;
						}
					}
				}
			}
		}

		return returnStr;
	}

	this.printLoops = function() {
		returnStr = '';
		if (!valid) {
			console.log('cannot print loops, invalid siteswap');
			return null;
		}
		else {
			if (loops == null) {
				return null;
			}
			else {
				for (var i = 0; i < numOfLoops; i++) {
					var loop = loops[i];
					for (var j = 0; j < loop.length; j++) {
						var toss = loop[j];
						if (toss > 9) {
							returnStr += String.fromCharCode(toss + 87);
						}
						else {
							returnStr += toss;
						}
					}
					if (i < numOfLoops - 1) {
						returnStr += ',';
					}
				}
			}
		}

		return returnStr;
	}
	
	this.printArray = function() {
		return site;
	}
	this.printLoopTime = function() {
		return loopTime;
	}
	this.isValid = function() {
		return valid;
	}
	this.isMultiplex = function() {
		return multiplex;
	}
	this.isSync = function() {
		return sync;
	}
}
