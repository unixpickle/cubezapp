(function() {
  
  // window.app must be created by now, since LocalDb must be imported before
  // this file.
  window.app.store = new window.app.LocalDb();
  
  // Create some default puzzles...
  if (window.app.store.getActivePuzzle() === null) {
    for (var i = 2; i < 8; ++i) {
      var puzzleName = i + 'x' + i + 'x' + i;
      var puzzle = {name: puzzleName, icon: '3x3x3'};
      window.app.store.addPuzzle(puzzle);
    }
    // Make the 3x3x3 the default puzzle.
    var puzzles = window.app.store.getPuzzles();
    var rubiksCube = puzzles[puzzles.length - 2];
    window.app.store.switchPuzzle(rubiksCube.id);
  }
  
})();
