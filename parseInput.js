'use strict';

$(document).ready(function() {
  var onsubmit = document.getElementById('siteswapForm');
  onsubmit.onsubmit = function(e) {
    e.preventDefault();
    parseInput();
  }

  var site;
  function parseInput() {
    var input = document.getElementById('siteswapInput');
    site = new Siteswap(String(input.value));
    console.log(site.isValid());
    console.log(site.printArray());
    console.log(site.printSite());
    console.log(site.printLoops());
    console.log(site.printLoopTime());
  }

  var dwellTime = 0.1;
  var dwellLimit = 0.1;
  var throwLimit = 0.1;
  var defaultLadder;
  var catchTimes = [0, 1];
  var Catch = function(start, end) {
    this.start = start;
    this.end = end;
  }


  var resetLadder = function() {
    defaultLadder = site.printLadderInfo(1);

    var catchTimes = [new Catch(0, 0)];
    for (var i = 1; i < defaultLadder.endTime; i++) {
      catchTimes.push(new Catch(defaultLadder.throws[i].start - dwellTime, defaultLadder.throws[i].start));
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
    console.log(catchTimes);
    $('#leftSlider').slider('destroy');
    $('#leftSlider').slider({
      orientation: 'vertical',
      step: 0.1,
      min: 0,
      max: catchTimes[catchTimes.length - 1].end,
      values: leftNodes.map(a => a.start).concat(leftNodes.map(a => a.end)).sort(),

      stop: function(ev, ui) {
        var curIndex = ui.handleIndex;
        console.log(ui.value);
        console.log(catchTimes[curIndex + 1].end);
        if (curIndex % 2) {
          if (ui.value > catchTimes[curIndex + 1].start) {
            $('#leftSlider').slider('values', curIndex, catchTimes[curIndex + 1].start - dwellLimit);
          }
        }
        else {
          if (ui.value > catchTimes[curIndex].end && catchTimes[curIndex].end - dwellLimit > 0) {
            $('#leftSlider').slider('values', curIndex, catchTimes[curIndex].end - dwellLimit);
          }
          else if (catchTimes[curIndex].end - dwellLimit <= 0) {
            $('#leftSlider').slider('values', curIndex, 0);
          }
        }

        if (ui.handleIndex % 2) {
          catchTimes[ui.handleIndex].end = ui.value;
        }
        else {
          catchTimes[ui.handleIndex].start = ui.value;
        }

        console.log(catchTimes);
      }
    });
    $('#rightSlider').slider('destroy');
    $('#rightSlider').slider({
      orientation: 'vertical',
      step: 0.1,
      min: 0,
      max: catchTimes[catchTimes.length - 1].end,
      values: rightNodes.map(a => a.start).concat(rightNodes.map(a => a.end)).sort()
    });
  };

  $('#siteswapForm').submit(resetLadder);

  $('#resetLadder').click(resetLadder);

  $('#leftSlider').slider({
    orientation: 'vertical'
  });

  $('#rightSlider').slider({
    orientation: 'vertical',
  });

});
