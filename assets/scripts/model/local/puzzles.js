(function() {

  var DEFAULT_TIMER_ACCURACY = 0;

  // DEFAULT_PUZZLE_SETTINGS provides reasonable defaults for many of the fields
  // on a Puzzle object.
  var DEFAULT_PUZZLE_SETTINGS = {
    scrambler: 'None',
    scrambleType: 'None',
    lastUsed: new Date().getTime(),
    timerInput: 0,
    graphMode: 0,
    graphStandardType: 0,
    graphStandardScale: 20,
    graphStandardShowDNF: true,
    graphMeanScale: 20,
    graphMeanCount: 10,
    graphMeanShowDNF: false,
    graphHistogramScale: 20,
    graphHistogramSpan: 100,
    graphHistogramPrecision: 0.5,
    graphHistogramIncludeDNF: false,
    graphStreakScale: 20,
    graphStreakUsePercent: true,
    graphStreakUpperBound: 20000,
    graphStreakIncludeDNF: false
  };

  // LocalPuzzles manages the puzzles which the user has configured offline.
  function LocalPuzzles() {
    this._active = null;
    this._puzzles = null;
    this._defaultTimerAccuracy = DEFAULT_TIMER_ACCURACY;
  }

  // addPuzzle adds a puzzle with the specified attributes. Missing attributes
  // will be filled in. The puzzle will be made the active puzzle.
  LocalPuzzles.prototype.addPuzzle = function(puzzle) {
    puzzle.id = window.app.generateId();
    this._puzzles.unshift(puzzle);
    this._active = puzzle;
    this._fillInMissingFieldsForPuzzle(puzzle);
  };

  // deletePuzzle delets a puzzle given a puzzle ID. This does not allow the
  // deletion of the active puzzle.
  LocalPuzzles.prototype.deletePuzzle = function(id) {
    var puzzle = this.findById(id);
    if (!puzzle) {
      throw new Error('cannot delete puzzle because it was not found: ' + id);
    } else if (puzzle === this._active) {
      throw new Error('cannot delete puzzle because it is active: ' + id);
    }
    var index = this._puzzles.indexOf(puzzle);
    this._puzzles.splice(index, 1);
  };

  // findById finds a puzzle given its ID, or returns null if the puzzle cannot
  // be found.
  LocalPuzzles.prototype.findById = function(id) {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === id) {
        return this._puzzles[i];
      }
    }
    return null;
  };

  // getActivePuzzle returns the active puzzle.
  LocalPuzzles.prototype.getActivePuzzle = function() {
    return this._active;
  };

  // getInactivePuzzles returns the puzzle list, excluding the current puzzle.
  LocalPuzzles.prototype.getInactivePuzzles = function() {
    var res = [];
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      if (puzzle !== this._active) {
        res.push(puzzle);
      }
    }
    return res;
  };

  // getPuzzles returns the list of puzzles, including the active puzzle.
  // Nothing is guaranteed about the ordering of this list. For instance, the
  // active puzzle is not necessarily the first puzzle in the list.
  LocalPuzzles.prototype.getPuzzles = function() {
    return this._puzzles;
  };

  // loadPuzzles provides LocalPuzzles with a list of puzzles from the store and
  // directs it to process them.
  // The activeId argument determines the latest puzzle the user switched to. If
  // this is not the first time puzzles were loaded, the activeId argument may
  // not affect the active puzzle.
  LocalPuzzles.prototype.loadPuzzles = function(puzzles, activeId) {
    this._puzzles = puzzles;
    if (this._active === null) {
      this._active = this.findById(activeId);
    } else {
      this._active = this.findById(this._active.id) ||
        this.findById(activeId);
    }
    if (this._active === null) {
      throw new Error('could not find active puzzle: ' + activeId);
    }
    this._fillInMissingFields();
  };

  // modifyAllPuzzles sets a set of attributes on every puzzle.
  LocalPuzzles.prototype.modifyAllPuzzles = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      for (var j = 0, len1 = keys.length; j < len1; ++j) {
        var key = keys[j];
        puzzle[key] = attrs[key];
      }
    }
  };

  // modifyPuzzle sets a set of attributes on the active puzzle.
  LocalPuzzles.prototype.modifyPuzzle = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      this._active[key] = attrs[key];
    }
  };

  // setDefaultTimerAccuracy sets the default timerAccuracy field for new
  // puzzles and puzzles missing the field.
  // This is not a key in DEFAULT_PUZZLE_SETTINGS because the user can change
  // the default manually.
  LocalPuzzles.prototype.setDefaultTimerAccuracy = function(accuracy) {
    this._defaultTimerAccuracy = accuracy;
  };

  // switchPuzzle switches the active puzzle using a specified ID.
  LocalPuzzles.prototype.switchPuzzle = function(id) {
    var puzzle = this.findById(id);
    if (puzzle === null) {
      throw new Error("cannot switch puzzles because the ID doesn't exist: " +
        id);
    }
    this._active = puzzle;

    // On puzzle switch, the active puzzle gets moved to the front of the list.
    // This helps to place the user's favorite puzzles near the beginning of the
    // list.
    var index = this._puzzles.indexOf(puzzle);
    this._puzzles.splice(index, 1);
    this._puzzles.unshift(this._active);
  };

  // _fillInMissingFields fills in the missing fields for every puzzle.
  LocalPuzzles.prototype._fillInMissingFields = function() {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      this._fillInMissingFieldsForPuzzle(this._puzzles[i]);
    }
  };

  // _fillInMissingFieldsForPuzzle sets any missing fields to their default
  // values on a Puzzle object. This makes it possible to add new puzzle fields
  // in updates of the application.
  LocalPuzzles.prototype._fillInMissingFieldsForPuzzle = function(puzzle) {
    DEFAULT_PUZZLE_SETTINGS.lastUsed = new Date().getTime();
    DEFAULT_PUZZLE_SETTINGS.timerAccuracy = this._defaultTimerAccuracy;
    var keys = Object.keys(DEFAULT_PUZZLE_SETTINGS);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      if (!puzzle.hasOwnProperty(key)) {
        puzzle[key] = DEFAULT_PUZZLE_SETTINGS[key];
      }
    }
  };

})();
