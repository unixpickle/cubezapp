(function() {
  
  var BUFFER_SIZE = 200;
  
  function SolveBuffer() {
    this._count = 0;
    this._loadingMore = false;
    this._ticket = 0;
    this._reloading = false;
    this._solves = [];
    this.onMoreError = null;
    this.onMoreLoaded = null;
    this.onReload = null;
    this.onReloadError = null;
  }
  
  SolveBuffer.prototype.add = function(solve) {
    this._solves.splice(0, 0, solve);
    ++this._count;
  };
  
  SolveBuffer.prototype.cancel = function() {
    if (this._loadingMore || this._reloading) {
      ++this._ticket;
      this._loadingMore = false;
      this._reloading = false;
    }
  };
  
  SolveBuffer.prototype.deleteSolve = function(id) {
    for (var i = 0, len = this._solves.length; i < len; ++i) {
      if (this._solves[i].id === id) {
        this._solves.splice(i, 1);
        --this._count;
        return i;
      }
    }
    return -1;
  };
  
  SolveBuffer.prototype.getCount = function() {
    return this._count;
  };
  
  SolveBuffer.prototype.getSolves = function() {
    return this._solves;
  };
  
  SolveBuffer.prototype.reload = function() {
    if (this._reloading) {
      return;
    } else if (this._loadingMore) {
      this._ticket++;
      this._loadingMore = false;
    }
    this._reloading = true;
    var ticket = ++this._ticket;
    window.app.store.getSolveCount(function(err, count) {
      if (this._ticket !== ticket) {
        return;
      }
      if (err !== null) {
        this._reloading = false;
        this._callReloadError(err);
        return;
      }
      var len = Math.min(count, BUFFER_SIZE);
      if (len > BUFFER_SIZE) {
        len = BUFFER_SIZE
      }
      window.app.store.getSolves(0, len, function(err, solves) {
        if (this._ticket !== ticket) {
          return;
        }
        this._reloading = false;
        if (err !== null) {
          this._callReloadError(err);
          return;
        }
        this._count = count;
        this._solves = solves;
        if ('function' === typeof this.onReload) {
          this.onReload();
        }
      }.bind(this));
    }.bind(this));
  };
  
  SolveBuffer.prototype.requestMore = function() {
    if (this._reloading || this._loadingMore) {
      return;
    }
    
    // Compute the number of solves to get and the start index.
    var len = this._count - this._solves.length;
    if (len === 0) {
      return;
    }
    if (len > BUFFER_SIZE) {
      len = BUFFER_SIZE;
    }
    var start = this._solves.length;
    
    // Setup the state
    this._loadingMore = true;
    var ticket = ++this._ticket;
    
    // Request the data
    window.app.store.getSolves(start, len, function(err, solves) {
      if (ticket !== this._ticket) {
        return;
      }
      this._loadingMore = false;
      if (err !== null) {
        if ('function' === typeof this.onMoreError) {
          this.onMoreError(err);
        }
        return;
      }
      for (var i = 0, len = solves.length; i < len; ++i) {
        this._solves.push(solves[i]);
      }
      if ('function' === typeof this.onMoreLoaded) {
        this.onMoreLoaded(solves.length);
      }
    }.bind(this));
  };
  
  SolveBuffer.prototype._callReloadError = function(err) {
    if ('function' === typeof this.onReloadError) {
      this.onReloadError(err);
    }
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.SolveBuffer = SolveBuffer;
  
})();