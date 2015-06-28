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
    graphHistogramScale: 100,
    graphHistogramSpan: 100,
    graphHistogramPrecision: 1000,
    graphHistogramIncludeDNF: false,
    graphStreakScale: 20,
    graphStreakUsePercent: true,
    graphStreakUpperBound: 20000,
    graphStreakIncludeDNF: true
  };

  function LocalStore() {
    window.app.EventEmitter.call(this);

    this._active = null;
    this._puzzles = null;
    this._globalSettings = null;
    this._stats = null;
    this._averages = null;

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
    this._recomputeStatsFromScratch();
    this._save();
    this.emit('addedPuzzle', puzzle);
  };

  LocalStore.prototype.addSolve = function(solve) {
    solve.id = window.app.generateId();
    this._active.solves.push(solve);

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

  LocalStore.prototype.deleteSolve = function(id) {
    var solves = this._active.solves;
    for (var i = solves.length-1; i >= 0; --i) {
      if (solves[i].id === id) {
        solves.splice(i, 1);
        recomputeLastPBsAndPWs(solves, i);
        this._recomputeStatsFromScratch();
        this._save();
        this.emit('deletedSolve', id);
        return;
      }
    }
    throw new Error('solve not found: ' + id);
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
    var list = this._active.solves.slice(start, start+count);
    return new window.app.DataTicket(cb, list);
  };

  LocalStore.prototype.getStats = function() {
    return this._stats;
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

  LocalStore.prototype.modifySolve = function(id, attrs) {
    var solve = null;
    var solveIndex;
    var solves = this._active.solves;
    for (solveIndex = solves.length-1; solveIndex >= 0; --solveIndex) {
      if (solves[solveIndex].id === id) {
        solve = solves[solveIndex];
        break;
      }
    }
    if (solve === null) {
      throw new Error('solve not found: ' + id);
    }
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      solve[key] = attrs[key];
    }
    recomputeLastPBsAndPWs(solves, solveIndex+1);
    this._recomputeStatsFromScratch();
    this._save();
    this.emit('modifiedSolve', id, attrs);
  };

  LocalStore.prototype.switchPuzzle = function(id, cb) {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      if (puzzle.id === id) {
        this._active = puzzle;
        this._puzzles.splice(i, 1);
        this._puzzles.unshift(this._active);
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

    this.emit('remoteChange');
    this._recomputeStatsFromScratch();
  };

  // _fillInMissingPuzzleFields makes it easier to add new puzzle fields in the
  // future.
  LocalStore.prototype._fillInMissingPuzzleFields = function() {
    DEFAULT_PUZZLE_SETTINGS.lastUsed = new Date().getTime();

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
        timerInput: 0,
        lastUsed: new Date().getTime()
      });
    }

    this._save();
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
    this._fillInMissingPuzzleFields();
    this._fillInMissingSolveFields();

    this._globalSettings = (data.globalSettings || {});
    this._fillInMissingSettings();

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

    this._fillInMissingPuzzleFields();
    this._fillInMissingSolveFields();

    this._globalSettings = {};
    this._fillInMissingSettings();

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

  LocalStore.prototype._save = function() {
    this._active.lastUsed = new Date().getTime();
    var data = {
      puzzles: this._puzzles,
      active: this._active.id,
      globalSettings: this._globalSettings
    };
    // If they are in some kind of private browsing mode, this may fail.
    try {
      var data = JSON.stringify(data);
      localStorage.localStoreData = data;
      this._lastLocalStoreData = data;
    } catch (e) {
    }
  };

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
