(function() {

  var DEFAULT_SETTINGS = {
    flavor: 'Blueberry',
    righty: true,
    timerAccuracy: 0,
    theaterMode: true
  };

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

  function LocalStore() {
    window.app.EventEmitter.call(this);

    this._active = null;
    this._puzzles = null;
    this._globalSettings = null;
    this._stats = null;
    this._averages = null;

    this._cursors = [];

    this._lastLocalStoreData = null;
    this._changeListener = this._dataChanged.bind(this);
    if (window.addEventListener) {
      window.addEventListener('storage', this._changeListener, false);
    } else {
      window.attachEvent('onstorage', this._changeListener);
    }

    this._loadData();
    this._computeStats();
  }

  LocalStore.prototype = Object.create(window.app.EventEmitter.prototype);

  LocalStore.prototype.addPuzzle = function(puzzle) {
    puzzle.id = window.app.generateId();
    this._puzzles.unshift(puzzle);
    this._active = puzzle;
    this._fillInMissingPuzzleFields();
    this._invalidateAllCursors();
    this._recomputeStatsFromScratch();
    this._save();
    this.emit('addedPuzzle', puzzle);
  };

  LocalStore.prototype.addSolve = function(solve) {
    solve.id = window.app.generateId();
    this._active.solves.push(solve);

    // All the cursors at the end of the data get the extra solve.
    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (cursor._startIndex+cursor._length === this._active.solves.length-1) {
        ++cursor._length;
      }
    }

    recomputeLastPBsAndPWs(this._active.solves, this._active.solves.length-1);
    if (this._averages) {
      this._averages.pushSolve(solve);
    }
    this._recomputeStats();
    this._save();
    this.emit('addedSolve', solve);
  };

  LocalStore.prototype.deletePuzzle = function(id) {
    if (id === this._active.id) {
      throw new Error('deleting current puzzle: ' + id);
    }
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === id) {
        this._puzzles.splice(i, 1);
        this._save();
        this.emit('deletedPuzzle', id);
        return;
      }
    }
    throw new Error('puzzle not found: ' + id);
  };

  LocalStore.prototype.detach = function() {
    if (window.removeEventListener) {
      window.removeEventListener('storage', this._changeListener, false);
    } else {
      window.detachEvent('onstorage', this._changeListener);
    }
  };

  LocalStore.prototype.getActivePuzzle = function() {
    return this._active;
  };

  LocalStore.prototype.getGlobalSettings = function() {
    return this._globalSettings;
  };

  LocalStore.prototype.getInactivePuzzles = function() {
    var res = [];
    var puzzles = this._puzzles;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      if (puzzle.id !== this._active.id) {
        res.push(puzzle);
      }
    }
    return res;
  };

  LocalStore.prototype.getLatestSolve = function() {
    if (this._active.solves.length === 0) {
      return null;
    }
    return this._active.solves[this._active.solves.length - 1];
  };

  LocalStore.prototype.getPuzzles = function() {
    return this._puzzles;
  };

  LocalStore.prototype.getSolveCount = function(cb) {
    return this._active.solves.length;
  };

  LocalStore.prototype.getSolves = function(start, count, cb) {
    if (start < 0 || start+count >= this._active.solves.length) {
      return new window.app.ErrorTicket(cb, new Error('out of bounds'));
    }
    return new CursorTicket(cb, this, start, count);
  };

  LocalStore.prototype.getStats = function() {
    return this._stats;
  };

  LocalStore.prototype.modifyAllPuzzles = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      for (var j = 0, len1 = keys.length; j < len1; ++j) {
        var key = keys[j];
        puzzle[key] = attrs[key];
      }
    }
    this._save();
    this.emit('modifiedPuzzle', attrs);
  };

  LocalStore.prototype.modifyGlobalSettings = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      this._globalSettings[key] = attrs[key];
    }
    this._save();
    this.emit('modifiedGlobalSettings', attrs);
  };

  LocalStore.prototype.modifyPuzzle = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      this._active[key] = attrs[key];
    }
    this._save();
    this.emit('modifiedPuzzle', attrs);
  };

  LocalStore.prototype.switchPuzzle = function(id, cb) {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      if (puzzle.id === id) {
        this._active = puzzle;
        this._puzzles.splice(i, 1);
        this._puzzles.unshift(this._active);
        this._invalidateAllCursors();
        this._recomputeStatsFromScratch();
        this._save();
        this.emit('switchedPuzzle');
        return new window.app.DataTicket(cb, null);
      }
    }
    var err = new Error('puzzle not found: ' + id);
    this.emit('switchPuzzleError', err);
    return new window.app.ErrorTicket(cb, err);
  };

  LocalStore.prototype._computeStats = function() {
    this._averages = new window.app.OfflineAverages();
    var solves = this._active.solves;
    for (var i = 0, len = solves.length; i < len; ++i) {
      this._averages.pushSolve(solves[i]);
    }
    this._stats = this._averages.stats();
  };

  LocalStore.prototype._dataChanged = function() {
    // The change might be unrelated to the store.
    if (localStorage.localStoreData === this._lastLocalStoreData) {
      return;
    }

    var oldActive = this._active.id;
    this._loadData();

    // We should not change the active puzzle unless we have no choice.
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === oldActive) {
        this._active = this._puzzles[i];
        break;
      }
    }

    this._invalidateAllCursors();
    this.emit('remoteChange');
    this._recomputeStatsFromScratch();
  };

  LocalStore.prototype._deleteSolveAtIndex = function(index) {
    var solves = this._active.solves;
    var id = solves[index].id;
    solves.splice(index, 1);

    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (index < cursor._startIndex) {
        --cursor._startIndex;
      } else if (index < cursor._startIndex+cursor._length) {
        --cursor._length;
      }
    }

    recomputeLastPBsAndPWs(solves, index);
    this._recomputeStatsFromScratch();
    this._save();
    this.emit('deletedSolve', id, index);
  };

  // _fillInMissingPuzzleFields makes it easier to add new puzzle fields in the
  // future.
  LocalStore.prototype._fillInMissingPuzzleFields = function() {
    DEFAULT_PUZZLE_SETTINGS.lastUsed = new Date().getTime();
    DEFAULT_PUZZLE_SETTINGS.timerAccuracy = this._globalSettings.timerAccuracy;

    var keys = Object.keys(DEFAULT_PUZZLE_SETTINGS);
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      for (var j = 0, len1 = keys.length; j < len1; ++j) {
        var key = keys[j]
        if (!puzzle.hasOwnProperty(key)) {
          puzzle[key] = DEFAULT_PUZZLE_SETTINGS[key];
        }
      }
      if (!puzzle.hasOwnProperty('solves')) {
        puzzle.solves = [];
      }
    }
  };

  // _fillInMissingSettings makes it easier to add new global settings in the
  // future.
  LocalStore.prototype._fillInMissingSettings = function() {
    var keys = Object.keys(DEFAULT_SETTINGS);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      if (!this._globalSettings.hasOwnProperty(key)) {
        this._globalSettings[key] = DEFAULT_SETTINGS[key];
      }
    }
  };

  // _fillInMissingSolveFields makes it easier to add new solve fields in the
  // future.
  LocalStore.prototype._fillInMissingSolveFields = function() {
    var puzzles = this._puzzles;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      var solves = puzzle.solves;
      recomputeLastPBsAndPWs(solves, 0);
      for (var j = 0, len1 = solves.length; j < len1; ++j) {
        var solve = solves[j];
        if (!solve.scrambler) {
          solve.scrambler = puzzle.scrambler;
          solve.scrambleType = puzzle.scrambleType;
        }
      }
    }
  };

  LocalStore.prototype._generateDefault = function() {
    this._puzzles = [];

    this._globalSettings = {};
    this._fillInMissingSettings();

    var names = ['3x3 Cube', '4x4 Cube', '5x5 Cube', '2x2 Cube', 'One Handed'];
    var scramblers = [
      ['3x3x3', 'State'], ['None', 'None'], ['None', 'None'],
      ['2x2x2', 'State'], ['3x3x3', 'State']
    ];
    var icons = ['3x3x3', '4x4x4', '5x5x5', '2x2x2', 'OH'];
    for (var i = names.length-1; i >= 0; --i) {
      var scrambler = scramblers[i];
      this.addPuzzle({
        name: names[i],
        icon: icons[i],
        scrambler: scrambler[0],
        scrambleType: scrambler[1],
        timerAccuracy: 0,
        timerInput: 0,
        lastUsed: new Date().getTime()
      });
    }

    this._save();
  };

  LocalStore.prototype._invalidateAllCursors = function() {
    var cursors = this._cursors;
    this._cursors = [];
    for (var i = 0, len = cursors.length; i < len; ++i) {
      cursors[i]._invalidate();
    }
  };

  LocalStore.prototype._loadData = function() {
    if ('undefined' === typeof localStorage.localStoreData) {
      // Load the legacy local data if available, or create new data otherwise.
      if ('undefined' !== typeof localStorage.puzzles) {
        this._loadLegacy();
      } else {
        this._generateDefault();
      }
      return;
    }

    this._lastLocalStoreData = localStorage.localStoreData;
    var data = JSON.parse(localStorage.localStoreData);

    this._puzzles = data.puzzles;

    // NOTE: we must get the global settings before the puzzle settings because
    // some global settings may act as defaults for corresponding puzzle
    // settings.
    this._globalSettings = (data.globalSettings || {});
    this._fillInMissingSettings();

    this._fillInMissingPuzzleFields();
    this._fillInMissingSolveFields();

    // Find the active puzzle.
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === data.active) {
        this._active = this._puzzles[i];
      }
    }
  };

  LocalStore.prototype._loadLegacy = function() {
    this._puzzles = JSON.parse(localStorage.puzzles);

    // All of the solves in the old Cubezapp were in the opposite order.
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var solves = this._puzzles[i].solves;
      var revSolves = [];
      for (var j = 0, len1 = solves.length; j < len1; ++j) {
        revSolves[j] = solves[len1 - (j + 1)];
      }
      this._puzzles[i].solves = revSolves;
    }

    // NOTE: we must do this before filling in puzzle fields. See _loadData for
    // more.
    this._globalSettings = {};
    this._fillInMissingSettings();

    this._fillInMissingPuzzleFields();
    this._fillInMissingSolveFields();

    var active = localStorage.activePuzzle;
    var puzzles = this._puzzles;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].id === active) {
        this._active = puzzles[i];
        break;
      }
    }
    if (this._active === null) {
      this._active = puzzles[0];
    }

    this._save();
  };

  LocalStore.prototype._modifySolveAtIndex = function(index, attrs) {
    var solve = this._active.solves[index];
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      solve[key] = attrs[key];
    }
    recomputeLastPBsAndPWs(solves, index+1);
    this._recomputeStatsFromScratch();
    this._save();
    this.emit('modifiedSolve', id, attrs, index);
  };

  LocalStore.prototype._moveSolveAtIndex = function(index, puzzleId) {
    var puzzle = null;
    for (var i = 1, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === puzzleId) {
        puzzle = this._puzzles[i];
        break;
      }
    }
    if (puzzle === null) {
      return;
    }
    var solve = this._active.solves[index];
    insertSolveUsingTimestamp(solve, puzzle.solves);
    this._deleteSolveAtIndex(index);
    this.emit('movedSolve', solve.id, puzzleId);
  };

  LocalStore.prototype._recomputeStats = function() {
    this._stats = null;
    this.emit('loadingStats');
    setTimeout(function() {
      if (this._stats === null) {
        if (this._averages === null) {
          this._averages = new window.app.OfflineAverages();
          var solves = this._active.solves;
          for (var i = 0, len = solves.length; i < len; ++i) {
            this._averages.pushSolve(solves[i]);
          }
        }
        this._stats = this._averages.stats();
        this.emit('computedStats', this._stats);
      }
    }.bind(this), 1);
  };

  LocalStore.prototype._recomputeStatsFromScratch = function() {
    this._averages = null;
    this._recomputeStats();
  };

  LocalStore.prototype._removeCursor = function(cursor) {
    var index = this._cursors.indexOf(cursor);
    if (index >= 0) {
      this._cursors.splice(index, 1);
    }
  };

  LocalStore.prototype._save = function() {
    this._active.lastUsed = new Date().getTime();
    var data = {
      puzzles: this._puzzles,
      active: this._active.id,
      globalSettings: this._globalSettings
    };
    // If they are in some kind of private browsing mode, this may fail.
    try {
      var jsonData = JSON.stringify(data);
      localStorage.localStoreData = jsonData;
      this._lastLocalStoreData = jsonData;
      localStorage.saveNotification = new Date().getTime();
    } catch (e) {
    }
  };

  // A Cursor is used to supply solves asynchronously to callbacks which want
  // them.
  function Cursor(store, startIndex, length) {
    window.app.EventEmitter.call(this);
    this._valid = true;
    this._store = store;
    this._startIndex = startIndex;
    this._length = length;
  }

  Cursor.prototype = Object.create(window.app.EventEmitter.prototype);

  // close invalidates this cursor and tells the store that it can stop caching
  // the values covered by this cursor.
  Cursor.prototype.close = function() {
    this._store._removeCursor(this);
  };

  // deleteSolve deletes the solve at a given index, relative to the cursor's
  // start index.
  Cursor.prototype.deleteSolve = function(index) {
    this._assertValid();
    this._assertInRange(index);
    this._store._deleteSolveAtIndex(index + this._startIndex);
  };

  // findSolveById takes a solve ID and returns the index (relative to this
  // cursor) of the corresponding solve. If the solve ID does not exist in this
  // cursor, this returns -1.
  Cursor.prototype.findSolveById = function(id) {
    this._assertValid();
    for (var i = 0, len = this.getLength(); i < len; ++i) {
      if (this.getSolve(i).id === id) {
        return i;
      }
    }
    return -1;
  };

  // getLength returns the number of solves included in this cursor.
  Cursor.prototype.getLength = function() {
    this._assertValid();
    return this._length;
  };

  // getSolve gets a solve within this cursor. The supplied index is relative to
  // the cursor's start index.
  Cursor.prototype.getSolve = function(index) {
    this._assertValid();
    this._assertInRange(index);
    return this._store._active.solves[index + this._startIndex];
  };

  // getStartIndex returns the index of the first solve included in this cursor.
  Cursor.prototype.getStartIndex = function() {
    this._assertValid();
    return this._startIndex;
  };

  // modifySolve modifies the solve at a given index. The first argument is the
  // solve index (relative to the cursor). The second is a dictionary of
  // attributes to change.
  Cursor.prototype.modifySolve = function(index, attrs) {
    this._assertValid();
    this._assertInRange(index);
    this._store._modifySolveAtIndex(index+this._startIndex, attrs);
  };

  // moveSolve moves the solve at a given index (relative to this cursor) to a
  // different puzzle in the store.
  Cursor.prototype.moveSolve = function(index, puzzleId) {
    this._assertValid();
    this._assertInRange(index);
    this._store._moveSolveAtIndex(index+this._startIndex, puzzleId);
  };

  // _assertInRange makes sure a specified index is within this cursor.
  Cursor.prototype._assertInRange = function(index) {
    if (index < 0 || index >= this._length) {
      throw new Error('index out of bounds: ' + index);
    }
  };
  
  // _assertValid makes sure that this Cursor is valid.
  Cursor.prototype._assertValid = function() {
    if (!this._valid) {
      throw new Error('this Cursor is invalid.');
    }
  };

  // _invalidate emits an invalidate event and renders this Cursor unusable.
  Cursor.prototype._invalidate = function() {
    this._valid = false;
    this.emit('invalidate');
  };

  // A CursorTicket is used to return a Cursor to a callback. This must be used
  // instead of a regular DataTicket so that a Cursor does not leak if the
  // ticket is cancelled.
  function CursorTicket(store, start, count) {
    window.app.Ticket.call(this, callback);
    setTimeout(function() {
      this.finish(new Cursor(store, start, count));
    }.bind(this), 10);
  }
  
  CursorTicket.prototype = Object.create(Ticket.prototype);

  function insertSolveUsingTimestamp(solve, solves) {
    // TODO: use a binary search here.
    for (var i = solves.length-1; i >= 0; --i) {
      if (solves[i].date <= solve.date) {
        solves.splice(i+1, 0, solve);
        return;
      }
    }
    solves.unshift(solve);
  }

  function recomputeLastPBsAndPWs(solves, startIndex) {
    recomputeLastPBs(solves, startIndex);
    recomputeLastPWs(solves, startIndex);
  }

  function recomputeLastPBs(solves, startIndex) {
    if (startIndex >= solves.length) {
      return;
    }

    var lastPB = -1;

    if (startIndex > 0) {
      var previousSolve = solves[startIndex - 1];
      if (previousSolve.dnf) {
        lastPB = previousSolve.lastPB;
      } else if (previousSolve.lastPB === -1) {
        lastPB = window.app.solveTime(previousSolve);
      } else {
        lastPB = Math.min(window.app.solveTime(previousSolve),
          previousSolve.lastPB);
      }
    }

    for (var i = startIndex, len = solves.length; i < len; ++i) {
      var solve = solves[i];
      solve.lastPB = lastPB;
      if (!solve.dnf) {
        if (lastPB < 0) {
          lastPB = window.app.solveTime(solve);
        } else {
          lastPB = Math.min(lastPB, window.app.solveTime(solve));
        }
      }
    }
  };

  function recomputeLastPWs(solves, startIndex) {
    if (startIndex >= solves.length) {
      return;
    }

    var lastPW = -1;

    if (startIndex > 0) {
      var previousSolve = solves[startIndex - 1];
      if (previousSolve.dnf) {
        lastPW = previousSolve.lastPW;
      } else if (previousSolve.lastPW === -1) {
        lastPW = window.app.solveTime(previousSolve);
      } else {
        lastPW = Math.max(window.app.solveTime(previousSolve),
          previousSolve.lastPW);
      }
    }

    for (var i = startIndex, len = solves.length; i < len; ++i) {
      var solve = solves[i];
      solve.lastPW = lastPW;
      if (!solve.dnf) {
        if (lastPW < 0) {
          lastPW = window.app.solveTime(solve);
        } else {
          lastPW = Math.max(lastPW, window.app.solveTime(solve));
        }
      }
    }
  };

  window.app.LocalStore = LocalStore;

})();
