(function() {
  
  var randomizer = {random: function() {
    return Math.random()
  }};
  for (var key in window.app.scramblers) {
    if (!window.app.scramblers.hasOwnProperty(key)) {
      continue;
    }
    var scrambler = window.app.scramblers[key];
    scrambler.initialize();
    scrambler.setRandomSource(randomizer);
  }
  
  window.app.scramble = function(puzzle) {
    return window.app.scramblers[puzzle].getRandomScramble();
  };
  
})();
