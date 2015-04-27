(function() {

  function HeaderController(view) {
    this._view = view;
    var events = ['addPuzzle', 'deletePuzzle', 'switchPuzzle'];
    for (var i = 0; i < events.length; ++i) {
      var func = this['_' + events[i]];
      this._view.on(events[i], func.bind(this));
    }
  }
  
  HeaderController.prototype._addPuzzle = function() {
    // TODO: this
  };
  
  HeaderController.prototype._deletePuzzle = function(id) {
    var name = null;
    var puzzles = window.app.store.getPuzzles();
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].id === id) {
        name = puzzles[i].name;
      }
    }
    new window.app.DeletePopup(name, function() {
      window.app.store.deletePuzzle(id);
    }.bind(this)).show();
  };
  
  HeaderController.prototype._switchPuzzle = function(id) {
    this._view.close();
    window.app.store.switchPuzzle(id);
  };
  
  window.app.HeaderController = HeaderController;

})();