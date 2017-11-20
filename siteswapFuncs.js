//Alexander Roelofs
//2017/11/12

//Includes functions for class siteswap

var siteswapTranslator = function(site) {
  /**
   * takes in siteswap in string form, returns siteswap in array form, along with
   * the siteswap's multiplexity, syncronicity, and validity
   */

  //vars
  var siteStr = site.replace('/\s+/g',''); //remove spaces
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

  //SYNTAX CHECKER
  //Stolen from gunswap.co
  var TOSS = '(\\d|[a-w])';
  var MULTIPLEX = '(\\[(\\d|[a-w])+\\])';
  var SYNCMULTIPLEX = '(\\[((\\d|[a-w])x?)+\\])';
  var SYNC = '\\((('+TOSS+'x?)|'+SYNCMULTIPLEX+'),(('+TOSS+'x?)|'+SYNCMULTIPLEX+')\\)';

  if (site[strLen - 1] == '*') { //'*' only allowed with sync patterns
    var BEAT = new RegExp('('+SYNC+')+','g');
    if (siteStr.match(BEAT) != siteStr.slice(0, -1)) {
      valid = false;
    }
  }
  else {
    var BEAT = new RegExp('(('+TOSS+'|'+MULTIPLEX+')+$)|('+SYNC+'+$)','g');
    if (siteStr.match(BEAT) != siteStr) {
      valid = false;
    }
  }

  if (!valid) {
    console.log("failed regex");
    return {siteArr: site, multiplex: multiplex, sync: sync, valid: valid};
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
      leftSide = '';
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

  //TRANSLATOR
  i = 0; //index in siteswap string
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
      }
      else {
        add = -1;
      }
    }
    else {
      add = 0;
    }

    //VANILLA
    if (!isNaN(char)) {
      siteArr[siteArr.length] = parseInt(char) + add;
      siteArr.length += 1;
    }
    else if (char.charCodeAt() >= 97) {
      siteArr[siteArr.length] = char.charCodeAt() - 87 + add;
      siteArr.length += 1;
    }

    //MULTIPLEX
    else if (char == '[') {
      mutliplex = true;
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
          }
          else {
            add = -1;
          }
        }
        else {
          add = 0;
        }

        if (!isNaN(char)) {
          siteArr[siteArr.length].push(parseInt(char) + add);
        }
        else if (String.fromCharCode(char) >= 97) {
          siteArr[siteArr.length].push(String.fromCharCode(char) - 87 + add);
        }
        i += 1;
      }
    }

    i += 1;
  }

  return {site: siteArr, multiplex: multiplex, sync: sync, valid: valid};
}

var repeatRemover = function(site) {
  //takes in siteswap array, returns reduced siteswap array

  var newSite = site;
  //checks for repeated sequences up to half the length of the siteswap
  for (var i = 1; i < Math.floor(site.length / 2) + 1; i++) {
    var sequence = site.slice(0, i);

    var k = i; //index after sequence being checked
    var foundRepeat = true;
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

  console.log(site);
  var siteLen = site.length;
  var valid = true;
  var corrCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many should land in each index
  var actualCatches = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many actually land in each index
  for (var i = 0; i < siteLen; i++) { //this loop builds corrCatches array
    if (site[i] instanceof Array) {
      corrCatches[i] = site[i].length; //amt of lands = amt of throws
    }
    else {
      corrCatches[i] = 1; //this is even for 0 case since "throw" lands in same spot
    }
  }
  for (var i = 0; i < siteLen; i++) { //this loop builds actualCatches array
    //add a 1 to index where the ball thrown lands
    if (site[i] instanceof Array) {
      for (var j = 0; j < site[i].length; j++) {
        actualCatches[(i + site[i][j]) % siteLen] += 1;
      }
    }
    else {
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
  var timesToTest = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many throws on this beat must be tested
  var timesTested = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many throws on this beat have already been tested

  for (var i = 0; i < siteLen; i++) {
    if (site[i] instanceof Array) {
      timesToTest[i] = site[i].length; //multiplex throw
    }
    else {
      timesToTest[i] = 1; //vanilla throw
    }
  }

  var i = 0;
  while (i < siteLen) {
    if (timesToTest[i] != timesTested[i] && site[i]) {
      var curTest = i;
      while (true) {
        if (timesTested[curTest] == timesToTest[curTest]) {
          loopNum += 1;
          loops.push([]);
          //i -= 1; //this makes sure we stay at the same spot
          break;
        }
        else {
          //add num to the loop
          if (site[i] instanceof Array) {
            loops[loopNum].push(site[curTest][timesTested[curTest]]);
            timesTested[curTest] += 1;
            curTest = (curTest + site[curTest][timesTested[curTest] - 1]) % siteLen;
          }
          else {
            loops[loopNum].push(site[curTest]);
            timesTested[curTest] += 1;
            curTest = (curTest + site[curTest]) % siteLen;
          }
        }
      }
    }

    i += 1;
  }

  return loops.slice(0, loops.length - 1);
}

var loopTimeFinder = function(loops) {
  //return how long the pattern takes to repeat

  function gcd(a, b) { return !b ? a : gcd(b, a % b); }
  function lcm(a, b) { return (a * b) / gcd(a, b); }

  var loopTimes = []; //array of how long it takes for each loop to repeat
  for (var loop = 0; loop < loops.length; loop++) {
    var singleLoopTime = 0;
    for (var throw_ = 0; throw_ < loops[loop].length; throw_++) {
      singleLoopTime += loops[loop][throw_]; //add the throw heights together
    }
    if (singleLoopTime % 2) {
      singleLoopTime *= 2; //if the loop is odd, it must loop again to return to the same hand
    }
    loopTimes.push(singleLoopTime);
  }

  var lt = loopTimes[0];
  for (var i = 1; i < loopTimes.length; i++) {
    lt = lcm(lt, loopTimes[i]); //find lcm of all loops
  }

  return Number(lt);
}
