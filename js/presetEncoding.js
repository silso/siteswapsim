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

let BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
let SITESWAPCODE = "0123456789abcdefghijklmnopqrstuvw[]()x*{},";

//what beats and options values are multiplied by before being encoded. Higher values mean less loss of info
let BEATFACTOR = 20;
let OPTIONFACTOR = 1000;

function encodePreset(pre) {
   //first, only take the parts of the preset we actually need. this exludes things that we can deduce such as siteswap properties.
   //for the siteswap itself, we only need to store the siteStr
   let obj = [];

   //if beats are custom, then the beats array will be encoded into the url, otherwise they will be left out and generated when the url is loaded
   if (pre.beats.custom) {
      obj[0] = [];
      for (i in pre.beats.left) {
         obj[0][i] = Math.floor(pre.beats.left[i]*BEATFACTOR);
      }
      obj[1] = [];
      for (i in pre.beats.right) {
         obj[1][i] = Math.floor(pre.beats.right[i]*BEATFACTOR);
      }
   }
   else {
      obj[0] = 0;
      obj[1] = 0;
   }

   obj[2] = [];
   for (i in pre.colors) {
      let color = JSON.parse("[" + pre.colors[i].slice(4, -1) + "]");
      obj[2].push(...color);
   }

   obj[3] = pre.custom ? 1 : 0;

   obj[4] = [];
   let preOptionsArr = Object.values(pre.options);
   let preOptionsLength = preOptionsArr.length;
   for (let i = 0; i < preOptionsLength; i++) {
      obj[4][i] = Math.floor(preOptionsArr[i]*OPTIONFACTOR);
   }

   obj[5] = pre.repeats;

   obj[6] = [];
   for (i in pre.site.siteStr) {
      obj[6][i] = SITESWAPCODE.indexOf(pre.site.siteStr[i]);
   }

   obj[7] = pre.beats.custom ? 1 : 0;

   obj[8] = [BEATFACTOR, OPTIONFACTOR];

   //turn new object into bitstring
   let bitString = "";
   //iterate through properties
   for (p in obj) {
      if (obj[p] instanceof Array) {
         //if it's an array, we'll iterate through it separating with 01
         let oPLen = obj[p].length;
         let i = 0;
         while (true) {
            let nStr = obj[p][i].toString(2);
            //add padding to make length multiple of 8
            while (nStr.length % 10) nStr = "0" + nStr;

            //separate bytes
            let nStrLength = nStr.length;
            let j = 0;
            while (true) {
               bitString += nStr.slice(j, j + 10);
               j += 10;
               if (j >= nStrLength) break;
               bitString += "00"; //more data to come
            }

            i++;
            if (i >= oPLen) break;
            bitString += "01"; //more array values to come
         }
      }
      else {
         let nStr = obj[p].toString(2);
         //add padding to make length multiple of 8
         while (nStr.length % 10) nStr = "0" + nStr;

         //separate bytes
         let nStrLength = nStr.length;
         let j = 0;
         while (true) {
            bitString += nStr.slice(j, j + 10);
            j += 10;
            if (j >= nStrLength) break;
            bitString += "00"; //more data to come
         }

      }

      bitString += "10"; //maybe more properties to come
   }

   //encode into base 64
   let result = "";
   for (let i = bitString.length - 6; i > -6; i -= 6) {
      let sub = bitString.slice(Math.max(0, i), i + 6);
      result = BASE64[parseInt(sub, 2)] + result;
   }

   return result;
}

function decodePreset(b64Str) {
   //reverse of encodePreset: first take your base 64 string, convert it to a bitstring, convert that into a simplified object,
   //then convert the simplified object into a preset.
   if (!(typeof b64Str === "string" || b64Str instanceof String))
      throw "Cannot decode non-string " + b64Str;

   let s = "";
   for (let i = b64Str.length - 1; i >= 0; i--) {
      let n = BASE64.indexOf(b64Str[i]).toString(2);
      while (n.length < 6) n = "0" + n;
      s = n + s;
   }

   let obj = {};
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
         if (obj[objI] === undefined) {
            obj[objI] = [];
         }
         obj[objI].push(n);
         nStr = "";
      }
      else if (connector === "10") {
         let n = parseInt(nStr, 2);
         if (obj[objI] instanceof Array)
            obj[objI].push(n);
         else
            obj[objI] = n;
         objI++;
         nStr = "";
      }
   }

   //convert simplified object into full-fledged preset
   let result = {};

   let [beatFactor, optionFactor] = obj[8];

   result.colors = [];
   for (let i = 0, oColorsLength = obj[2].length; i < oColorsLength; i += 3) {
      result.colors.push("rgb(" + obj[2][i] + "," + obj[2][i+1] + "," + obj[2][i+2] + ")");
   }

   result.custom = obj[3] ? true : false;

   result.options = {
      throwTime: obj[4][0]/optionFactor,
      dwellLimit: obj[4][1]/optionFactor,
      throwLimit: obj[4][2]/optionFactor,
      speedLimit: obj[4][3]/optionFactor,
      speedMultiplier: obj[4][4]/optionFactor,
      paceMultiplier: obj[4][5]/optionFactor
   }

   result.repeats = obj[5];

   let siteStr = "";
   if (obj[6] instanceof Array) {
      for (let i = 0, o6Length = obj[6].length; i < o6Length; i++) {
         siteStr += SITESWAPCODE[obj[6][i]];
      }
   }
   else {
      siteStr = SITESWAPCODE[obj[6]];
   }
   result.site = new Siteswap(siteStr);

   result.throwInfo = result.site.printThrowInfo(result.repeats);

   result.beats = {left:[], right:[], custom:obj[7]};
   if (obj[7]) {
      for (i in obj[0]) {
         result.beats.left[i] = obj[0][i]/beatFactor;
      }
      for (i in obj[1]) {
         result.beats.right[i] = obj[1][i]/beatFactor;
      }
   }
   else {
      //copied from index.js
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

function exportExamplePreset(pre) {
   let tempObj = {};
   tempObj.beats = {};
   if (pre.beats.custom) {
      tempObj.beats = JSON.parse(JSON.stringify(pre.beats));
   }
   else {
      tempObj.beats.custom = false;
   }

   tempObj.colors = JSON.parse(JSON.stringify(pre.colors));
   tempObj.custom = false;
   tempObj.name = pre.name;
   tempObj.description = pre.description;
   tempObj.options = JSON.parse(JSON.stringify(pre.options));
   tempObj.repeats = pre.repeats;
   tempObj.site = {};
   tempObj.site.siteStr = pre.site.siteStr;

   return JSON.stringify(tempObj);
}

function siteswapsToPresets() {
   let preArr = [];
   $.getJSON('js/exampleSiteswaps.json', function(json) {
      for (i in json) {
         preArr[i] =
            {"beats":{"custom":false},
            "custom":false,
            "name":json[i].n,
            "description":json[i].d,
            "options":{"throwTime":0.5,"dwellLimit":0.4,"throwLimit":0.25,"speedLimit":0.4,"speedMultiplier":1,"paceMultiplier":4},
            "repeats":1,
            "site":{"siteStr":json[i].s}};
      }
      window.open(`data:application/json,${encodeURI(JSON.stringify(preArr))}`);
   });
}
