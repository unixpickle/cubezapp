(function() {
  
  // window.app must be created by now, since LocalDb must be imported before
  // this file.
  window.app.store = new window.app.LocalDb();
  
  // Create some default puzzles...
  if (window.app.store.getActivePuzzle() === null) {
    var addPuzzles = [7, 6, 5, 4, 2, 3];
    for (var i = 0, len = addPuzzles.length; i < len; ++i) {
      var x = addPuzzles[i];
      var puzzleName = x + 'x' + x + 'x' + x;
      var puzzle = {name: puzzleName, icon: puzzleName, theme: 'blueberry'};
      if (puzzleName === '3x3x3') {
        // Right now I only have move-based scrambles.
        puzzle.scrambler = '3x3x3';
        puzzle.scrambleType = 'Moves';
        puzzle.scrambleLength = 25;
      } else if (puzzleName === '2x2x2') {
        // 2x2x2 state scrambles.
        puzzle.scrambler = '2x2x2';
        puzzle.scrambleType = 'State';
        puzzle.scrambleLength = -1;
      } else {
        // Currently I have not implemented big-cube scrambles.
        puzzle.scrambler = 'None';
        puzzle.scrambleType = '';
        puzzle.scrambleLength = -1;
      }
      window.app.store.addPuzzle(puzzle);
    }
  }
  
})();
