(function() {

  var DEFAULT_SETTINGS = {
    flavor: 'Blueberry',
    righty: true,
    timerAccuracy: 0,
    theaterMode: true
  };

  function LocalStore() {
    window.app.EventEmitter.call(this);

    this._globalSettings = null;
    this._puzzles = new window.app.LocalPuzzles();
    this._solves = null;

    this._lastLocalStoreData = null;
    this._changeListener = this._dataChanged.bind(this);
    if (window.addEventListener) {
      window.addEventListener('storage', this._changeListener, false);
    } else {
      // TODO: see if this is necessary for our list of supported browsers.
      window.attachEvent('onstorage', this._changeListener);
    }

    this._loadData();
  }

  LocalStore.prototype = Object.create(window.app.EventEmitter.prototype);

  LocalStore.prototype.addPuzzle = function(puzzle) {
    this._puzzles.addPuzzle(puzzle);
    this._solves.reset();
    this._save();
    this.emit('addedPuzzle', puzzle);
  };

  LocalStore.prototype.addSolve = function(solve) {
    this._solves.addSolve(solve);
    this._save();
    this.emit('addedSolve', solve);
  };

  LocalStore.prototype.deletePuzzle = function(id) {
    this._puzzles.deletePuzzle(id);
    this._save();
    this.emit('deletedPuzzle', id);
  };

  LocalStore.prototype.detach = function() {
    if (window.removeEventListener) {
      window.removeEventListener('storage', this._changeListener, false);
    } else {
      window.detachEvent('onstorage', this._changeListener);
    }
  };

  LocalStore.prototype.getActivePuzzle = function() {
    return this._puzzles.getActivePuzzle();
  };

  LocalStore.prototype.getGlobalSettings = function() {
    return this._globalSettings;
  };

  LocalStore.prototype.getInactivePuzzles = function() {
    return this._puzzles.getInactivePuzzles();
  };

  LocalStore.prototype.getLatestSolve = function() {
    return this._solves.getLatestSolve();
  };

  LocalStore.prototype.getPuzzles = function() {
    return this._puzzles.getPuzzles();
  };

  LocalStore.prototype.getSolveCount = function(cb) {
    return this._solves.getSolves().length;
  };

  LocalStore.prototype.getSolves = function(start, count, cb) {
    return this._solves.createCursor(start, count, cb);
  };

  LocalStore.prototype.getStats = function() {
    return this._solves.getStats();
  };

  LocalStore.prototype.modifyAllPuzzles = function(attrs) {
    this._puzzles.modifyAllPuzzles(attrs);
    this._save();
    this.emit('modifiedPuzzle', attrs);
  };

  LocalStore.prototype.modifyGlobalSettings = function(attrs) {
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      this._globalSettings[key] = attrs[key];
    }
    if ('number' === typeof attrs.timerAccuracy) {
      this._puzzles.setDefaultTimerAccuracy(this._globalSettings.timerAccuracy);
    }
    this._save();
    this.emit('modifiedGlobalSettings', attrs);
  };

  LocalStore.prototype.modifyPuzzle = function(attrs) {
    this._puzzles.modifyPuzzle(attrs);
    this._save();
    this.emit('modifiedPuzzle', attrs);
  };

  LocalStore.prototype.modifySolveById = function(id, attrs) {
    this._solves.modifySolveById(id, attrs);
  };

  LocalStore.prototype.switchPuzzle = function(id, cb) {
    this._puzzles.switchPuzzle(id);
    this._solves.reset();
    this._save();
    this.emit('switchedPuzzle');
    return new window.app.DataTicket(cb, null);
  };

  // _dataChanged is called when localStorage is changed by another tab or
  // window.
  LocalStore.prototype._dataChanged = function() {
    // NOTE: a different localStorage key might have been changed.
    // TODO: see if there is a way to tell from the event which key was changed.
    if (localStorage.localStoreData !== this._lastLocalStoreData) {
      this._loadData();
      this.emit('remoteChange');
    }
  };

  // _fillInMissingSettings sets default global settings on
  // this._globalSettings, making it easier to add new global settings in the
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

  // _generateDefault creates the default list of puzzles. This should only be
  // called before this._puzzles and this._solves have been configured.
  LocalStore.prototype._generateDefault = function() {
    if (this._solves !== null) {
      throw new Error('generateDefault called when data already exists.');
    }

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
      this._puzzles.addPuzzle({
        name: names[i],
        icon: icons[i],
        scrambler: scrambler[0],
        scrambleType: scrambler[1],
        timerAccuracy: 0,
        timerInput: 0,
        lastUsed: new Date().getTime()
      });
    }

    this._solves = new window.app.LocalSolves(this._puzzles);
    this._registerSolvesEvents();
    this._save();
  };

  // _loadData loads or reloads all of the user's data from localStorage. If the
  // data is not present in localStorage, reasonable defaults are generated.
  LocalStore.prototype._loadData = function() {
    if ('undefined' === typeof localStorage.localStoreData) {
      if ('undefined' !== typeof localStorage.puzzles) {
        this._loadLegacy();
      } else {
        this._generateDefault();
      }
      return;
    }

    this._lastLocalStoreData = localStorage.localStoreData;
    var data = JSON.parse(localStorage.localStoreData);

    this._globalSettings = (data.globalSettings || {});
    this._fillInMissingSettings();

    this._puzzles.setDefaultTimerAccuracy(this._globalSettings.timerAccuracy);
    this._puzzles.loadPuzzles(data.puzzles, data.active);

    if (this._solves !== null) {
      this._solves.reset();
    } else {
      this._solves = new window.app.LocalSolves(this._puzzles);
      this._registerSolvesEvents();
    }
  };

  // _loadLegacy loads data from very old versions of Cubezapp which stored
  // everything in a different format.
  LocalStore.prototype._loadLegacy = function() {
    var puzzles = JSON.parse(localStorage.puzzles);

    // All of the solves in the old Cubezapp were in the opposite order.
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var solves = puzzles[i].solves;
      var revSolves = [];
      for (var j = 0, len1 = solves.length; j < len1; ++j) {
        revSolves[j] = solves[len1 - (j + 1)];
      }
      puzzles[i].solves = revSolves;
    }

    this._globalSettings = {};
    this._fillInMissingSettings();

    this._puzzles.setDefaultTimerAccuracy(this._globalSettings.timerAccuracy);
    this._puzzles.loadPuzzles(puzzles, localStorage.activePuzzle);

    // NOTE: solves could be non-null even though you would expect loadLegacy to
    // only run on app launch. This is because saving the new data could fail
    // due to localStorage problems (i.e. exceeding storage capacity).
    if (this._solves !== null) {
      this._solves.reset();
    } else {
      this._solves = new window.app.LocalSolves(this._puzzles);
      this._registerSolvesEvents();
    }

    // NOTE: we save so that the data is stored in non-legacy format.
    this._save();
  };

  // _registerSolvesEvents forwards various events from this._solves to this.
  LocalStore.prototype._registerSolvesEvents = function() {
    var eventMapping = {
      'delete': 'deletedSolve',
      'modify': 'modifiedSolve',
      'modifyUnindexed': 'modifiedUnindexedSolve',
      'move': 'movedSolve',
      'loadingStats': 'loadingStats',
      'computedStats': 'computedStats'
    };
    var events = Object.keys(eventMapping);
    for (var i = 0, len = events.length; i < len; ++i) {
      var event = events[i];
      this._solves.on(event, this.emit.bind(this, eventMapping[event]));
    }
  };

  // _save writes all of the current data to localStorage. If an error occurs,
  // this will fail silently.
  LocalStore.prototype._save = function() {
    this.getActivePuzzle().lastUsed = new Date().getTime();
    var data = {
      puzzles: this.getPuzzles(),
      active: this.getActivePuzzle().id,
      globalSettings: this._globalSettings
    };
    // If they are in some kind of private browsing mode, this may fail.
    try {
      this._lastLocalStoreData = JSON.stringify(data);
      localStorage.localStoreData = this._lastLocalStoreData;
    } catch (e) {
      // TODO: create a mechanism for reporting this kind of error.
    }
  };

  window.app.LocalStore = LocalStore;

})();
