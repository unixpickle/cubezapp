(function() {
  
  function Context() {
    this._session = null;
    this._puzzle = null;
    this._handlers = [];
    this._db = new window.app.LocalDb();
    
    // Make sure that the database isn't empty.
    if (this._db.puzzles.length === 0) {
      addDefaultPuzzles(this._db);
      this._db.save();
    }
    
    // Update the current puzzle and session.
    this._puzzle = this._db.currentPuzzle;
    var sessions = this.currentPuzzle().sessions;
    this._session = sessions[sessions.length - 1].id;
        
    window.app.LocalDb.listen(this._dbChanged.bind(this));
  }
  
  Context.prototype.addListener = function(f) {
    this._handlers.push(f);
  };
  
  Context.prototype.changePuzzle = function(p) {
    var puzzle = this._db.findPuzzle(p.id);
    if (puzzle === null) {
      throw new Error('Changed to a non-existent puzzle.');
    }
    
    this._db.currentPuzzle = puzzle.id;
    this._db.save();
    
    this._puzzle = puzzle.id;
    this._session = puzzle.sessions[puzzle.sessions.length - 1].id;
    console.log('current session', this.currentSession());
  };
  
  Context.prototype.currentPuzzle = function() {
    var res = this._db.findPuzzle(this._puzzle);
    if (res === null) {
      throw new Error('No current puzzle.');
    }
    return res;
  };
  
  Context.prototype.currentSession = function() {
    var puzzle = this.currentPuzzle();
    var res = puzzle.findSession(this._session);
    if (res === null) {
      throw new Error('No current session.');
    }
    return res;
  };
  
  Context.prototype.puzzles = function() {
    return this._db.puzzles;
  };
  
  Context.prototype.removeListener = function(f) {
    var idx = this._handlers.indexOf(f);
    if (idx >= 0) {
      this._handlers.splice(idx, 1);
    }
  };
  
  Context.prototype.save = function() {
    this._db.save();
  };
  
  Context.prototype._dbChanged = function() {
    // Make sure the current session is intact in the new session.
    var newDb = new window.app.LocalDb();
    var curPuzzle = newDb.findPuzzle(this._puzzle);
    if (curPuzzle === null) {
      // The current puzzle was deleted, so we add it
      newDb.puzzles.splice(0, 0, this.currentPuzzle());
      newDb.save();
    } else {
      // Make sure the current session is in the puzzle.
      if (curPuzzle.findSession(this._session) === null) {
        curPuzzle.sessions.push(this.currentSession());
        newDb.save();
      }
    }
    
    this._db = newDb;
    for (var i = 0, len = this._handlers.length; i < len; ++i) {
      this._handlers[i]();
    }
  };
  
  function addDefaultPuzzles(db) {
    // Create 3x3x3
    var puzzle = window.app.Puzzle.generate();
    puzzle.sessions.push(new window.app.Session());
    db.puzzles.push(puzzle);
    
    // Create 2x2x2
    puzzle = window.app.Puzzle.generate();
    puzzle.settings.name = "2x2x2";
    puzzle.sessions.push(new window.app.Session());
    db.puzzles.push(puzzle);
    
    for (var i = 4; i < 15; ++i) {
      puzzle = window.app.Puzzle.generate();
      puzzle.settings.name = i + 'x' + i + 'x' + i;
      puzzle.sessions.push(new window.app.Session());
      db.puzzles.push(puzzle);
    }
    
    db.currentPuzzle = db.puzzles[0].id;
  }
  
  // window.app must be created by now, since LocalDb must be imported before
  // this file.
  window.app.context = new Context();
  
})();
