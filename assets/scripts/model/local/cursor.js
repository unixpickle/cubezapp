(function() {

  // A LocalCursor implements the cursor interface for LocalSolves.
  function LocalCursor(localSolves, start, length) {
    this._valid = true;
    this._solves = localSolves;
    this._start = start;
    this._length = length;
    localSolves.cursorCreated(this);
  }

  // close invalidates this cursor and allows the store to delete any caches
  // associated with it.
  LocalCursor.prototype.close = function() {
    if (this._valid) {
      this._valid = false;
      this._solves.cursorClosed(this);
    }
  };

  // deleteSolve deletes the solve at a given index, relative to the cursor's
  // start index.
  LocalCursor.prototype.deleteSolve = function(index) {
    this._assertValid();
    this._assertInRange(index);
    this._solves.deleteSolve(index + this._start);
  };

  // findSolveById takes a solve ID and returns the index (relative to this
  // cursor) of the corresponding solve. If the solve ID does not exist in this
  // cursor, this returns -1.
  LocalCursor.prototype.findSolveById = function(id) {
    this._assertValid();
    for (var i = 0, len = this.getLength(); i < len; ++i) {
      if (this.getSolve(i).id === id) {
        return i;
      }
    }
    return -1;
  };

  // getLength returns the number of solves included in this cursor.
  LocalCursor.prototype.getLength = function() {
    this._assertValid();
    return this._length;
  };

  // getSolve gets a solve within this cursor. The supplied index is relative to
  // the cursor's start index.
  LocalCursor.prototype.getSolve = function(index) {
    this._assertValid();
    this._assertInRange(index);
    return this._solves.getSolves()[index + this._start];
  };

  // getStartIndex returns the index of the first solve included in this cursor.
  LocalCursor.prototype.getStartIndex = function() {
    this._assertValid();
    return this._start;
  };

  // modifySolve modifies the solve at a given index. The first argument is the
  // solve index (relative to the cursor). The second is a dictionary of
  // attributes to change.
  LocalCursor.prototype.modifySolve = function(index, attrs) {
    this._assertValid();
    this._assertInRange(index);
    this._solves.modifySolve(index+this._start, attrs);
  };

  // moveSolve moves the solve at a given index (relative to this cursor) to a
  // different puzzle in the store.
  LocalCursor.prototype.moveSolve = function(index, puzzleId) {
    this._assertValid();
    this._assertInRange(index);
    this._solves.moveSolve(index+this._start, puzzleId);
  };

  // valid returns true if the cursor is still usable.
  LocalCursor.prototype.valid = function() {
    return this._valid;
  };

  // _assertInRange makes sure a specified index is within this cursor.
  LocalCursor.prototype._assertInRange = function(index) {
    if (index < 0 || index >= this._length) {
      throw new Error('index out of bounds: ' + index);
    }
  };

  // _assertValid makes sure that this LocalCursor is valid.
  LocalCursor.prototype._assertValid = function() {
    if (!this._valid) {
      throw new Error('this LocalCursor is invalid.');
    }
  };

  window.app.LocalCursor = LocalCursor;

})();
