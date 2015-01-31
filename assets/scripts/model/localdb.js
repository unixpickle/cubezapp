(function() {
  
  /**
   * LocalDb uses the localStorage to store sessions, puzzles, times, etc.
   *
   * It allows for cross-tab and cross-window communication in real time.
   */
  function LocalDb() {
    // Create hidden class.
    this._puzzle = null;
    this._session = null;
    this._puzzles = null;
    this.onSessionChanged = null;
    this.onPuzzlesChanged = null;
    this.onStatsComputed = null;
    this.onStatsLoading = null;
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
  
  LocalDb.prototype.addPuzzle = function(info) {
    // Generate a new puzzle with a single, empty session.
    var session = {solves: [], id: window.app.generateId()};
    info.id = window.app.generateId();
    
    // The localPuzzle contains the standard puzzle info, but with the added
    // bonus of a list of session IDs. This way, we can keep a reference to
    // every session in the localStorage.
    var localPuzzle = {puzzle: info, sessionIds: [session.id]};
    
    // Add the puzzle to the front of the list and make it the current puzzle
    // and session.
    this._puzzles.splice(0, 0, localPuzzle);
    this._puzzle = localPuzzle;
    this._session = session;
    this._save();
  };
  
  LocalDb.prototype.addSolve = function(solve) {
    if (this._session === null) {
      throw new Error('Cannot add a solve without a current session.');
    }
    solve.id = window.app.generateId();
    this._session.solves.push(solve);
    // TODO: to boost performance a bit, we could probably just save the current
    // session rather than calling this._save().
    this._save();
  };
  
  LocalDb.prototype.changePuzzle = function(settings) {
    if (this.getActivePuzzle() === null) {
      throw new Error('Cannot use changePuzzle with no active puzzle.');
    }
    
    // Apply each setting.
    for (var key in settings) {
      if (!settings.hasOwnProperty(key)) {
        continue;
      }
      this.getActivePuzzle()[key] = settings[key];
    }
  };
  
  LocalDb.prototype.changeSolve = function(id, solve) {
    if (this._session === null) {
      throw new Error('Cannot change a solve without a current session.');
    }
    // Find the session.
    for (var i = this._session.length-1; i >= 0; --i) {
      if (this._sessions[i].id === id) {
        // Set each key.
        for (var key in solve) {
          if (!solve.hasOwnProperty(key)) {
            continue;
          }
          this._sessions[i][key] = solve[key];
        }
        this._save();
        return;
      }
    }
  };
  
  LocalDb.prototype.deleteSession = function(id) {
    if (this._puzzle === null) {
      throw new Error('Cannot delete a session without a current puzzle.');
    }
    var idx = this._puzzle.sessionIds.indexOf(id);
    if (idx < 0) {
      throw new Error('Cannot delete the session because it does not exist.');
    }
    if (idx === this._puzzle.sessionIds.length-1) {
      throw new Error('Cannot delete the current session.');
    }
    // Delete the session both from localStorage and from the puzzle's list of
    // session ids. We remove it from localStorage after calling _save() to
    // avoid a race condition.
    this._puzzle.sessionIds.splice(idx, 1);
    this._save();
    localStorage.removeItem('session_' + id);
  };
  
  LocalDb.prototype.deleteSolve = function(id) {
    if (this._session === null) {
      throw new Error('Cannot delete a solve without a current session.');
    }
    for (var i = this._session.solves.length-1; i >= 0; --i) {
      if (this._session.solves[i].id === id) {
        this._session.solves.splice(i, 1);
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
    if (this._puzzle === null) {
      return null;
    }
    return this._puzzle.puzzle;
  };
  
  LocalDb.prototype.getActiveSession = function() {
    return this._session;
  };
  
  LocalDb.prototype.getPuzzles = function() {
    // this._puzzles is an array of "local" puzzles which have an additional
    // "sessionIds" field. Thus, we need to get the canonical puzzle objects out
    // of each of these local puzzles.
    var res = [];
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      res[i] = this._puzzles[i].puzzle;
    }
    return res;
  };
  
  LocalDb.prototype.newSession = function(keepLast, callback) {
    if (this._puzzle === null || this._session === null) {
      throw new Error('Cannot create a new session: no current session.');
    }
    
    // Optionally delete the current session.
    var removeId = this._session.id;
    if (!keepLast) {
      // Delete the ID from this list. We delete the "session_" value after
      // saving the puzzle to avoid a race condition where other tabs see the
      // session ID in the puzzle but can't load it from the store.
      var lastIdx = this._puzzle.sessionIds.length - 1;
      this._puzzle.sessionIds.splice(lastIdx, 1);
    }
    
    // Create a new session and add it to the puzzle.
    this._session = {solves: [], id: window.app.generateId()};
    this._puzzle.sessionIds.push(this._session.id);
    this._save();
    
    if (!keepLast) {
      localStorage.removeItem('session_' + removeId);
    }
    
    setTimeout(function() {
      callback(null);
    }, 10);
  };
  
  LocalDb.prototype.switchPuzzle = function(id, callback) {
    // Validate the puzzle we're switching to.
    this._puzzle = this._findPuzzle(id);
    if (this._puzzle === null) {
      throw new Error('The puzzle does not exist.');
    }
    if (this._puzzle.sessionIds.length === 0) {
      throw new Error('No sessions in current puzzle.');
    }
    
    // Move the new puzzle to the front of the list.
    var idx = this._puzzles.indexOf(this._puzzle);
    this._puzzles.splice(idx, 1);
    this._puzzles.splice(0, 0, this._puzzle);
    
    // Switch to the latest session.
    var lastIdx = this._puzzle.sessionIds.length - 1;
    var sessionId = this._puzzle.sessionIds[lastIdx];
    this._session = this._findSession(sessionId);
    this._save();
    
    // Run the callback on a later iteration of the event loop.
    if ('function' === typeof callback) {
      setTimeout(function() {
        callback(null);
      }, 10);
    }
  };
  
  LocalDb.prototype._findPuzzle = function(id) {
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].puzzle.id === id) {
        return this._puzzles[i];
      }
    }
    return null;
  };
  
  LocalDb.prototype._findSession = function(id) {
    return JSON.parse(localStorage.getItem('session_' + id));
  };
  
  LocalDb.prototype._load = function() {
    this._puzzles = loadPuzzles();
    
    // Get the active puzzle if possible.
    var activeId = localStorage.getItem('activePuzzle');
    if (!activeId) {
      return;
    }
    this._puzzle = this._findPuzzle(activeId);
    if (this._puzzle === null) {
      throw new Error('The active puzzle does not exist.');
    }
    if (this._puzzle.sessionIds.length === 0) {
      throw new Error('No sessions in current puzzle.');
    }
    // Get the active session
    var lastIdx = this._puzzle.sessionIds.length - 1;
    var sessionId = this._puzzle.sessionIds[lastIdx];
    this._session = this._findSession(sessionId);
  };
  
  LocalDb.prototype._reload = function() {
    // Reload literally everything, includinng the current puzzle and session.
    this._load();
    if ('function' === typeof this.onSessionChanged) {
      this.onSessionChanged();
    }
    if ('function' === typeof this.onPuzzlesChanged) {
      this.onPuzzlesChanged();
    }
  };
  
  LocalDb.prototype._save = function() {
    // Save the current session first to avoid race conditions with other tabs.
    if (this._puzzle !== null) {
      localStorage.setItem('session_' + this._session.id,
        JSON.stringify(this._session));
    }
    
    // Save all the puzzles.
    localStorage.setItem('puzzles', JSON.stringify(this._puzzles));
    
    // Save the current puzzle.
    if (this._puzzle !== null) {
      localStorage.setItem('activePuzzle', this._puzzle.puzzle.id)
      
    }
  };
  
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