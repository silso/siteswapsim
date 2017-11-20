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
		var returnStr = ''
		if (!valid) {
			returnStr = 'Invalid siteswap. Siteswap requested: ' + siteStr;
		}
		else {
			if (sync) {
				tempSite = site;
				if (site.length < 2) {
					tempSite = 2 * site;
				}
				for (i = 0; i < tempSite.length; i++) {
					num = tempSite[i];
					if (!(i % 2)) {
						returnStr += '(';
					}
					if (num instanceof Array) {
						returnStr += '[';
						for (thisNum in num) {
							if (thisNum > 9) {
								returnStr += String.fromCharCode(thisNum + 87);
							}
							else {
								returnStr += thisNum;
							}
							returnStr += ']';
						}
					}
					else {
						if (thisNum > 9) {
							returnStr += String.fromCharCode(thisNum + 87);
						}
						else {
							returnStr += thisNum;
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
				for (num in site) {
					if (num instanceof Array) {
						returnStr += '[';
						for (thisNum in num) {
							if (thisNum > 9) {
								returnStr += String.fromCharCode(thisNum + 87);
							}
							else {
								returnStr += thisNum;
							}
							returnStr += ']';
						}
					}
					else {
						if (thisNum > 9) {
							returnStr += String.fromCharCode(thisNum + 87);
						}
						else {
							returnStr += thisNum;
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
			return 'Invalid siteswap.';
		}
		else {
			if (loops == null) {
				return null;
			}
			else {
				for (loop = 0; loop < numOfLoops; i++) {
					for (num in loops[loop]) {
						if (thisNum > 9) {
							returnStr += String.fromCharCode(thisNum + 87);
						}
						else {
							returnStr += thisNum;
						}
					}
					if (loop < numOfLoops - 1) {
						returnStr += ',';
					}
				}
			}
		}
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
