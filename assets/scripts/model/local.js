(function() {
  
  var DEFAULT_SETTINGS = {
    flavor: 'Blueberry',
    righty: true
  };
  
  function LocalStore() {
    window.app.EventEmitter.call(this);
    
    this._active = null;
    this._puzzles = null;
    this._globalSettings = null;
    
    // Register change events.
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
    var oldActive = this._active.id;
    this._loadData();
    
    // Find the old active puzzle by its id.
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === oldActive) {
        this._active = this._puzzles[i];
        break;
      }
    }
    
    this.emit('remoteChange');
  };
  
  LocalStore.prototype._generateDefault = function() {
    this._puzzles = [];
    this._globalSettings = DEFAULT_SETTINGS;
    
    // Add cubes.
    var cubes = ['3x3 Cube', '4x4 Cube', '5x5 Cube', '2x2 Cube', 'One Handed'];
    var scramblers = [
      ['3x3x3', 'Moves', 25], ['None', 'None', 0], ['None', 'None', 0],
      ['2x2x2', 'State', 0], ['3x3x3', 'Moves', 25]
    ];
    var icons = ['3x3x3', '4x4x4', '5x5x5', '2x2x2', 'OH'];
    for (var i = cubes.length-1; i >= 0; --i) {
      // Size and name.
      var name = cubes[i];
      var scrambler = scramblers[i];
      var icon = icons[i];
      
      var puzzle = {
        name: name,
        icon: icon,
        scrambler: scrambler[0],
        scrambleType: scrambler[1],
        scrambleLength: scrambler[2],
        lastUsed: new Date().getTime(),
      };
      this.addPuzzle(puzzle);
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
    
    // Load the puzzle data.
    var data = JSON.parse(localStorage.localStoreData);
    this._puzzles = data.puzzles;
    this._globalSettings = data.globalSettings || DEFAULT_SETTINGS;
    
    // Find the active puzzle.
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === data.active) {
        this._active = this._puzzles[i];
      }
    }
  };
  
  LocalStore.prototype._loadLegacy = function() {
    var puzzles = JSON.parse(localStorage.puzzles);
    var active = localStorage.activePuzzle;
    
    // Add the "lastUsed" field to each puzzle.
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      puzzles[i].lastUsed = new Date().getTime();
    }
    
    var newData = {
      puzzles: puzzles,
      active: active,
      globalSettings: DEFAULT_SETTINGS
    };
    
    // If they are in some kind of private browsing mode, this may fail.
    try {
      localStorage.localStoreData = JSON.stringify(newData);
    } catch (e) {
    }
    
    this._puzzles = puzzles;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].id === active) {
        this._active = puzzles[i];
      }
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
      localStorage.localStoreData = JSON.stringify(data);
    } catch (e) {
    }
  };
  
  window.app.LocalStore = LocalStore;
  
})();