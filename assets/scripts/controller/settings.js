(function() {

  function SettingsController(view) {
    this._view = view;
    var events = ['bldChanged', 'flavorChanged', 'iconChanged', 'changeName',
      'scrambleTypeChanged', 'scramblerChanged', 'theaterModeChanged'];
    for (var i = 0; i < events.length; ++i) {
      var functionName = '_' + events[i];
      this._view.on(events[i], this[functionName].bind(this));
    }
  }

  SettingsController.prototype._bldChanged = function() {
    // TODO: make this better.
    var inputMode = this._view.bld() ? window.app.TimerController.INPUT_BLD :
      window.app.TimerController.INPUT_REGULAR;
    window.app.store.modifyPuzzle({timerInput: inputMode});
  };

  SettingsController.prototype._changeName = function() {
    var popup = new window.app.RenamePopup();
    popup.on('rename', function() {
      var name = popup.name();
      if (!isNameValid(name)) {
        popup.shakeInput();
      } else {
        window.app.store.modifyPuzzle({name: name});
        popup.close();
      }
    });
    popup.show();
  };

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
  
  SettingsController.prototype._theaterModeChanged = function() {
    var flag = this._view.theaterMode();
    window.app.store.modifyGlobalSettings({theaterMode: flag});
  };

  function isNameValid(name) {
    if (name.length === 0) {
      return false;
    }
    var puzzles = window.app.store.getPuzzles();
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      if (puzzles[i].name === name) {
        return false;
      }
    }
    return true;
  }

  window.app.SettingsController = SettingsController;

})();
