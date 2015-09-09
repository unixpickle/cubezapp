(function() {

  var BUFFER_SIZE = 100;

  // LazySolves fetches solves from the newest solve to older solves, polling
  // for more on demand. It handles errors, data changes, etc.
  //
  // Users of LazySolves should note that it inverts the indices from the store.
  // Index 0 in LazySolves is the user's latest solve, not their first ever
  // solve.
  //
  // This may emit the following events:
  // - clear: all the solves are gone and new ones are being fetched.
  // - error: solves could not be fetched.
  // - more: more solves have been loaded.
  // - add: a new solve has been added to the beginning of the list.
  // - delete(index): a solve was deleted from the given index.
  // - modify(index): the solve at the given index was modified.
  function LazySolves() {
    window.app.EventEmitter.call(this);
    this._cursors = [];
    this._loadTicket = null;

    // this._lastLength is updated whenever the collective length of the cursors
    // changes. This is necessary to tell whether or not a solve was deleted
    // from one of our cursors in a particular edge case.
    this._lastLength = 0;

    this._registerModelEvents();
  }

  LazySolves.prototype = Object.create(window.app.EventEmitter.prototype);

  // canLoadMore returns true if the store has some solves which are not loaded.
  LazySolves.prototype.canLoadMore = function() {
    return this.getLength() < window.app.store.getSolveCount();
  };

  // getLength returns the total number of solves which have been loaded.
  LazySolves.prototype.getLength = function() {
    if (this._cursors.length === 0) {
      return 0;
    }
    var firstIndex = this._cursors[this._cursors.length - 1].getStartIndex();
    return window.app.store.getSolveCount() - firstIndex;
  };

  // getSolve gets a solve at the given index. The indexes start from newest
  // solve to oldest, unlike the indexes in the store.
  LazySolves.prototype.getSolve = function(inverseIndex) {
    var info = this.getSolveAddress();
    return info.cursor.getSolve(info.index);
  };

  // getSolveAddress returns an object with enough information to access and
  // edit solve within the store. The object has a 'cursor' property and an
  // 'index' property. The 'index' property is the index of this solve within
  // the given cursor.
  LazySolves.prototype.getSolveAddress = function(inverseIndex) {
    var index = window.app.store.getSolveCount() - (inverseIndex + 1);
    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (index >= cursor.getStartIndex() &&
          index < cursor.getStartIndex()+cursor.getLength) {
        return {cursor: cursor, index: index - cursor.getStartIndex()};
      }
    }
    throw new Error('solve index out of bounds: ' + inverseIndex);
  };

  // loadMore requests more solves to be loaded. If data is already loading,
  // this will do nothing.
  LazySolves.prototype.loadMore = function() {
    if (this._loadTicket !== null || !this.canLoadMore()) {
      return;
    }

    var start, end;
    if (this._cursors.length === 0) {
      var end = window.app.store.getSolveCount();
      var start = Math.max(end-BUFFER_SIZE, 0);
    } else {
      var end = this._cursors[this._cursors.length - 1].getStartIndex();
      var start = Math.max(end-BUFFER_SIZE, 0);
    }

    this._loadTicket = window.app.store.getSolves(start, end-start,
      this._getSolvesCallback.bind(this));
  };

  LazySolves.prototype._getSolvesCallback = function(err, cursor) {
    this._loadTicket = null;

    if (err) {
      this.emit('error', err);
      return;
    }

    this._cursors.push(cursor);
    this._updateLastLength();
    this.emit('more');
  };

  LazySolves.prototype._handleAddedSolve = function() {
    if (this._cursors.length === 0) {
      // NOTE: if the initial data was still loading, it could have been asking
      // for indices that are now invalid.
      this._invalidate();
    } else {
      this._updateLastLength();
      this.emit('add');
    }
  };

  LazySolves.prototype._handleDeletedSolve = function(id, index) {
    if (this._cursors.length === 0) {
      // NOTE: if the initial data was still loading, it could have been asking
      // for indices that are now invalid.
      this._invalidate();
      return;
    }

    var lastLength = this._lastLength;
    this._updateLastLength();
    var lastStoreCount = window.app.store.getSolveCount()+1;
    var lastStartIndex = lastStoreCount - lastLength;
    if (index < lastStartIndex) {
      return;
    }

    var oldIndex = lastStoreCount - (index+1);
    this.emit('delete', oldIndex);
  };

  LazySolves.prototype._handleModifiedSolve = function(id, attrs, index) {
    if (this._cursors.length !== 0 &&
        index >= this._cursors[this._cursors.length-1].getStartIndex()) {
      this.emit('modify', window.app.store.getSolveCount()-(index+1));
    }
  };

  LazySolves.prototype._invalidate = function() {
    for (var i = 0, len = this._cursors.length; i < len; ++i) {
      var cursor = this._cursors[i];
      if (cursor.valid()) {
        cursor.close();
      }
    }
    this._cursors = [];
    this._updateLastLength();
    if (this._loadTicket) {
      this._loadTicket.cancel();
      this._loadTicket = null;
    }
    this.loadMore();
    this.emit('clear');
  };

  LazySolves.prototype._registerModelEvents = function() {
    var invalidateEvents = ['addedPuzzle', 'remoteChange', 'switchedPuzzle'];
    for (var i = 0, len = invalidateEvents.length; i < len; ++i) {
      var event = invalidateEvents[i];
      window.app.store.on(event, this._invalidate.bind(this));
    }
    window.app.store.on('addedSolve', this._handleAddedSolve.bind(this));
    window.app.store.on('deletedSolve', this._handleDeletedSolve.bind(this));
    window.app.store.on('modifiedSolve', this._handleModifiedSolve.bind(this));
  };

  LazySolves.prototype._updateLastLength = function() {
    this._lastLength = this.getLength();
  };

})();
