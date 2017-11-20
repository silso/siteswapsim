//Alexander Roelofs
//2017/11/12

//Includes functions for class siteswap

var siteswapTranslator = function(site) {

  //vars
  var siteStr = site.replace('/\s+/g',''); //remove spaces
  var siteArr = new Object();
  var strLen = siteStr.length;
  var multiplex = false;
  var sync = false;
  var valid = true;

  siteArr.slice = function(a, b) {
    newArr = new Object();
    for (var i = a; i <= b; i ++) {
      newArr[i] = siteArr[i];
    }

    return newArr;
  }

  //SYNTAX CHECKER
  //Stolen from gunswap.co
  var TOSS = '(\\d|[a-w])';
  var MULTIPLEX = '(\\[(\\d|[a-w])+\\])';
  var SYNCMULTIPLEX = '(\\[((\\d|[a-w])x?)+\\])';
  var SYNC = '\\((('+TOSS+'x?)|'+SYNCMULTIPLEX+'),(('+TOSS+'x?)|'+SYNCMULTIPLEX+')\\)';

  if (site[strLen - 1] == '*') {
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
    newStr = siteStr.slice(0, -1);
    j = 0;
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
  strLen = siteStr.length; //update string length, if there was '*'
  while (i < strLen) {
    char = siteStr[i];

    //SYNC
    if (char == '(' || char == ',' || char == ')') { //skips formatting stuff
      i += 1;
      continue
    }
    if (sync && siteStr[i + 1] == 'x') { //check for crossing throws
      if (siteStr[i - 1] == '(') {
        add = 1;
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
    else if (String.fromCharCode(char) >= 97) {
      siteArr[siteArr.length] = String.fromCharCode(char) - 87 + add;
      siteArr.length += 1;
    }

    //MULTIPLEX
    else if (char == '[') {
      mutliplex = true;
      siteArr[siteArr.length] = [];

      multiplexStart = i; //only used for sync 'x's
      add = 0; //this makes the num with the x odd to cross to the other hand

      i += 1;
      while (i < strLen) {
        char = siteStr[i];
        if (char == ']') {
          siteArr.length += 1;
          break
        }

        if (sync && siteStr[i + 1] == 'x') {
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
  newSite = site;
  for (var i = 1; i < Math.floor(site.length / 2) + 1; i++) {
    sequence = site.slice(0, i);

    k = i;
    foundRepeat = true;
    while (k < site.length - i + 1) {
      if (sequence == site.slice(k, k + i)) {
        k += i;
        continue
      }
      foundRepeat = false;
      break
    }
    if (foundRepeat) {
      newSite = site.slice(0, i);
      break
    }
  }

  return newSite;
}

var siteswapTest = function(site) {
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
  siteLen = site.length;
  loops = [[]]; //array of loops
  loopNum = 0; //index where next loop goes in loops
  timesToTest = Array.apply(null, Array(siteLen)).map(Number.prototype.valueOf, 0); //how many throws on this beat must be tested
  timesTested = timesToTest; //how many throws on this beat have already been tested

  for (var i = 0; i < siteLen; i++) {
    if (site[i] instanceof Array) {
      timesToTest[i] = site[i].length;
    }
    else {
      timesToTest[i] = 1;
    }
  }

  i = 0;
  while (i < siteLen) {
    if (!timesToTest[i] == timesTested[i] && site[i]) {
      curTest = i;
      while (true) {
        if (timesTested[curTest] == timesToTest[curTest]) {
          loopNum += 1;
          loops.push([]);
          //i -= 1; //this makes sure we stay at the same spot
          break
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
  function gcd(a,b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (b > a) {
      var temp = a; a = b; b = temp;
    }
    while (true) {
      if (b == 0) return a;
        a %= b;
      if (a == 0) return b;
        b %= a;
    }
  }

  loopTimes = [];
  for (loop in loops) {
    singleLoopTime = 0;
    for (throw_ in loop) {
      singleLoopTime += throw_;
    }
    if (singleLoopTime % 2) {
      singleLoopTime *= 2;
    }
    loopTimes += [singleLoopTime];
  }
  lcm = loopTimes[0];
  for (i in loopTimes) {
    lcm = lcm * i / gcd(lcm, i);
  }

  return Number(lcm);
}
