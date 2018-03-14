//Includes functions for class siteswap
'use strict';

//TODO: expand siteswap in loops to standardize the output: eg siteswap 3 produces loops 3,3,3 instead of 3

var siteswapTranslator = function(site) {
	/**
	 * takes in siteswap in string form, returns siteswap in array form, along with
	 * the siteswap's multiplexity, syncronicity, and validity
	 */

	//vars
	var siteStr = site.replace('/\s+/g', ''); //remove spaces
	var strLen = siteStr.length;
	var siteArr = new Object();
	var multiplex = false;
	var sync = false;
	var valid = true;

	siteArr.slice = function(a, b) {
		var newArr = new Object();
		for (var i = a; i < b; i++) {
			newArr[i] = siteArr[i];
		}

		newArr.slice = siteArr.slice;
		newArr.length = b - a;
		return newArr;
	}

	if (siteStr[0] == '(') {
		sync = true;
	}

	//STAR GET-RID-OF'R
	if (siteStr[strLen - 1] == '*') {
		var newStr = siteStr.slice(0, -1);
		var j = 0;
		//loop copies the leftsides and puts them on the right
		while (j < strLen - 1) {
			j += 1; //skip '('
			newStr += '(';
			var leftSide = '';
			while (siteStr[j] != ',') {
				leftSide += siteStr[j];
				j += 1;
			}
			j += 1; //skip ','
			while (siteStr[j] != ')') {
				newStr += siteStr[j];
				j += 1;
			}
			newStr += ',';
			newStr += leftSide;
			newStr += ')';
			j += 1; //skip ')'
		}
		siteStr = newStr;
	}

	//translator
	var i = 0; //index in siteswap string
	siteArr.length = 0; //index in siteswap array
	strLen = siteStr.length; //update string length if there was '*'
	while (i < strLen) {
		var char = siteStr[i];
		var add;

		//SYNC
		if (char == '(' || char == ',' || char == ')' || char == 'x') { //skips formatting stuff
			i += 1;
			continue
		}
		if (sync && siteStr[i + 1] == 'x') { //check for crossing throws
			if (siteStr[i - 1] == '(') {
				add = 1; //when it's the first num
			} else {
				add = -1;
			}
		} else {
			add = 0;
		}

		//VANILLA
		if (!isNaN(char)) {
			siteArr[siteArr.length] = parseInt(char) + add;
			siteArr.length += 1;
		} else if (char.charCodeAt() >= 97) {
			siteArr[siteArr.length] = char.charCodeAt() - 87 + add;
			siteArr.length += 1;
		}

		//MULTIPLEX
		else if (char == '[') {
			multiplex = true;
			siteArr[siteArr.length] = [];

			var multiplexStart = i; //only used for sync 'x's
			add = 0; //this makes the num with the x odd to cross to the other hand

			i += 1;
			while (i < strLen) { //goes through multiplex
				var char = siteStr[i];
				if (char == ']') { //end multiplex
					siteArr.length += 1;
					break
				}

				if (sync && siteStr[i + 1] == 'x') { //when crossing, num is made odd
					if (siteStr[multiplexStart - 1] == '(') {
						add = 1;
					} else {
						add = -1;
					}
				} else {
					add = 0;
				}

				if (!isNaN(char)) {
					siteArr[siteArr.length].push(parseInt(char) + add);
				} else if (String.fromCharCode(char) >= 97) {
					siteArr[siteArr.length].push(String.fromCharCode(char) - 87 + add);
				}
				i += 1;
			}
		}

		i += 1;
	}

	if (sync) { //this rotates everything in the pattern so we can make the 1 throws go from the left hand, specifically so sync works on ladder diagram
		var newSiteArr = new Object();
		newSiteArr.slice = siteArr.slice;
		newSiteArr.length = siteArr.length;
		for (let i = 0; i < siteArr.length - 1; i++) {
			newSiteArr[i] = siteArr[i + 1];
		}
		newSiteArr[siteArr.length - 1] = siteArr[0];
		siteArr = newSiteArr;
	}

	return {
		site: siteArr,
		multiplex: multiplex,
		sync: sync,
		valid: valid
	};
}

var repeatRemover = function(site) {
	//takes in siteswap array, returns reduced siteswap array

	var newSite = site;
	//checks for repeated sequences up to half the length of the siteswap
	for (var i = 1; i < Math.floor(site.length / 2) + 1; i++) {
		var sequence = site.slice(0, i); //i is length of sequence

		var k = i; //k is index after sequence being checked
		var foundRepeat = true;
      if (!(site.length % i)) { //if this sequence fits, we might find a repeat
   		while (k < site.length - i + 1) { //loops until sequence can't fit
   			for (var j = 0; j <= i; j++) { //compares sequence to slice of array
   				if (sequence[j] != site.slice(k, k + i)[k + j]) {
   					foundRepeat = false; //if something doesn't match, this sequence isn't a repeat
   					break;
   				}
   			}
   			if (!foundRepeat) { //break while, move on to next sequence size
   				break;
   			}
   			k += i;
   		}
      }
      else { //if the sequence doesn't fit, repeat not possible
         foundRepeat = false;
      }
		if (foundRepeat) { //if we made it through while loop with sequence repeating the whole way, we can reduce siteswap to the sequence
			newSite = site.slice(0, i);
			newSite.length = i;
			break;
		}
	}

	return newSite;
}

var siteswapTest = function(site) {
	//takes in siteswap array, returns the throw-based validity of the pattern

	var siteLen = site.length;
	var valid = true;
	var corrCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many should land in each index
	var actualCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many actually land in each index
	for (var i = 0; i < siteLen; i++) { //this loop builds corrCatches array
		if (site[i] instanceof Array) {
			corrCatches[i] = site[i].length; //amt of lands = amt of throws
		} else {
			corrCatches[i] = 1; //this is even for 0 case since "throw" lands in same spot
		}
	}
	for (var i = 0; i < siteLen; i++) { //this loop builds actualCatches array
		//add a 1 to index where the ball thrown lands
		if (site[i] instanceof Array) {
			for (var j = 0; j < site[i].length; j++) {
				actualCatches[(i + site[i][j]) % siteLen] += 1;
			}
		} else {
			actualCatches[(i + site[i]) % siteLen] += 1;
		}
	}

	for (var i = 1; i < siteLen; i++) { //this loop compares corrCatches and actualCatches
		if (valid) {
			valid = corrCatches[i] == actualCatches[i];
		}
	}

	return valid;
}

var loopFinder = function(site) {
	//takes in siteswap array, returns an array of the loops that balls follow

	//TODO: this method gives different loop times depending on order of multiplexes: order shouldn't matter

	var siteLen = site.length;
	var loops = [[]]; //array of loops
	var loopNum = 0; //index where next loop goes in loops

	var tested = [];
	for (let i = 0; i < siteLen; i++) {
		if (site[i] instanceof Array) {
			tested.push([]);
			for (let j = 0; j < site[i].length; j++) {
				tested[i].push(0);
			}
		}
		else {
			tested.push(0);
		}
	}

	var i = 0;
	while (i < siteLen) {
		//console.log('tested:', JSON.stringify(tested));
		if (site[i] instanceof Array) {
			//console.log('site[',i,'] is an array');
			var isTestedi = true; //wish there were for elses
			//var j = 0; //j moves to first untested index in array
			for (let j = 0; j < site[i].length; j++) { //check throws in array

				if (!tested[i][j]) { //if throw in array is untested, do stuff
					//console.log('j = ',j,' is untested');
					isTestedi = false;
					break;
				}
			}
			if (isTestedi) { //if none are untested, move to next index in siteswap
				//console.log('multiplex at i = ',i, ' is fully tested, incrementing');
				i++;
				continue;
			}

			var k = i; //we change k as we jump around the siteswap
			while (true) {
				//console.log('looping');
				if (site[k] instanceof Array) { //if k is at a multiplex
					//console.log('site[',k,'] is an array');
					var l = 0;
					var isTestedk = true;
					for (; l < site[k].length; l++) { //increment j to untested index
						if (!tested[i][l]) {
							//console.log('l = ',l,' is untested');
							isTestedk = false;
							break;
						}
					}
					if (isTestedk) { //if none untested, assume loop is done since site is valid
						//console.log('all of site[',k,'] is tested, loop is done')
						loopNum++;
						loops.push([]);
						break;
					}
					//console.log('adding throw',site[k][l]);
					//at this point we should be at an untested throw, so we add to loops
					loops[loopNum].push({
						n: site[k][l],
						i: k
					});
					tested[k][l] = 1;
					k = (k + site[k][l]) % siteLen;
				}
				else { //if k is at a normal throw
					if (!tested[k]) { //if k is at an untested throw
						//console.log('adding throw',site[k]);
						loops[loopNum].push({
							n: site[k],
							i: k
						});
						tested[k] = 1;
						k = (k + site[k]) % siteLen;
					}
					else { //if k is at a tested throw
						loopNum++;
						loops.push([]);
						break; //loop is done
					}
				}
			}
		}
		else {
			if (!tested[i]) {
				var k = i; //we change k as we jump around the siteswap
				while (true) {
					//console.log('tested:', JSON.stringify(tested));
					if (site[k] instanceof Array) { //if k is at a multiplex
						var j = 0;
						var isTestedk = true;
						for (; j < site[k].length; j++) { //increment j to untested index
							if (!tested[k][j]) {
								//console.log(j,'break');
								isTestedk = false;
								break;
							}
						}
						//console.log(j);
						if (isTestedk) { //if none untested, assume loop is done since site is valid
							loopNum++;
							loops.push([]);
							break;
						}
						//console.log('adding throw',site[k][j]);
						//at this point we should be at an untested throw, so we add to loops
						loops[loopNum].push({
							n: site[k][j],
							i: k
						});
						tested[k][j] = 1;
						k = (k + site[k][j]) % siteLen;
					}
					else { //if k is at a normal throw
						if (!tested[k]) { //if k is at an untested throw
							//console.log('adding throw',site[k]);
							loops[loopNum].push({
								n: site[k],
								i: k
							});
							tested[k] = 1;
							k = (k + site[k]) % siteLen;
						}
						else { //if k is at a tested throw
							loopNum++;
							loops.push([]);
							break; //loop is done
						}
					}
				}
			}
			else {
				i++;
				continue;
			}
		}

		i++;
	}

	// var timesToTest = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many throws on this beat must be tested
	// var timesTested = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many throws on this beat have already been tested
	//
	//
	// for (var i = 0; i < siteLen; i++) {
	// 	if (site[i] instanceof Array) {
	// 		timesToTest[i] = site[i].length; //multiplex throw
	// 	} else {
	// 		timesToTest[i] = 1; //vanilla throw
	// 	}
	// }
	//
	// var i = 0;
	// while (i < siteLen) {
	// 	if (timesToTest[i] != timesTested[i] && site[i]) {
	// 		var curTest = i;
	// 		while (true) {
	// 			if (timesTested[curTest] == timesToTest[curTest]) {
	// 				loopNum += 1;
	// 				loops.push([]);
	// 				//i -= 1; //this makes sure we stay at the same spot
	// 				break;
	// 			} else {
	// 				//add num to the loop
	// 				if (site[i] instanceof Array) {
	// 					// console.log(site[curTest]);
	// 					// console.log(site[curTest][timesTested[curTest]]);
	// 					if (site[curTest] instanceof Array) {
	// 						loops[loopNum].push(site[curTest][timesTested[curTest]]);
	// 						timesTested[curTest] += 1;
	// 						curTest = (curTest + site[curTest][timesTested[curTest] - 1]) % siteLen;
	// 					} else {
	// 						loops[loopNum].push(site[curTest]);
	// 						timesTested[curTest] += 1;
	// 						curTest = (curTest + site[curTest]) % siteLen;
	// 					}
	// 				} else {
	// 					loops[loopNum].push(site[curTest]);
	// 					timesTested[curTest] += 1;
	// 					curTest = (curTest + site[curTest]) % siteLen;
	// 				}
	// 			}
	// 		}
	// 	}
	//
	// 	i += 1;
	// }

	return loops.slice(0, loops.length - 1);
}

var loopTimeFinder = function(loops) {
	//return how long the pattern takes to repeat

	function gcd(a, b) {
		return !b ? a : gcd(b, a % b);
	}

	function lcm(a, b) {
		return (a * b) / gcd(a, b);
	}

	var loopTimes = []; //array of how long it takes for each loop to repeat
	for (var loop = 0; loop < loops.length; loop++) {
		var singleLoopTime = 0;
		for (var throw_ = 0; throw_ < loops[loop].length; throw_++) {
			singleLoopTime += loops[loop][throw_].n; //add the throw heights together
		}
		if (singleLoopTime % 2) {
			singleLoopTime *= 2; //if the loop is odd, it must loop again to return to the same hand
		}
		loopTimes.push(singleLoopTime);
	}

	var lt = -1; //make it not possible to start with 0 throw
	for (var i = 0; i < loopTimes.length; i++) {
		if (lt < 0) {
			if (loopTimes[i])
				lt = loopTimes[i];
		}
		if (!loopTimes[i]) {
			continue;
		}
		lt = lcm(lt, loopTimes[i]); //find lcm of all loops
	}

	return Number(lt);
}

var beatPatternGenerator = function() {}

var propCount = function(site) {
  var sum = 0;
  for (var i = 0; i < site.length; i++) {
    if (site[i] instanceof Array) {
      for (var j = 0; j < site[i].length; j++) {
        sum += site[i][j];
      }
    }
    else {
      sum += site[i];
    }
  }
  return sum / site.length;
}
