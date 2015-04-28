(function() {

  function SettingsController(view) {
    this._view = view;
    var events = ['flavorChanged', 'iconChanged', 'scrambleTypeChanged',
      'scramblerChanged'];
    for (var i = 0; i < events.length; ++i) {
      var functionName = '_' + events[i];
      this._view.on(events[i], this[functionName].bind(this));
    }
  }

  SettingsController.prototype._flavorChanged = function() {
    window.app.store.modifyGlobalSettings({flavor: this._view.flavorName()});
  };

  SettingsController.prototype._iconChanged = function() {
    var iconName = this._view.iconName();
    var iconIndex = window.app.iconNames.indexOf(iconName);
    var iconFile = window.app.iconFiles[iconIndex];
    window.app.store.modifyPuzzle({icon: iconFile});
  };

  SettingsController.prototype._scrambleTypeChanged = function() {
    window.app.store.modifyPuzzle({scrambleType: this._view.scrambleType()});
  };

  SettingsController.prototype._scramblerChanged = function() {
    var scrambler = this._view.scrambler();
    var type = this._view.scrambleType();
    window.app.store.modifyPuzzle({scrambler: scrambler, scrambleType: type});
  };

  window.app.SettingsController = SettingsController;

})();
