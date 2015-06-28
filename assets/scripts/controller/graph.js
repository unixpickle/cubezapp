(function() {

  function GraphController(view) {
    this._view = view;
    this._registerSettingsEvents();
  }

  GraphController.prototype._registerSettingsEvents = function() {
    this._view.settings.on('settingChanged', function(name, value) {
      var obj = {};
      obj[name] = value;
      window.app.store.modifyPuzzle(obj);
    });
    this._view.settings.on('modeChanged', function(mode) {
      window.app.store.modifyPuzzle({graphMode: mode});
    });
  };

  window.app.GraphController = GraphController;

})();
