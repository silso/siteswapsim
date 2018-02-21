'use strict';

//TODO: instead of destroying sliders in resetLadder, delete handles. this way functions aren't redefined each time ladder is reset
//TODO: make sliders/canvas fit window height
//TODO: make slider handle value not on slider (by appending an element)

//temporary global to figure out animation stuff
var preset;

$(document).ready(function() {

  //misc initializations
  var site,
    throwTime = 0.5, //starting value for dwell
    dwellLimit = 0.1, //smallest allowed value for dwell time (default dwell time is 1 - throwTime)
    throwLimit = 0.1, //smallest allowed value for throws time
    siteswapForm = document.getElementById('siteswapForm');

    var Preset = function(site) {
      //this class holds the config of the siteswap, including rhythm.
      this.site = site; //siteswap object
      this.throwInfo = site.printLadderInfo(1); //such terrible names, idk. this has info about where lines go
      this.beatPattern = [0, 1]; //rhythm of this instance of a siteswap
    }
    Preset.prototype.makeBeatPattern = function(throwTime) {
      //makes an array of catch objects, each throw is 1 time unit, dwell time varies on user input
      //each object holds throws start and end time (the gap between one throw and the next catch, not when the thrown ball is caught)
      var Throw = function(start, end) {
        this.start = start;
        this.end = end;
      }

      this.beatPattern = [new Throw(0, throwTime)];
      for (let i = 1; i < this.throwInfo.throws.length; i++) {
        if (this.throwInfo.throws[i].start == this.throwInfo.throws[i - 1].start) {
          continue;
        }
        this.beatPattern.push(new Throw(this.throwInfo.throws[i].start, this.throwInfo.throws[i].start + throwTime));
      }

      //last catch is special, only one handle and is static
      this.beatPattern.push(new Throw(this.throwInfo.endTime, null));

      // console.log(this.beatPattern);
    }

  siteswapForm.onsubmit = function(e) {
    e.preventDefault();
    parseInput();
    resetLadder();
    animationInstance.init(preset);
  }

  var parseInput = function() {
    var input = document.getElementById('siteswapInput');
    site = new Siteswap(String(input.value));
    preset = new Preset(site);

    // console.log('array:', site.printArray());
    // console.table({
    //   'valid': site.isValid(),
    //   'siteswap': site.printSite(),
    //   'loops': site.printLoops(),
    //   'looptime': site.printLoopTime()
    // });

    // console.log('throwInfo: ', preset.throwInfo);
    // console.log('beatPattern: ', preset.beatPattern);
  }

  //canvas initializations
  var c = document.getElementById('ladderLines'),
    ctx = c.getContext('2d');

  var resetLadder = function() {
    //properly positions sliders and defines preset.beatPattern

    preset.makeBeatPattern(throwTime);

    var leftNodes = [],
      rightNodes = [];
    for (let i = 0; i < preset.beatPattern.length; i++) {
      if (i % 2) {
          rightNodes.push(preset.beatPattern[i].start);
          leftNodes.push(preset.beatPattern[i].end);
      }
      else {
          leftNodes.push(preset.beatPattern[i].start);
          rightNodes.push(preset.beatPattern[i].end);
      }
    }
    
    //without this, extra handles dont get added when loop time increases
    $('.slider').slider();
    $('.slider').slider('destroy');

    $('#leftSlider').slider({
      orientation: 'vertical',
      step: 0.05,
      min: 0,
      max: preset.throwInfo.endTime,
      values: leftNodes,
      //i can either add a static handle to the top here, or add a weird element to the beatPattern array
      //leftNodes.map(a => a.start).concat(leftNodes.map(a => a.end)).sort().concat([preset.throwInfo.endTime])


      create: function(ev, ui) {
        //disable t=0 and t=max handle
        $('#leftSlider').find('.ui-slider-handle:first').addClass('ui-slider-handle-disabled');
        $('#leftSlider').find('.ui-slider-handle:last').addClass('ui-slider-handle-disabled');
        //console.log($('#leftSlider').slider('values'));
      },

      slide: function(ev, ui) {
        //show slider value when sliding
        $('#leftSlider').find('.ui-state-active')
          .text($('#leftSlider').slider('values', ui.handleIndex));
      },

      //restrict handle range
      stop: function(ev, ui) {
        var handleIndex = ui.handleIndex, //handle number, starting with 0 from bottom, index is same in beatPattern
          value = ui.value,
          newValue = ui.value,
          beatPattern = preset.beatPattern;

        //check if too high or too low
        if (!(handleIndex % 2)) { //if throw handle
          if (value > beatPattern[handleIndex].end - throwLimit) { //if greater than corresponding catch handle
            $('#leftSlider').slider('values', handleIndex, beatPattern[handleIndex].end - throwLimit); //set throw handle to catch val - throwLimit
            newValue = beatPattern[handleIndex].end - throwLimit; //
          }
          else if (value < beatPattern[handleIndex - 1].end + throwLimit) { //if less than previous catch handle
            $('#leftSlider').slider('values', handleIndex, beatPattern[handleIndex - 1].end + throwLimit); //set throw handle to catch val + throwLimit
            newValue = beatPattern[handleIndex - 1].end + throwLimit;
          }
        }
        else { //if catch handle
          if (value > beatPattern[handleIndex + 1].start - dwellLimit) { //if greater than next throw handle
            $('#leftSlider').slider('values', handleIndex, beatPattern[handleIndex + 1].start - dwellLimit); //set catch handle to throw val - dwellLimit
            newValue = beatPattern[handleIndex + 1].start - dwellLimit;
          }
          else if (value < beatPattern[handleIndex].start + dwellLimit) { //if less than corresponding throw handle
            $('#leftSlider').slider('values', handleIndex, beatPattern[handleIndex].start + dwellLimit); //set catch handle to throw val + dwellLimit
            newValue = beatPattern[handleIndex].start + dwellLimit
          }
        }

        //store new value in beatPattern
        if (!(handleIndex % 2)) {
          beatPattern[handleIndex].start = newValue;
        }
        else {
          beatPattern[handleIndex].end = newValue;
        }

        console.log(beatPattern);

        //get rid of slider text
        $('#leftSlider').find('.ui-slider-handle').text((''));
      }
    });

    $('#rightSlider').slider({
      orientation: 'vertical',
      step: 0.05,
      min: 0,
      max: preset.throwInfo.endTime,
      values: rightNodes.slice(0, rightNodes.length - 1),

      slide: function(ev, ui) {
        //show slider value when sliding
        $('#rightSlider').find('.ui-state-active')
          .text($('#rightSlider').slider('values', ui.handleIndex));
      },

      //restrict handle range
      stop: function(ev, ui) {
        var handleIndex = ui.handleIndex, //handle number, starting with 0 from bottom, index is same in beatPattern
          value = ui.value,
          newValue = ui.value,
          beatPattern = preset.beatPattern;

        //check if too high or too low
        if (handleIndex % 2) { //if throw handle
          if (value > beatPattern[handleIndex].end - throwLimit) { //if greater than corresponding catch handle
            $('#rightSlider').slider('values', handleIndex, beatPattern[handleIndex].end - throwLimit); //set throw handle to catch val - throwLimit
            newValue = beatPattern[handleIndex].end - throwLimit; //
          }
          else if (value < beatPattern[handleIndex - 1].end + throwLimit) { //if less than previous catch handle
            $('#rightSlider').slider('values', handleIndex, beatPattern[handleIndex - 1].end + throwLimit); //set throw handle to catch val + throwLimit
            newValue = beatPattern[handleIndex - 1].end + throwLimit;
          }
        }
        else { //if catch handle
          if (value > beatPattern[handleIndex + 1].start - dwellLimit) { //if greater than next throw handle
            $('#rightSlider').slider('values', handleIndex, beatPattern[handleIndex + 1].start - dwellLimit); //set catch handle to throw val - dwellLimit
            newValue = beatPattern[handleIndex + 1].start - dwellLimit;
          }
          else if (value < beatPattern[handleIndex].start + dwellLimit) { //if less than corresponding throw handle
            $('#rightSlider').slider('values', handleIndex, beatPattern[handleIndex].start + dwellLimit); //set catch handle to throw val + dwellLimit
            newValue = beatPattern[handleIndex].start + dwellLimit
          }
        }

        //save new value in beatPattern
        if (handleIndex % 2) {
          beatPattern[handleIndex].start = newValue;
        }
        else {
          beatPattern[handleIndex].end = newValue;
        }

        console.log(beatPattern);

        //get rid of slider text
        $('#rightSlider').find('.ui-slider-handle').text((''));
      }
    });

    //ladder lines
    //set canvas
    c.height = $('#sliders').height();
    c.width = $('#sliders').width();
    var canvasHeight = c.height,
      canvasWidth = c.width,
      sliderHeight = $('#leftSlider').height(),
      sliderWidth = $('#leftSlider').width(),
      sliderMargin = (c.height - $('#leftSlider').height()) / 2 + Math.floor($('#leftSlider').width() / 2),
      throwCount = preset.throwInfo.throws.length,
      sizeRatio = sliderHeight / $('#leftSlider').slider('option','max'), //pixels per beat (please find better name)
      dwellGap = (1 - throwTime) * sizeRatio,
      throwGap = sizeRatio - dwellGap;

    ctx.transform(1, 0, 0, -1, sliderMargin, c.height - sliderMargin);

    //coordinate conversion
    var coordinateFinder = function(throwNum, isThrow) { //isThrow should be 1 or 0
      if (Math.ceil(throwNum) % 2) {//left slider, Math.ceil() because catch handles aren't on the integer
        return {x: Math.floor(sliderMargin * 2), y: Math.floor(throwNum * sizeRatio)}; //Math.floor() to ensure coords are on pixels
      }
      return {x: 0, y: Math.floor(throwNum * sizeRatio)};
    }

    //draw throw lines
    ctx.beginPath();
    for (let i = 0; i < throwCount; i++) {
      if (preset.throwInfo.throws[i].end != null) {
        var coords = coordinateFinder(preset.beatPattern[preset.throwInfo.throws[i].start].start, 1),
          nextCoords = coordinateFinder(preset.throwInfo.throws[i].end - dwellLimit, 0); //preset.beatPattern[preset.throwInfo.throws[i].end - 1].end

          ctx.moveTo(coords.x, coords.y);
        if ((preset.throwInfo.throws[i].end - preset.throwInfo.throws[i].start) % 2) {
          ctx.lineTo(nextCoords.x, nextCoords.y);
        }
        else {
          if (preset.throwInfo.throws[i].start % 2) {
            ctx.bezierCurveTo(coords.x - 40, coords.y, nextCoords.x - 40, nextCoords.y, nextCoords.x, nextCoords.y);
          }
          else {
            ctx.bezierCurveTo(coords.x + 40, coords.y, nextCoords.x + 40, nextCoords.y, nextCoords.x, nextCoords.y);
          }
        }
      }
    }
    ctx.stroke();
  };

  //stolen from here, updated:
  //https://stackoverflow.com/questions/16152033/jquery-ui-slider-trying-to-disable-individual-handles
  $.widget("ui.slider", $.ui.slider, {
    _mouseCapture: function (event) {
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
      this.handles.each(function (i) {
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
      if(typeof closestHandle === 'undefined')
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

    //$('#siteswapForm').submit(resetLadder);
    $('#resetLadder').click(resetLadder);
});
