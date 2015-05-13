(function() {

  function Times() {
    this._$element = $('#times');
    this._idToRow = {};

    this._registerModelEvents();
    this._dataInvalidated();
  }

  Times.prototype.layout = function(width) {
    // TODO: actually do something here.
    this._$element.css({width: width || 150});
  };

  Times.prototype.width = function() {
    return this._$element.width();
  };

  Times.prototype._addRowForSolve = function(solve) {
    // TODO: add a row here.
  };

  Times.prototype._dataInvalidated = function() {
    // TODO: reload everything here.
  };

  Times.prototype._deleteRowForSolve = function(id) {
    // TODO: delete a row here.
  };

  Times.prototype._registerModelEvents = function() {
    var invalidateHandler = this._dataInvalidated.bind(this);
    var invalidateEvents = ['addedPuzzle', 'remoteChange', 'switchedPuzzle'];
    for (var i = 0; i < invalidateEvents.length; ++i) {
      window.app.store.on(invalidateEvents[i], invalidateHandler);
    }
    window.app.store.on('deletedSolve', this._deleteRowForSolve.bind(this));
    window.app.store.on('modifiedSolve', this._updateRowForSolve.bind(this));
    window.app.store.on('addedSolve', this._addRowForSolve.bind(this));
  };

  Times.prototype._updateRowForSolve = function(id) {
    // TODO: update a row here.
  };

  window.app.Times = Times;

})();
