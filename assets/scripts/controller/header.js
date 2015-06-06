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
    var popup = new window.app.AddPopup();
    popup.on('create', function() {
      var viewModel = popup.viewModel();
      
      var name = viewModel.getField('name').trim();
      if (name === '' || puzzleNameExists(name)) {
        popup.shakeName();
        return;
      }

      popup.close();
      this._view.close();

      window.app.store.addPuzzle({
        name: name,
        icon: viewModel.getField('icon'),
        scrambler: viewModel.getField('scrambler'),
        scrambleType: viewModel.getField('scrambleType'),
        lastUsed: new Date().getTime(),
        timerInput: viewModel.getField('bld') ? window.app.Timer.INPUT_BLD :
          window.app.Timer.INPUT_REGULAR
      });
    }.bind(this));
    popup.show();
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

  function puzzleNameExists(name) {
    var puzzles = window.app.store.getPuzzles();
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].name === name) {
        return true;
      }
    }
    return false;
  }

  window.app.HeaderController = HeaderController;

})();
