(function() {
  
  function LocalDb() {
    this._handlerFunction = this._handleChange.bind(this);
    this.onchange = null;
    this.puzzles = [];
    this.currentPuzzle = null;
    this._load();
    if (window.addEventListener) {
      window.addEventListener("storage", this._handlerFunction, false);
    } else {
      window.attachEvent("onstorage", this._handlerFunction);
    }
  }
  
  LocalDb.prototype.dispose = function() {
    if (window.removeEventListener) {
      window.removeEventListener("storage", this._handlerFunction);
    } else {
      window.detachEvent("onstorage", this._handlerFunction);
    }
  };
  
  LocalDb.prototype.findPuzzle = function(puzzle, id) {
    for (var i = 0; i <= this.puzzles.length; ++i) {
      if (this.puzzles.id === id) {
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
  
  LocalDb.prototype._handleChange = function() {
    this._load();
    if (this.onchange) {
      this.onchange();
    }
  };
  
  LocalDb.prototype._load = function() {
    this.puzzles = decodePuzzles();
    this.currentPuzzle = localStorage.getItem('current_puzzle');
  };
  
  function decodePuzzles() {
    var puzzleKeys = localStorage.getItem('puzzles');
    if (puzzleKeys === null) {
      return [];
    }
    var obj = JSON.parse(puzzleKeys);
    var packed = obj.puzzles;
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