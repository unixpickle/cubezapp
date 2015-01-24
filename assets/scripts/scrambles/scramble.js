(function() {
  
  window.app.scramble = function(puzzle, mode) {
    var moves = window.puzzlejs.rubik.scrambleMoves(25);
    return window.puzzlejs.rubik.movesToString(moves);
  };
  
})();
