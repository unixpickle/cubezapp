(function() {
  
  /**
   * LocalDb uses the localStorage to store sessions, puzzles, times, etc.
   *
   * It allows for cross-tab and cross-window communication in real time.
   */
  function LocalDb() {
    // Create hidden class.
    this._active = null;
    this._puzzles = null;
    this.onPuzzleChanged = null;
    this.onPuzzlesChanged = null;
    this.onStatsComputed = null;
    this.onStatsLoading = null;
    this.onTimesChanged = null;
    this._listenFunc = this._reload.bind(this);
    
    // Register change events.
    if (window.addEventListener) {
      window.addEventListener("storage", this._listenFunc, false);
    } else {
      window.attachEvent("onstorage", this._listenFunc);
    }
    
    // Load the data.
    this._load();
  }
  
  LocalDb.prototype.addPuzzle = function(info, cb) {
    // Generate the ID and empty solves list.
    info.id = window.app.generateId();
    info.solves = [];
    
    // Add the puzzle to the front of the list and make it the current puzzle
    // and session.
    this._puzzles.splice(0, 0, info);
    this._active = info;
    this._save();
    
    if ('function' === typeof cb) {
      asyncCall(function() {
        cb(null);
      });
    }
  };
  
  LocalDb.prototype.addSolve = function(solve) {
    if (this._active === null) {
      throw new Error('Cannot add a solve without an active puzzle.');
    }
    solve.id = window.app.generateId();
    this._active.solves.push(solve);
    this._save();
  };
  
  LocalDb.prototype.changePuzzle = function(settings) {
    if (this._active === null) {
      throw new Error('Cannot use changePuzzle with no active puzzle.');
    }
    
    // Apply each setting.
    for (var key in settings) {
      if (!settings.hasOwnProperty(key)) {
        continue;
      }
      this._active[key] = settings[key];
    }
  };
  
  LocalDb.prototype.changeSolve = function(id, props) {
    if (this._active === null) {
      throw new Error('Cannot change a solve without an active puzzle.');
    }
    
    // Find the solve by ID, then apply each key to it.
    for (var i = this._active.solves.length-1; i >= 0; --i) {
      var solve = this._active.solves[i];
      if (this._active.solves[i].id === id) {
        // Set each key.
        for (var key in props) {
          if (!props.hasOwnProperty(key)) {
            continue;
          }
          solve[key] = props[key];
        }
        this._save();
        return;
      }
    }
  };
  
  LocalDb.prototype.deleteSolve = function(id) {
    if (this._active === null) {
      throw new Error('Cannot delete a solve without an active puzzle.');
    }
    for (var i = this._puzzle.solves.length-1; i >= 0; --i) {
      if (this._puzzle.solves[i].id === id) {
        this._puzzle.solves.splice(i, 1);
        this._save();
        return;
      }
    }
  };
  
  LocalDb.prototype.detach = function() {
    // Register change events.
    if (window.removeEventListener) {
      window.removeEventListener("storage", this._listenFunc, false);
    } else {
      window.detachEvent("onstorage", this._listenFunc);
    }
  };
  
  LocalDb.prototype.getActivePuzzle = function() {
    return this._active;
  };
  
  LocalDb.prototype.getPuzzles = function() {
    return this._puzzles;
  };
  
  LocalDb.prototype.getSolveCount = function(cb) {
    if ('function' !== typeof cb) {
      return;
    }
    if (this._active === null) {
      asyncCall(function() {
        cb(new Error('No active puzzle.'), null);
      });
      return;
    }
    var count = this._active.solves.length;
    asyncCall(function() {
      cb(null, count);
    });
  }
  
  LocalDb.prototype.getSolves = function(start, count, cb) {
    if ('function' !== typeof cb) {
      return;
    }
    if (this._active === null) {
      asyncCall(function() {
        cb(new Error('No active puzzle.'), null);
      });
      return;
    }
    var result = this._active.solves.slice(start, start+count);
    asyncCall(function() {
      cb(null, result);
    });
  };
  
  LocalDb.prototype.switchPuzzle = function(id, callback) {
    // Validate the puzzle we're switching to.
    this._active = this._findPuzzle(id);
    if (this._active === null) {
      throw new Error('The puzzle does not exist.');
    }
    
    // Move the new puzzle to the front of the list and save the list.
    var idx = this._puzzles.indexOf(this._active);
    this._puzzles.splice(idx, 1);
    this._puzzles.splice(0, 0, this._active);
    this._save();
    
    // Run the callback on a later iteration of the event loop.
    if ('function' === typeof callback) {
      asyncCall(function() {
        callback(null);
      });
    }
  };
  
  LocalDb.prototype._findPuzzle = function(id) {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === id) {
        return this._puzzles[i];
      }
    }
    return null;
  };
  
  LocalDb.prototype._load = function() {
    this._puzzles = loadPuzzles();
    
    // Get the active puzzle if possible.
    var activeId = localStorage.getItem('activePuzzle');
    if (!activeId) {
      return;
    }
    this._active = this._findPuzzle(activeId);
    if (this._active === null) {
      throw new Error('The active puzzle does not exist.');
    }
  };
  
  LocalDb.prototype._reload = function() {
    // Reload literally everything, includinng the current puzzle and session.
    this._load();
    if ('function' === typeof this.onSolvesChanged) {
      this.onSolvesChanged();
    }
    if ('function' === typeof this.onPuzzleChanged) {
      this.onPuzzleChanged();
    }
    if ('function' === typeof this.onPuzzlesChanged) {
      this.onPuzzlesChanged();
    }
  };
  
  LocalDb.prototype._save = function() {
    // Save all the puzzles.
    localStorage.setItem('puzzles', JSON.stringify(this._puzzles));
    
    // Save the active puzzle.
    if (this._active !== null) {
      localStorage.setItem('activePuzzle', this._active.id);
    }
  };
  
  function asyncCall(cb) {
    setTimeout(cb, 10);
  }
  
  function loadPuzzles() {
    var puzzlesData = localStorage.getItem('puzzles');
    if (!puzzlesData) {
      return [];
    }
    return JSON.parse(puzzlesData);
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.LocalDb = LocalDb;
  
})();