//Includes functions for class siteswap
'use strict';

//TODO: expand siteswap in loops to standardize the output: eg siteswap 3 produces loops 3,3,3 instead of 3
//TODO: set uppercase letters to lowercase
//TODO: remove 0's from multiplexes

// var siteswapTranslator = function(site) {
// 	/**
// 	 * takes in siteswap in string form, returns siteswap in array form, along with
// 	 * the siteswap's multiplexity, syncronicity, and validity
// 	 */
//
// 	//vars
// 	var strLen = site.length;
// 	var siteArr = new Object();
// 	var multiplex = false;
// 	var sync = false;
// 	var valid = true;
//
// 	//define slice function
// 	siteArr.slice = function(a, b) {
// 		var newArr = new Object();
// 		for (let i = a; i < b; i++) {
// 			newArr[i] = siteArr[i];
// 		}
//
// 		newArr.slice = siteArr.slice;
// 		newArr.length = b - a;
// 		return newArr;
// 	}
//
// 	if (site[0] == '(') {
// 		sync = true;
// 	}
//
// 	//STAR GET-RID-OF'R
// 	if (site[strLen - 1] == '*') {
// 		var newStr = site.slice(0, -1);
// 		var j = 0;
// 		//loop copies the leftsides and puts them on the right
// 		while (j < strLen - 1) {
// 			j += 1; //skip '('
// 			newStr += '(';
// 			var leftSide = '';
// 			while (site[j] != ',') {
// 				leftSide += site[j];
// 				j += 1;
// 			}
// 			j += 1; //skip ','
// 			while (site[j] != ')') {
// 				newStr += site[j];
// 				j += 1;
// 			}
// 			newStr += ',';
// 			newStr += leftSide;
// 			newStr += ')';
// 			j += 1; //skip ')'
// 		}
// 		site = newStr;
// 	}
//
// 	//translator
// 	var i = 0; //index in siteswap string
// 	siteArr.length = 0; //index in siteswap array
// 	strLen = site.length; //update string length if there was '*'
// 	while (i < strLen) {
// 		var char = site[i];
// 		var add;
//
// 		//SYNC
// 		if (char == '(' || char == ',' || char == ')' || char == 'x') { //skips formatting stuff
// 			i += 1;
// 			continue
// 		}
// 		if (sync) { //check for crossing throws
// 			let j = i + 1;
// 			let isCross = false;
// 			while (j < strLen) { //look for an x
// 				let curChar = site[j];
// 				if (curChar == ',' || curChar == ')') { //there is no x
// 					if (isCross)
// 						add = curChar == ',' ? add = 1 : add = -1;
// 					else
// 						add = 0;
// 					break;
// 				}
// 				if (curChar == 'x') {
// 					isCross = true;
// 				}
// 				j += 1;
// 			}
// 		} else {
// 			add = 0;
// 		}
//
// 		//VANILLA
// 		if (!isNaN(char)) {
// 			siteArr[siteArr.length] = parseInt(char) + add;
// 			siteArr.length += 1;
// 		} else if (char.charCodeAt() >= 97 && char.charCodeAt() <= 122) {
// 			siteArr[siteArr.length] = char.charCodeAt() - 87 + add;
// 			siteArr.length += 1;
// 		}
//
// 		//CUSTOM TOSS
// 		if (char == '{') {
// 			i += 1;
// 			char = site[i];
// 			let numString = '';
// 			while (char != '}') {
// 				numString += char;
// 				i += 1;
// 				char = site[i];
// 			}
// 			siteArr[siteArr.length] = parseInt(numString) + add;
// 			siteArr.length += 1;
// 		}
//
// 		//MULTIPLEX
// 		else if (char == '[') {
// 			multiplex = true;
// 			siteArr[siteArr.length] = [];
// 			console.log(JSON.stringify(siteArr));
//
// 			var multiplexStart = i; //only used for sync 'x's
// 			add = 0; //this makes the num with the x odd to cross to the other hand
//
// 			i += 1;
// 			while (i < strLen) { //goes through multiplex
// 				var char = site[i];
// 				if (char == ']') { //end multiplex
// 					siteArr.length += 1;
// 					break
// 				}
//
// 				if (sync) { //check for crossing throws
// 					let j = i + 1;
// 					let isCross = false;
// 					while (j < strLen) { //look for an x
// 						let curChar = site[j];
// 						if (curChar == ',' || curChar == ')') { //there is no x
// 							if (isCross)
// 								add = curChar == ',' ? add = 1 : add = -1;
// 							else
// 								add = 0;
// 							break;
// 						}
// 						if (curChar == '}') { //crossing for evaluated throws
// 							isCross = site[j + 1] == 'x';
// 							j += 1; //skip over the x so we dont get confused
// 						}
// 						else {
// 							isCross = site[j + 1] == 'x';
// 						}
// 						j += 1;
// 					}
// 				} else {
// 					add = 0;
// 				}
//
// 				//VANILLA
// 				if (!isNaN(char)) {
// 					console.log(char);
// 					console.log(siteArr);
// 					siteArr[siteArr.length].push(parseInt(char) + add);
// 				} else if (String.fromCharCode(char) >= 97 >= 122) {
// 					siteArr[siteArr.length].push(String.fromCharCode(char) - 87 + add);
// 				}
//
//
// 				//CUSTOM TOSS
// 				if (char == '{') {
// 					i += 1;
// 					char = site[i];
// 					let numString = '';
// 					while (char != '}') {
// 						numString += char;
// 						i += 1;
// 						char = site[i];
// 					}
// 					siteArr[siteArr.length].push(parseInt(numString) + add);
// 				}
//
// 				i += 1;
// 			}
// 		}
//
// 		i += 1;
// 	}
//
// 	if (sync) { //this rotates everything in the pattern so we can make the 1 throws go from the left hand, specifically so sync works on ladder diagram
// 		var newSiteArr = new Object();
// 		newSiteArr.slice = siteArr.slice;
// 		newSiteArr.length = siteArr.length;
// 		for (let i = 0; i < siteArr.length - 1; i++) {
// 			newSiteArr[i] = siteArr[i + 1];
// 		}
// 		newSiteArr[siteArr.length - 1] = siteArr[0];
// 		siteArr = newSiteArr;
// 	}
//
// 	console.log(siteArr);
//
// 	return {
// 		site: siteArr,
// 		multiplex: multiplex,
// 		sync: sync,
// 		valid: valid
// 	};
// }

var siteswapTranslator = function(site) {
	/**
	 * takes in siteswap in string form, returns siteswap in array form, along with
	 * the siteswap's multiplexity, syncronicity, and validity
	 */

	//vars
	var siteArr = new Object();
	var multiplex = false;
	var sync = false;
	var valid = true;

	//STAR GET-RID-OF'R
	if (site[site.length - 1] == '*') {
		var newStr = site.slice(0, -1);
		var j = 0;
		//loop copies the leftsides and puts them on the right
		while (j < site.length - 1) {
			j += 1; //skip '('
			newStr += '(';
			var leftSide = '';
			while (site[j] != ',') {
				leftSide += site[j];
				j += 1;
			}
			j += 1; //skip ','
			while (site[j] != ')') {
				newStr += site[j];
				j += 1;
			}
			newStr += ',';
			newStr += leftSide;
			newStr += ')';
			j += 1; //skip ')'
		}
		site = newStr;
	}

	//translator
	//make a decision tree where you navigate the siteswap depth first

	function parseSimple(char) {
		var returnVal = 0;
		if (!isNaN(char)) { //if char is number
			returnVal = parseInt(char);
		} else if (String.fromCharCode(char) >= 97 >= 122) { //if char is lowercase letter
			returnVal = String.fromCharCode(char);
		}

		return returnVal;
	}

	function parseComplex(string) {
		var returnVal = 0;

		returnVal = parseInt(string.slice(1,-1));

		return returnVal;
	}

	function parseMultiplex(string) {
		/*
		returnVals:
			length: int - equal to n + 1
			0:
				val: int - represents throw height
				cross: bool - whether or not the throw crosses
			1:
				val:
				cross:
			2:
			...
			n:
				val:
				cross:
		*/

		multiplex = true;

		var returnVals = new Object();
		returnVals.length = 0;

		var i = 1;
		while (i < string.length - 1) {
			var char = string[i]; //current character
			returnVals[returnVals.length] = new Object();

			if (char == '{') { //if this is a complex toss
				var tempString = '';
				while (string[i] != '}') {
					tempString += string[i];
					i += 1;
				}
				tempString += '}';

				returnVals[returnVals.length].val = parseComplex(tempString);
				returnVals[returnVals.length].cross = false;
				returnVals.length += 1;
			}
			else if (char == 'x') { //if the previous toss was crossing
				returnVals[returnVals.length - 1].cross = true;
			}
			else { //if this is a simple throw
				returnVals[returnVals.length].val = parseSimple(char);
				returnVals[returnVals.length].cross = false;
				returnVals.length += 1;
			}

			i += 1;
		}

		return returnVals;
	}

	function parseSync(string) {
		/*
		returnVals:
			length: int - equal to n + 1
			0: int/array - represents toss or multiplex toss
			1:
			2:
			...
			n:
		*/

		sync = true;

		var returnVals = new Object();
		returnVals.length = 0;

		var i = 1;
		var side = 'left';
		while (i < string.length - 1) {
			var char = string[i];
			if (char == ',') { //end of left side
				side = 'right';
			}
			else if (char == ')') { //end of right side
				side = 'left';
				i += 1;
			}
			else if (char == '[') { //if this is a multiplex
				var tempString = '';
				while (string[i] != ']') {
					tempString += string[i];
					i += 1;
				}
				tempString += ']';

				var tempVals = parseMultiplex(tempString);
				var tempArr = [];
				for (let j = 0; j < tempVals.length; j++) {
					if (tempVals[j].cross) {
						if (side == 'left') {
							tempArr.push(tempVals[j].val + 1);
						}
						else {
							tempArr.push(tempVals[j].val - 1);
						}
					}
					else {
						tempArr.push(tempVals[j].val);
					}
				}

				returnVals[returnVals.length] = tempArr;
				returnVals.length += 1;
			}
			else if (char == '{') { //if this is a complex toss
				var tempString = '';
				while (string[i] != '}') {
					tempString += string[i];
					i += 1;
				}
				tempString += '}';

				returnVals[returnVals.length] = parseComplex(tempString);
				returnVals.length += 1;
			}
			else if (char == 'x') {
				if (side == 'left') {
					returnVals[returnVals.length - 1] += 1;
				}
				else {
					returnVals[returnVals.length - 1] -= 1;
				}
			}
			else { //if this is a simple toss
				returnVals[returnVals.length] = parseSimple(char);
				returnVals.length += 1;
			}

			i += 1;
		}

		return returnVals;
	}

	function parseVanilla(string) {
		/*
		returnVals:
			length: int - equal to n + 1
			0: int/array - represents toss or multiplex toss
			1:
			2:
			...
			n:
		*/

		var returnVals = new Object();
		returnVals.length = 0;

		var i = 0;
		while (i < string.length) {
			var char = string[i];
			if (char == '[') { //if this is a multiplex
				var tempString = '';
				while (string[i] != ']') {
					tempString += string[i];
					i += 1;
				}
				tempString += ']';

				var tempVals = parseMultiplex(tempString);
				var tempArr = [];
				for (let j = 0; j < tempVals.length; j++) {
					tempArr.push(tempVals[j].val);
				}

				returnVals[returnVals.length] = tempArr;
				returnVals.length += 1;
			}
			else if (char == '{') { //if this is a complex toss
				var tempString = '';
				while (string[i] != '}') {
					tempString += string[i];
					i += 1;
				}
				tempString += '}';

				returnVals[returnVals.length] = parseComplex(tempString);
				returnVals.length += 1;
			}
			else { //if this is a simple toss
				returnVals[returnVals.length] = parseSimple(char);
				returnVals.length += 1;
			}

			i += 1;
		}

		return returnVals;
	}

	function parseSiteswap(string) {
		var returnVals = new Object();
		returnVals.length = 0;

		if (string[0] == '(') { //if this is a sync pattern
			returnVals = parseSync(string);

		}
		else { //if this is a vanilla pattern
			returnVals = parseVanilla(string);
		}

		return returnVals;
	}

	siteArr = parseSiteswap(site);

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

	//define slice function
	siteArr.slice = function(a, b) {
		var newArr = new Object();
		for (let i = a; i < b; i++) {
			newArr[i] = siteArr[i];
		}

		newArr.slice = siteArr.slice;
		newArr.length = b - a;
		return newArr;
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
	for (let i = 1; i < Math.floor(site.length / 2) + 1; i++) {
		var sequence = site.slice(0, i); //i is length of sequence

		var k = i; //k is index after sequence being checked
		var foundRepeat = true;
      if (!(site.length % i)) { //if this sequence fits, we might find a repeat
   		while (k < site.length - i + 1) { //loops until sequence can't fit
   			for (let j = 0; j <= i; j++) { //compares sequence to slice of array
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

var multiplexZeroRemover = function(site) {
	//takes in siteswap array, returns siteswap array without zeroes in multiplexes

	var newSite = site;
	for (let i = 0; i < site.length; i++) {
		if (site[i] instanceof Array) {
			for (let j = 0; j < site[i].length; j++) {
				if (site[i][j] == 0) {
					site[i].splice(j, 1); //remove zero from multiplex
					j -= 1; //compensate for site[i] getting shorter
				}
			}
		}
	}

	return newSite;
}

var tidySiteswapArr = function(site) {
	//takes in siteswap array, returns siteswap array with unwanted properties removed

	var newSite = site;
	newSite = repeatRemover(newSite); //reduce repeated siteswaps (eg 423423 -> 423)
	newSite = multiplexZeroRemover(newSite); //remove zeroes from siteswaps (eg [30] -> [3])

	return newSite;
}

var siteswapTest = function(site) {
	//takes in siteswap array, returns the throw-based validity of the pattern

	var siteLen = site.length;
	var valid = true;
	var corrCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many should land in each index
	var actualCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many actually land in each index
	for (let i = 0; i < siteLen; i++) { //this loop builds corrCatches array
		if (site[i] instanceof Array) {
			corrCatches[i] = site[i].length; //amt of lands = amt of throws
		} else {
			corrCatches[i] = 1; //this is even for 0 case since "throw" lands in same spot
		}
	}
	for (let i = 0; i < siteLen; i++) { //this loop builds actualCatches array
		//add a 1 to index where the ball thrown lands
		if (site[i] instanceof Array) {
			for (let j = 0; j < site[i].length; j++) {
				actualCatches[(i + site[i][j]) % siteLen] += 1;
			}
		} else {
			actualCatches[(i + site[i]) % siteLen] += 1;
		}
	}

	for (let i = 1; i < siteLen; i++) { //this loop compares corrCatches and actualCatches
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
	//console.log('current pattern:', site);
	while (i < siteLen) {
		//console.log('new i =', i, 'site[i] =', site[i]);
		//console.log('tested:', JSON.stringify(tested));
		if (site[i] instanceof Array) {
			//console.log('site[',i,'] is an array');
			var isTestedi = true; //wish there were for elses
			var start = 0; //index which we started on and must end on
			//var j = 0; //j moves to first untested index in array
			for (let j = 0; j < site[i].length; j++) { //check throws in array

				if (!tested[i][j]) { //if throw in array is untested, do stuff
					//console.log('j = ',j,' is untested');
					isTestedi = false;
					start = i;
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

					if (k == i && loops[loopNum][0] != undefined) {
						i = -1;
						loopNum++;
						loops.push([]);
						break;
					}
					var l = 0;
					var isTestedk = true;
					//console.log(JSON.stringify(tested));
					for (; l < site[k].length; l++) { //increment j to untested index
						if (!tested[k][l]) {
							//console.log('l = ',l,' is untested');
							isTestedk = false;
							break;
						}
						else {
							//console.log('this was tested');
						}
					}
					// if (isTestedk) { //if none untested, assume loop is done since site is valid
					// 	//console.log('all of site[',k,'] is tested, loop is done')
					// 	i = 0;
					// 	loopNum++;
					// 	loops.push([]);
					// 	break;
					// }
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
						//console.log('should not be here');
						i = -1;
						loopNum++;
						loops.push([]);
						break; //loop is done
					}
				}
			}
		}
		else { //not multiplex
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
							i = 0;
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
							i = 0;
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
	for (let loop = 0; loop < loops.length; loop++) {
		var singleLoopTime = 0;
		for (let throw_ = 0; throw_ < loops[loop].length; throw_++) {
			singleLoopTime += loops[loop][throw_].n; //add the throw heights together
		}
		if (singleLoopTime % 2) {
			singleLoopTime *= 2; //if the loop is odd, it must loop again to return to the same hand
		}
		loopTimes.push(singleLoopTime);
	}

	var lt = -1; //make it not possible to start with 0 throw
	for (let i = 0; i < loopTimes.length; i++) {
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

var propCount = function(site) {
	var sum = 0;
	for (let i = 0; i < site.length; i++) {
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
