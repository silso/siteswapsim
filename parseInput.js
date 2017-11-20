window.onload = function() {
  var onsubmit = document.getElementById('siteswapForm');
  onsubmit.onsubmit = function(e) {
    e.preventDefault();
    parseInput();
  }

  function parseInput() {
    var input = document.getElementById('siteswapInput');
    var site = new Siteswap(String(input.value));
    console.log(site.isValid());
    console.log(site.printArray());
    console.log(site.printSite());
    console.log(site.printLoops());
    console.log(site.printLoopTime());
  }
}
