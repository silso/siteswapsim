'use strict';

$(document).ready(function() {

  var onsubmit = document.getElementById('siteswapForm');
  onsubmit.onsubmit = function(e) {
    e.preventDefault();
    parseInput();
  }

  var site;
  var parseInput = function() {
    var input = document.getElementById('siteswapInput');
    site = new Siteswap(String(input.value));
    console.log('valid?:', site.isValid());
    console.log('array:', site.printArray());
    console.log('siteswap:', site.printSite());
    console.log('loops:', site.printLoops());
    console.log('looptime:', site.printLoopTime());
    console.log('_____________________');
  }

  var dwellTime = 0.1; //set value for dwell
  var dwellLimit = 0.1; //smallest allowed value for dwell time
  var throwLimit = 0.1; //smallest allowed value for throws time (default throw time is 1 - dwellTime)
  var defaultLadder;
  var ladderLinesArray;
  var catchTimes = [0, 1];
  var Catch = function(start, end) {
    this.start = start;
    this.end = end;
  }

  var c = document.getElementById('ladderLines');
  //$('ladderLines').css('padding',$('leftSlider').css('padding'));
  var ctx = c.getContext('2d');
  c.height = 500;
  var ladderGap;
  var ladderWidth;
  var ladderHeight;

  var resetLadder = function() {
    defaultLadder = site.printLadderInfo(1);
    //console.log(defaultLadder);

    catchTimes = [new Catch(0, dwellTime)];
    for (var i = 1; i < defaultLadder.endTime; i++) {
      catchTimes.push(new Catch(defaultLadder.throws[i].start, defaultLadder.throws[i].start + dwellTime));
    }
    var leftNodes = [];
    var rightNodes = [];
    for (var i = 0; i < catchTimes.length; i++) {
      if (i % 2) {
          rightNodes.push(catchTimes[i]);
      }
      else {
          leftNodes.push(catchTimes[i]);
      }
    }

    // //ladder lines
    // c.height = $('#sliders').height();
    // c.width = $('#sliders').width();
    // var margin = (c.height - $('#leftSlider').height()) / 2;
    // ctx.transform(1, 0, 0, -1, margin, c.height - margin);
    //
    //
    //
    // //for (var i = 0; i < defaultLadder.endTime; i++) {
    //   ctx.beginPath();
    //   ctx.moveTo(2 * margin, 0);
    //   ctx.lineTo(2 * margin + 50, 50);
    //   ctx.stroke();
    // //}

    //without this, extra handles dont get added when loop time increases
    $('.slider').slider();
    $('.slider').slider('destroy');

    $('#leftSlider').slider({
      orientation: 'vertical',
      step: 0.05,
      min: 0,
      max: catchTimes[catchTimes.length - 1].start + 1 - throwLimit, //
      values: leftNodes.map(a => a.start).concat(leftNodes.map(a => a.end)).sort(),

      create: function(ev, ui) {
        //disable t=0 handle
        $('#leftSlider').find('.ui-slider-handle:first').addClass('ui-slider-handle-disabled');
      },

      slide: function(ev, ui) {
        //show slider value when sliding
        $('#leftSlider').find('.ui-state-active')
          .text($('#leftSlider').slider('values', ui.handleIndex));
        //TO-DO: append element so text isn't on handle
      },

      //restrict handle range
      stop: function(ev, ui) {
        var handleIndex = ui.handleIndex; //handle number, starting with 0 from bottom
        var catchesIndex = Math.floor(handleIndex / 2) * 2; //index in catches array
        var value = ui.value;
        var newValue = ui.value;

        //check if too high or too low
        if (!(handleIndex % 2)) { //if catch handle
          if (value > catchTimes[catchesIndex].end - dwellLimit) { //if greater than corresponding throw handle
            $('#leftSlider').slider('values', handleIndex, catchTimes[catchesIndex].end - dwellLimit); //set catch handle to throw val - dwellLimit
            newValue = catchTimes[catchesIndex].end - dwellLimit;
          }
          else if (catchesIndex > 0 && value < catchTimes[catchesIndex - 1].end + throwLimit) { //value > 0 so catchTimes doesn't try negative index
            $('#leftSlider').slider('values', handleIndex, catchTimes[catchesIndex - 1].end + throwLimit); //set catch handle to throw val + throwLimit
            newValue = catchTimes[catchesIndex - 1].end + throwLimit;
          }
        }
        else { //if throw handle
          if (catchesIndex < catchTimes.length - 1 && value > catchTimes[catchesIndex + 1].start - throwLimit) { //value < max so catchTimes doesn't access undefined index
            $('#leftSlider').slider('values', handleIndex, catchTimes[catchesIndex + 1].start - throwLimit); //set throw handle to catch val - throwlimit
            newValue = catchTimes[catchesIndex + 1].start - throwLimit;
          }
          else if (value < catchTimes[catchesIndex].start + dwellLimit) { //if less than corresponding catch handle
            $('#leftSlider').slider('values', handleIndex, catchTimes[catchesIndex].start + dwellLimit); //set throw handle to catch val + dwellLimit
            newValue = catchTimes[catchesIndex].start + dwellLimit
          }
        }

        //store new value in catchTimes
        if (handleIndex % 2) {
          catchTimes[catchesIndex].end = newValue;
        }
        else {
          catchTimes[catchesIndex].start = newValue;
        }

        console.log(catchTimes);

        //get rid of slider text
        $('#leftSlider').find('.ui-slider-handle').text((''));
      }
    });

    $('#rightSlider').slider({
      orientation: 'vertical',
      step: 0.05,
      min: 0,
      max: catchTimes[catchTimes.length - 1].start + 1 - throwLimit,
      values: rightNodes.map(a => a.start).concat(rightNodes.map(a => a.end)).sort(),

      slide: function(ev, ui) {
        //show slider value when sliding
        $('#rightSlider').find('.ui-state-active')
          .text($('#rightSlider').slider('values', ui.handleIndex));
        //TO-DO: append element so text isn't on handle
      },

      //restrict handle range
      stop: function(ev, ui) {
        var handleIndex = ui.handleIndex; //handle number, starting with 0 from bottom
        var catchesIndex = Math.floor(handleIndex / 2) * 2 + 1; //index in catches array
        var value = ui.value;
        var newValue = ui.value;

        //check if too high or too low
        if (!(handleIndex % 2)) { //if catch handle
          if (value > catchTimes[catchesIndex].end - dwellLimit) { //if greater than corresponding throw handle
            $('#rightSlider').slider('values', handleIndex, catchTimes[catchesIndex].end - dwellLimit); //set catch handle to throw val - dwellLimit
            newValue = catchTimes[catchesIndex].end - dwellLimit;
          }
          else if (catchesIndex > 0 && value < catchTimes[catchesIndex - 1].end + throwLimit) { //value > 0 so catchTimes doesn't try negative index
            $('#rightSlider').slider('values', handleIndex, catchTimes[catchesIndex - 1].end + throwLimit); //set catch handle to throw val + throwLimit
            newValue = catchTimes[catchesIndex - 1].end + throwLimit;
          }
        }
        else { //if throw handle
          if (catchesIndex < catchTimes.length - 1 && value > catchTimes[catchesIndex + 1].start - throwLimit) { //value < max so catchTimes doesn't access undefined index
            $('#rightSlider').slider('values', handleIndex, catchTimes[catchesIndex + 1].start - throwLimit); //set throw handle to catch val - throwlimit
            newValue = catchTimes[catchesIndex + 1].start - throwLimit;
          }
          else if (value < catchTimes[catchesIndex].start + dwellLimit) { //if less than corresponding catch handle
            $('#rightSlider').slider('values', handleIndex, catchTimes[catchesIndex].start + dwellLimit); //set throw handle to catch val + dwellLimit
            newValue = catchTimes[catchesIndex].start + dwellLimit
          }
        }

        //save new value in catchTimes
        if (handleIndex % 2) {
          catchTimes[catchesIndex].end = newValue;
        }
        else {
          catchTimes[catchesIndex].start = newValue;
        }

        console.log(catchTimes);

        //get rid of slider text
        $('#rightSlider').find('.ui-slider-handle').text((''));
      }
    });
  };

  //redraw canvas
  var drawLines = function(lines, slider) {

  }

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

    $('#siteswapForm').submit(resetLadder);
    $('#resetLadder').click(resetLadder);
});
