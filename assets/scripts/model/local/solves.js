(function() {

  // LocalSolves manages solves which the user does offline. It uses
  // LocalPuzzles to get the solves of interest.
  //
  // The puzzles argument must be a LocalPuzzles which has already been loaded
  // with the user's current puzzles.
  //
  // This is an EventEmitter which will emit the following events:
  // - delete: either the deleteSolve or the moveSolve method was used.
  // - modify: the modifySolve method was used.
  // - move: the moveSolve method was used.
  // - loadingStats
  // - computedStats
  function LocalSolves(puzzles) {
    window.app.EventEmitter.call(this);
    this._puzzles = puzzles;
    this._stats = null;
    this._averages = null;
    this._cursors = [];
    this._fillInMissingFields();
    this._computeStats();
  }

  LocalSolves.prototype = Object.create(window.app.EventEmitter.prototype);

  // addSolve pushes a solve to the end of the list.
  LocalSolves.prototype.addSolve = function(solve) {
    var solves = this.getSolves();
    solve.id = window.app.generateId();
    solves.push(solve);

    // All the cursors at the end of the data get the extra solve.
    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (cursor._start+cursor._length === this.getSolves().length-1) {
        ++cursor._length;
      }
    }

    recomputeLastPBsAndPWs(solves, solves.length-1);
    if (this._averages !== null) {
      this._averages.pushSolve(solve);
    }
    this._emitStats();
  };

  // createCursor generates a ticket for getting a LocalCursor.
  LocalSolves.prototype.createCursor = function(start, length, cb) {
    return new window.app.LocalCursorTicket(cb, this, start, length);
  };

  // cursorClosed is called by a LocalCursor when it is closed by a consumer.
  LocalSolves.prototype.cursorClosed = function(cursor) {
    var idx = this._cursors.indexOf(cursor);
    if (idx < 0) {
      throw new Error('cursor was not registered');
    }
    this._cursors.splice(idx, 1);
  };

  // cursorCreated is called by each cursor to register itself with the
  // LocalSolves.
  LocalSolves.prototype.cursorCreated = function(cursor) {
    this._cursors.push(cursor);
  };

  // deleteSolve deletes a solve at a given index.
  LocalSolves.prototype.deleteSolve = function(index) {
    var solves = this.getSolves();
    var id = solves[index].id;
    solves.splice(index, 1);

    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (index < cursor._start) {
        --cursor._start;
      } else if (index < cursor._start+cursor._length) {
        --cursor._length;
      }
    }

    recomputeLastPBsAndPWs(solves, index);
    this._resetStats();
    this.emit('delete', id, index);
  };

  // getLatestSolve returns the latest solve or null if no solves exist.
  LocalSolves.prototype.getLatestSolve = function() {
    var solves = this.getSolves();
    if (solves.length === 0) {
      return null;
    }
    return solves[solves.length - 1];
  };

  // getSolves returns the current array of solves.
  LocalSolves.prototype.getSolves = function() {
    return this._puzzles.getActivePuzzle().solves;
  };

  // getStats returns the current stats or null if no stats are cached.
  LocalSolves.prototype.getStats = function() {
    return this._stats;
  };

  // modifySolve changes the attributes of a given solve.
  LocalSolves.prototype.modifySolve = function(index, attrs) {
    var solve = this.getSolves()[index];

    var newSolve = {};
    var allKeys = Object.keys(solve);
    for (var i = 0, len = allKeys; i < len; ++i) {
      var key = allKeys[i];
      newSolve[key] = solve[key];
    }
    this.getSolves()[index] = newSolve;

    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      newSolve[key] = attrs[key];
    }

    recomputeLastPBsAndPWs(this.getSolves(), index+1);
    this._resetStats();
    this.emit('modify', id, attrs, index);
  };

  // moveSolve moves a solve to a different puzzle.
  LocalSolves.prototype.moveSolve = function(index, puzzleId) {
    var puzzle = this._puzzles.findById(puzzleId);
    if (puzzle === null) {
      return;
    }
    var solve = this.getSolves()[index];
    this.deleteSolve(index);
    insertSolveUsingTimestamp(solve, puzzle.solves);
    this.emit('move', solve.id, puzzle);
  };

  // reset should be called whenever the solves were changed in a way that
  // cannot be easily broken down into deletions, additions and modifications.
  LocalSolves.prototype.reset = function() {
    while (this._cursors.length > 0) {
      this._cursors[this._cursors.length-1].close();
    }
    this._resetStats();
  };

  // _computeStats generates this._stats.
  LocalSolves.prototype._computeStats = function() {
    if (this._averages === null) {
      this._averages = new window.app.OfflineAverages();
      var solves = this.getSolves();
      for (var i = 0, len = solves.length; i < len; ++i) {
        this._averages.pushSolve(solves[i]);
      }
    }
    this._stats = this._averages.stats();
  };

  // _emitStats uses this._averages to emit new stats asynchronously.
  // It will create this._averages if it is null.
  LocalSolves.prototype._emitStats = function() {
    this._stats = null;
    this.emit('loadingStats');
    setTimeout(function() {
      if (this._stats === null) {
        this._computeStats();
        this.emit('computedStats', this._stats);
      }
    }.bind(this), 1);
  };

  // _fillInMissingFields fills in missing fields for all solve objects on all
  // puzzles.
  LocalSolves.prototype._fillInMissingFields = function() {
    var puzzles = this._puzzles.getPuzzles();
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

  // _resetStats deletes all pre-existing knowledge about the stats and
  // recomputes them asynchronously.
  LocalSolves.prototype._resetStats = function() {
    this._averages = null;
    this._emitStats();
  };

  function insertSolveUsingTimestamp(solve, solves) {
    // TODO: use a binary search here.
    for (var i = solves.length-1; i >= 0; --i) {
      if (solves[i].date <= solve.date) {
        solves.splice(i+1, 0, solve);
        recomputeLastPBsAndPWs(solves, i+1);
        return;
      }
    }
    solves.unshift(solve);
    recomputeLastPBsAndPWs(solves, 0);
  }

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

  window.app.LocalSolves = LocalSolves;

})();
