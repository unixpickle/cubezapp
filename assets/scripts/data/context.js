(function() {
  
  function Context() {
    this._currentSession = null;
    this.onchange = null;
    this.db = new window.app.LocalDb();
    this.db.onchange = this._onchange.bind(this);
    if (this.db.currentPuzzle !== null) {
      var sessions = this.db.currentPuzzle.sessions;
      if (sessions.length > 0) {
        this._currentSession = sessions[sessions.length - 1].id;
      }
    }
  }
  
  Context.prototype.currentPuzzle = function() {
    return this.db.findPuzzle(this.db.currentPuzzle);
  };
  
  Context.prototype.currentSession = function() {
    var puzzle = this.currentPuzzle();
    if (puzzle === null) {
      return null;
    }
    return puzzle.findSession(this.currentSession);
  };
  
  Context.prototype._onchange = function() {
    if (!this.onchange) {
      this.onchange();
    }
  };
  
  window.app.context = new Context();
  
})();
