// preset sharing via url:
//
// (name)
// (description)
// beats:
//    left
//    right
// colors
// custom
// options
//    throwTime
//    ...
// site (siteStr)

// two stage process, convert preset into intermediate object with only necessary values,
// then convert that into a bitstring

// _ _ _ _ _ _ _ _ _ _    _ _   ...
//         data         separator
// separator:
// 00    continuous data
// 01    next number in array
// 10    next property in object
// 11    unimplemented

let testPreset = JSON.parse('{"site":{"siteStr":"3","site":{"0":3,"length":1},"valid":true,"loops":[[{"n":3,"i":0}]],"numOfLoops":1,"loopTime":6,"multiplex":false,"sync":false,"propCount":3},"name":"3 ball cascade","description":"the simplest and easiest juggling pattern","repeats":1,"beats":{"left":[0,1.5,2,3.5,4,5.5,6],"right":[0.5,1,2.5,3,4.45,5]},"options":{"throwTime":0.5,"dwellLimit":0.4,"throwLimit":0.25,"speedLimit":0.4,"speedMultiplier":1,"paceMultiplier":1},"custom":false,"throwInfo":{"endTime":6,"throws":[{"start":0,"end":3},{"start":1,"end":4},{"start":2,"end":5},{"start":3,"end":6},{"start":4,"end":7},{"start":5,"end":8}]},"colors":["rgb(219,213,99)"]}');

let BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
let SITESWAPCODE = "0123456789abcdefghijklmnopqrstuvw[]()x*";

let BEATFACTOR = 20;
let OPTIONFACTOR = 1000;

function encodePreset(pre) {
   let result = [];

   if (pre.beats.custom) {
      result[0] = [];
      for (i in pre.beats.left) {
         result[0][i] = pre.beats.left[i]*BEATFACTOR;
      }
      result[1] = [];
      for (i in pre.beats.right) {
         result[1][i] = pre.beats.right[i]*BEATFACTOR;
      }
   }
   else {
      result[0] = 0;
      result[1] = 0;
   }

   result[2] = [];
   for (i in pre.colors) {
      let color = JSON.parse("[" + pre.colors[i].slice(4, -1) + "]");
      result[2].push(...color);
   }

   result[3] = pre.custom ? 1 : 0;

   result[4] = [];
   let preOptionsArr = Object.values(pre.options);
   let preOptionsLength = preOptionsArr.length;
   for (let i = 0; i < preOptionsLength; i++) {
      result[4][i] = Math.floor(preOptionsArr[i]*OPTIONFACTOR);
   }

   result[5] = pre.repeats;

   result[6] = [];
   for (i in pre.site.siteStr) {
      result[6][i] = SITESWAPCODE.indexOf(pre.site.siteStr[i]);
   }

   result[7] = pre.beats.custom ? 1 : 0;

   return result;
}

function decodePreset(o) {
   let result = {};

   result.colors = [];
   for (let i = 0, oColorsLength = o[2].length; i < oColorsLength; i += 3) {
      result.colors.push("rgb(" + o[2][i] + "," + o[2][i+1] + "," + o[2][i+2] + ")");
   }

   result.custom = o[3] ? true : false;

   result.options = {
      throwTime: o[4][0]/OPTIONFACTOR,
      dwellLimit: o[4][1]/OPTIONFACTOR,
      throwLimit: o[4][2]/OPTIONFACTOR,
      speedLimit: o[4][3]/OPTIONFACTOR,
      speedMultiplier: o[4][4]/OPTIONFACTOR,
      paceMultiplier: o[4][5]/OPTIONFACTOR
   }

   result.repeats = o[5];

   let siteStr = "";
   if (o[6] instanceof Array) {
      for (let i = 0, o6Length = o[6].length; i < o6Length; i++) {
         siteStr += SITESWAPCODE[o[6][i]];
      }
   }
   else {
      siteStr = SITESWAPCODE[o[6]];
   }
   result.site = new Siteswap(siteStr);

   result.throwInfo = result.site.printThrowInfo(result.repeats);

   result.beats = {left:[], right:[], custom:o[7]};
   if (o[7]) {
      for (i in o[0]) {
         result.beats.left[i] = o[0][i]/BEATFACTOR;
      }
      for (i in o[1]) {
         result.beats.right[i] = o[1][i]/BEATFACTOR;
      }
   }
   else {
      //copied from parseInput.js
		//makes an object with two arrays: the beat times of catches and throws for each hand. Catches are even, throws are odd
		result.beats.left.push(0);
		var syncDiff = !result.site.sync; //make right hand throws 1 beat out of sync with left hand when pattern isn't sync
		for (let i = 2; i <= result.throwInfo.endTime; i += 2) {
			result.beats.left.push(i - 1 + result.options.throwTime); //left hand catch time
			result.beats.left.push(i); //left hand throw time
			result.beats.right.push(i - syncDiff - 1 + result.options.throwTime); //right hand catch time
			result.beats.right.push(i - syncDiff); //right hand throw time
		}
   }

   return result;
}

function encode(o) {
   // add checks for proper object format

   let bitString = "";
   for (p in o) {
      if (o[p] instanceof Array) {
         let oPLen = o[p].length;
         let i = 0;
         while (true) {
            let nStr = o[p][i].toString(2);
            // add padding to make length multiple of 8
            while (nStr.length % 10) nStr = "0" + nStr;

            // separate bytes
            let nStrLength = nStr.length;
            let j = 0;
            while (true) {
               bitString += nStr.slice(j, j + 10);
               j += 10;
               if (j >= nStrLength) break;
               bitString += "00"; // more data to come
            }

            i++;
            if (i >= oPLen) break;
            bitString += "01"; // more array values to come
         }
      }
      else {
         let nStr = o[p].toString(2);
         // add padding to make length multiple of 8
         while (nStr.length % 10) nStr = "0" + nStr;

         // separate bytes
         let nStrLength = nStr.length;
         let j = 0;
         while (true) {
            bitString += nStr.slice(j, j + 10);
            j += 10;
            if (j >= nStrLength) break;
            bitString += "00"; // more data to come
         }

      }

      bitString += "10"; // maybe more properties to come
   }

   //encode into base 64
   result = "";
   for (let i = bitString.length - 6; i > -6; i -= 6) {
      let sub = bitString.slice(Math.max(0, i), i + 6);
      result = BASE64[parseInt(sub, 2)] + result;
   }

   return result;
}


function decode(b64Str) {
   if (typeof b64Str != "string")
      throw "Cannot decode non-string " + b64Str;

   let s = "";
   for (let i = b64Str.length - 1; i >= 0; i--) {
      let n = BASE64.indexOf(b64Str[i]).toString(2);
      while (n.length < 6) n = "0" + n;
      s = n + s;
   }

   let o = {};
   let sLength = s.length;
   let objI = 0, strI = 0;
   let nStr = "";
   while (strI < sLength) {
      nStr += s.slice(strI, strI + 10);
      strI += 10;
      let connector = s.slice(strI, strI + 2);
      strI += 2;
      if (connector === "01") {
         let n = parseInt(nStr, 2);
         if (o[objI] === undefined) {
            o[objI] = [];
         }
         o[objI].push(n);
         nStr = "";
      }
      else if (connector === "10") {
         let n = parseInt(nStr, 2);
         if (o[objI] instanceof Array)
            o[objI].push(n);
         else
            o[objI] = n;
         objI++;
         nStr = "";
      }
   }

   return o;
}




// binary to base 64
let Base64 = function () {

   let ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

   this.encode = function (str) {
      if (typeof str != "string") {
         throw "Cannot encode non-string into base 64";
      }

      // working backwards
      let result = "";
      for (let i = str.length - 6; i > -6; i -= 6) {
         let sub = str.slice(Math.max(0, i), i + 6);
         result = ALPHA[parseInt(sub, 2)] + result;
      }

      return result;
   };

   this.decode = function (str) {
      let result = "";
      for (let i = str.length - 1; i >= 0; i--) {
         let n = ALPHA.indexOf(str[i]).toString(2);
         while (n.length < 6) n = "0" + n;
         result = n + result;
      }

      return result;
   };
};

let b = new Base64();
