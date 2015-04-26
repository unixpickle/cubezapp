(function() {

  function SettingsController() {
    this._view = window.app.view.footer.settings;
    var events = ['flavorChanged', 'iconChanged', 'scramblerChanged'];
    for (var i = 0; i < events.length; ++i) {
      var functionName = '_' + events[i];
      this._view.on(events[i], this[functionName].bind(this));
    }
  }

  SettingsController.prototype._flavorChanged = function(flavorName) {
    window.app.store.modifyGlobalSettings({flavor: flavorName});
  };

  SettingsController.prototype._iconChanged = function(iconFile) {
    window.app.store.modifyPuzzle({icon: iconFile});
  };

  SettingsController.prototype._scramblerChanged = function(scrambler, type) {
    window.app.store.modifyPuzzle({scrambler: scrambler, scrambleType: type});
  };

  window.app.SettingsController = SettingsController;

})();
