(function() {
  
  function LocalDb() {
    this.puzzles = decodePuzzles();
    this.currentPuzzle = localStorage.getItem('current_puzzle');
  }
  
  LocalDb.listen = function(handler) {
    if (window.addEventListener) {
      window.addEventListener("storage", handler, false);
    } else {
      window.attachEvent("onstorage", handler);
    }
  };
  
  LocalDb.unlisten = function(handler) {
    if (window.removeEventListener) {
      window.removeEventListener("storage", handler);
    } else {
      window.detachEvent("onstorage", handler);
    }
  };
  
  LocalDb.prototype.findPuzzle = function(id) {
    for (var i = 0; i <= this.puzzles.length; ++i) {
      if (this.puzzles[i].id === id) {
        return this.puzzles[i];
      }
    }
    return null;
  };
  
  LocalDb.prototype.save = function() {
    localStorage.setItem('puzzles', JSON.stringify(this.puzzles));
    if (this.currentPuzzle !== null) {
      localStorage.setItem('current_puzzle', this.currentPuzzle);
    }
  };
  
  function decodePuzzles() {
    var puzzleData = localStorage.getItem('puzzles');
    if (puzzleData === null) {
      return [];
    }
    var packed = JSON.parse(puzzleData);
    var puzzles = [];
    for (var i = 0, len = packed.length; i < len; ++i) {
      puzzles[i] = window.app.Puzzle.unpack(packed[i]);
    }
    return puzzles;
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.LocalDb = LocalDb;
  
})();