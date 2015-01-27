(function() {
  
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
    this._session.solves.push(solve);
    this._save();
  };
  
  LocalDb.prototype.changePuzzle = function(settings) {
    if (this._puzzle === null) {
      throw new Error('Cannot change puzzle without a current puzzle.');
    }
    for (var key in settings) {
      if (!settings.hasOwnProperty(key)) {
        continue;
      }
      this._puzzle[key] = settings[key];
    }
  };
  
  LocalDb.prototype.deleteSession = function(id) {
    if (this._puzzle === null) {
      throw new Error('Cannot delete a session without a current puzzle.');
    }
    var idx = this._puzzle.sessionIds.indexOf(id);
    if (idx === this._puzzle.sessionIds.length-1) {
      throw new Error('Cannot delete the current session.');
    }
    localStorage.removeItem('session_' + id);
    this._puzzle.sessionIds.splice(idx, 1);
    this._save();
  };
  
  LocalDb.prototype.deleteSolve = function(index) {
    if (this._session === null) {
      throw new Error('Cannot delete a solve without a current session.');
    }
    if (index < 0 || index >= this._session.solves.length) {
      throw new Error('Solve index out of bounds');
    }
    this._session.solves.splice(index, 1);
    this._save();
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
    var res = [];
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      res[i] = this._puzzles[i].puzzle;
    }
    return res;
  };
  
  LocalDb.prototype.newSession = function(keepLast) {
    if (this._puzzle === null || this._session === null) {
      throw new Error('Cannot create a new session: no current session.');
    }
    if (!keepLast) {
      localStorage.removeItem('session_' + this._session.id);
      this._puzzle.sessionIds.splice(this._puzzle.sessionIds.length-1, 1);
    }
    this._session = {solves: [], id: window.app.generateId()};
    this._puzzle.sessionIds.push(this._session.id);
    this._save();
  };
  
  LocalDb.prototype.switchPuzzle = function(id, callback) {
    this._puzzle = this._findPuzzle(id);
    if (this._puzzle === null) {
      throw new Error('The puzzle does not exist.');
    }
    if (this._puzzle.sessionIds.length === 0) {
      throw new Error('No sessions in current puzzle.');
    }
    var sessionId = this._puzzle.sessionIds[this._puzzle.sessionIds.length - 1]
    this._session = this._findSession(sessionId);
    setTimeout(function() {
      callback(null);
    }, 10);
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
    this._puzzle = this._findPuzzle(activeId);
    if (this._puzzle === null) {
      throw new Error('The active puzzle does not exist.');
    }
    if (this._puzzle.sessionIds.length === 0) {
      throw new Error('No sessions in current puzzle.');
    }
    var sessionId = this._puzzle.sessionIds[this._puzzle.sessionIds.length - 1]
    this._session = this._findSession(sessionId);
  };
  
  LocalDb.prototype._reload = function() {
    this._load();
    if ('function' === typeof this.onSessionChanged) {
      this.onSessionChanged();
    }
    if ('function' === typeof this.onPuzzlesChanged) {
      this.onPuzzlesChanged();
    }
  };
  
  LocalDb.prototype._save = function() {
    localStorage.setItem('puzzles', JSON.stringify(this._puzzles));
    if (this._puzzle !== null) {
      localStorage.setItem('activePuzzle', this._puzzle.id)
      localStorage.setItem('session_' + this._session.id,
        JSON.stringify(this._session));
    }
  };
  
  function loadPuzzles() {
    var puzzlesData = localStorage.getItem('puzzles');
    if (!puzzlesData) {
      puzzlesData = "[]";
    }
    return JSON.parse(puzzlesData);
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.LocalDb = LocalDb;
  
})();