(function() {

  var DEFAULT_SETTINGS = {
    flavor: 'Blueberry',
    righty: true,
    timerAccuracy: 0,
    theaterMode: true
  };

  function LocalStore() {
    window.app.EventEmitter.call(this);

    this._active = null;
    this._puzzles = null;
    this._globalSettings = null;

    this._lastLocalStoreData = null;
    this._changeListener = this._dataChanged.bind(this);
    if (window.addEventListener) {
      window.addEventListener('storage', this._changeListener, false);
    } else {
      window.attachEvent('onstorage', this._changeListener);
    }

    this._loadData();
  }

  LocalStore.prototype = Object.create(window.app.EventEmitter.prototype);

  LocalStore.prototype.addPuzzle = function(puzzle) {
    puzzle.id = window.app.generateId();
    if ('undefined' === typeof puzzle.solves) {
      puzzle.solves = [];
    }
    this._puzzles.unshift(puzzle);
    this._active = puzzle;
    this._save();
    this.emit('addedPuzzle', puzzle);
  };

  LocalStore.prototype.addSolve = function(solve) {
    solve.id = window.app.generateId();
    this._active.solves.push(solve);
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

  LocalStore.prototype.getPuzzles = function() {
    return this._puzzles;
  };

  LocalStore.prototype.getSolveCount = function(cb) {
    return new window.app.DataTicket(cb, this.getActivePuzzle)
  };

  LocalStore.prototype.getSolves = function(start, count, cb) {
    var list = this._active.solves.slice(start, start+count);
    return new window.app.DataTicket(cb, list);
  };

  LocalStore.prototype.modifyGlobalSettings = function(attrs) {
    for (var key in attrs) {
      if (!attrs.hasOwnProperty(key)) {
        continue;
      }
      this._globalSettings[key] = attrs[key];
    }
    this._save();
    this.emit('modifiedGlobalSettings', attrs);
  };

  LocalStore.prototype.modifyPuzzle = function(attrs) {
    for (var key in attrs) {
      if (!attrs.hasOwnProperty(key)) {
        continue;
      }
      this._active[key] = attrs[key];
    }
    this._save();
    this.emit('modifiedPuzzle', attrs);
  };

  LocalStore.prototype.modifySolve = function(id, attrs) {
    var solves = this._active.solves;
    var solve = null;
    for (var i = solves.length-1; i >= 0; --i) {
      if (solves[i].id === id) {
        solve = solves[i];
        break;
      }
    }
    if (solve === null) {
      throw new Error('solve not found: ' + id);
    }
    for (var key in attrs) {
      if (!attrs.hasOwnProperty(key)) {
        solve[key] = attrs[key];
      }
    }
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
        this._save();
        this.emit('switchedPuzzle');
        return new window.app.DataTicket(cb, null);
      }
    }
    var err = new Error('puzzle not found: ' + id);
    this.emit('switchPuzzleError', err);
    return new window.app.ErrorTicket(cb, err);
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

  // _fillInMissingPuzzleFields makes it easier to add new puzzle fields in the
  // future.
  LocalStore.prototype._fillInMissingPuzzleFields = function() {
    var defaults = {
      scrambler: 'None',
      scrambleType: 'None',
      lastUsed: new Date().getTime(),
      timerInput: 0
    };
    var keys = Object.keys(defaults);
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      var puzzle = this._puzzles[i];
      for (var j = 0, len1 = keys.length; j < len1; ++j) {
        var key = keys[j]
        if (!puzzle.hasOwnProperty(key)) {
          puzzle[key] = defaults[key];
        }
      }
      if (!puzzle.hasOwnProperty('solves')) {
        puzzle.solves = [];
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
    this._fillInMissingPuzzleFields();

    this._globalSettings = {};
    this._fillInMissingSettings();

    var active = localStorage.activePuzzle;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].id === active) {
        this._active = puzzles[i];
      }
    }

    this._save();
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

  window.app.LocalStore = LocalStore;

})();
