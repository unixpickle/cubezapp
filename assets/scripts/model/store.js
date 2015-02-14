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
      var puzzle = {name: puzzleName, icon: puzzleName, scrambler: '3x3x3',
        scrambleType: 'moves', scrambleLength: 25, theme: 'blueberry'};
      window.app.store.addPuzzle(puzzle);
    }
  }
  
})();
