'use strict';

var Siteswap = function(siteswapString){
	this.siteStr = siteswapString;
	this.site = new Object();
	this.valid = true;
	this.loops = null;
	this.numOfLoops = null;
	this.loopTime = null;
	this.beatPattern = null;
	this.multiplex = false;
	this.sync = false;

	var results = siteswapTranslator(this.siteStr);
	this.site = results.site;
	this.multiplex = results.multiplex;
	this.sync = results.sync;
	this.valid = results.valid;

	if (this.valid) {
		this.site = repeatRemover(this.site);
		this.valid = siteswapTest(this.site);
		var tested = true;
	}
	else {
		console.log('failed syntax');
	}

	if (this.valid) {
		this.loops = loopFinder(this.site);
		this.numOfLoops = this.loops.length;
		this.loopTime = loopTimeFinder(this.loops);
	}
	else if (tested) {
		console.log('failed testing');
	}
}

Siteswap.prototype.printSite = function() {
	var returnStr = '';
	if (!this.valid) {
		returnStr = 'Invalid siteswap. Siteswap requested: ' + this.siteStr;
	}
	else {
		if (this.sync) {
			var tempSite = this.site;
			if (this.site.length < 2) {
				tempSite = 2 * this.site;
			}
			for (let i = 0; i < tempSite.length; i++) {
				var beat = tempSite[i];
				if (!(i % 2)) {
					returnStr += '(';
				}
				if (beat instanceof Array) {
					returnStr += '[';
					for (let j = 0; j < beat.length; j++) {
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
			for (let i = 0; i < this.site.length; i++) {
				var beat = this.site[i];
				if (beat instanceof Array) {
					returnStr += '[';
					for (let j = 0; j < beat.length; j++) {
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
					if (this.site[i] > 9) {
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

Siteswap.prototype.printLoops = function() {
	var returnStr = '';
	if (!this.valid) {
		console.log('cannot print loops, invalid siteswap');
		return null;
	}
	else {
		if (this.loops == null) {
			return null;
		}
		else {
			for (let i = 0; i < this.numOfLoops; i++) {
				var loop = this.loops[i];
				for (let j = 0; j < loop.length; j++) {
					var toss = loop[j].n;
					if (toss > 9) {
						returnStr += String.fromCharCode(toss + 87);
					}
					else {
						returnStr += toss;
					}
				}
				if (i < this.numOfLoops - 1) {
					returnStr += ',';
				}
			}
		}
	}

	return returnStr;
}

Siteswap.prototype.printThrowInfo = function(repeats) {
	/**
	 * returns object of default times and throw positions
	 * time is beats, where there is (by default) 1 beat between every throw. if
	 * sync, then evens are on left, odds are on right, with 1 beat between sync
	 * left hand throw and sync right hand throw (as if it was async)
	 * NOT YET COMPATIBLE WITH SYNC/MULTIPLEX
	 */

	var throwInfo = new Object();
	throwInfo.endTime = this.loopTime * repeats;
	throwInfo.throws = [];

	/**
	 * Throw will have start property, which is where ball comes from, and end
	 * property, where balls land. This is for drawing lines between handles and
	 * maybe for simulation too. if throw lands off diagram (larger than
	 * loop time), make value null (maybe should change this).
	 */

	var Throw = function(start, end) {
		this.start = start;
		this.end = end;
	}

	for (let i = 0; i < throwInfo.endTime; i++) { //goes through every beat in loop time
		var curBeat = this.site[i % this.site.length]; //index in siteswap array
		if (curBeat instanceof Array) {
			for (let j = 0; j < curBeat.length; j++) {
				var end = (i + curBeat[j]);
				if (end == 0) {
					end = 6;
				}
				throwInfo.throws.push(new Throw(i, end));
			}
		}
		else {
			var end = (i + curBeat);
			if (end == 0) {
				end = 6;
			}
			throwInfo.throws.push(new Throw(i, end));
		}
	}

	return throwInfo;
}

Siteswap.prototype.printArray = function() {
	return this.site;
}
Siteswap.prototype.printLoopTime = function() {
	return this.loopTime;
}
Siteswap.prototype.isValid = function() {
	return this.valid;
}
Siteswap.prototype.isMultiplex = function() {
	return this.multiplex;
}
Siteswap.prototype.isSync = function() {
	return this.sync;
}
