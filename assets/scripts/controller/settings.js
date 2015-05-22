(function() {

  function SettingsController(view) {
    this._view = view;
    var events = ['changeName', 'flavorChanged', 'iconChanged', 'rightyChanged',
      'scrambleTypeChanged', 'scramblerChanged', 'theaterModeChanged',
      'updateChanged'];
    for (var i = 0; i < events.length; ++i) {
      var functionName = '_' + events[i];
      this._view.on(events[i], this[functionName].bind(this));
    }
    var inputEvents = ['bldChanged', 'inspectionChanged', 'timerInputChanged'];
    for (var i = 0; i < inputEvents.length; ++i) {
      this._view.on(inputEvents[i], this._inputChanged.bind(this));
    }
  }

  SettingsController.prototype._changeName = function() {
    var popup = new window.app.RenamePopup();
    popup.on('rename', function() {
      var name = popup.getName().trim();
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
    var flavorId = window.app.flavors.nameToId(this._view.getFlavorName());
    window.app.store.modifyGlobalSettings({flavor: flavorId});
  };

  SettingsController.prototype._iconChanged = function() {
    var iconName = this._view.getIconName();
    var iconIndex = window.app.iconNames.indexOf(iconName);
    var iconFile = window.app.iconFiles[iconIndex];
    window.app.store.modifyPuzzle({icon: iconFile});
  };

  SettingsController.prototype._inputChanged = function() {
    var input = 0;
    if (this._view.getBLD()) {
      input = window.app.Timer.INPUT_BLD;
    } else if (this._view.getInspection()) {
      input = window.app.Timer.INPUT_INSPECTION;
    } else {
      var modeStr = this._view.getTimerInput();
      if (modeStr === 'Regular') {
        input = window.app.Timer.INPUT_REGULAR;
      } else if (modeStr === 'Stackmat') {
        input = window.app.Timer.INPUT_STACKMAT;
      } else {
        input = window.app.Timer.INPUT_ENTRY;
      }
    }
    window.app.store.modifyPuzzle({timerInput: input});
  };

  SettingsController.prototype._rightyChanged = function() {
    window.app.store.modifyGlobalSettings({righty: this._view.getRighty()});
  };

  SettingsController.prototype._scrambleTypeChanged = function() {
    window.app.store.modifyPuzzle({scrambleType: this._view.getScrambleType()});
  };

  SettingsController.prototype._scramblerChanged = function() {
    var scrambler = this._view.getScrambler();
    var type = this._view.getScrambleType();

    // Use the default type if the view's type is invalid.
    var types = ['None'];
    if (scrambler !== 'None') {
      types = window.puzzlejs.scrambler.scramblersForPuzzle(scrambler);
      for (var i = 0, len = types.length; i < len; ++i) {
        types[i] = types[i].name;
      }
    }
    if (types.indexOf(type) < 0) {
      type = types[0];
    }

    window.app.store.modifyPuzzle({scrambler: scrambler, scrambleType: type});
  };

  SettingsController.prototype._theaterModeChanged = function() {
    var flag = this._view.getTheaterMode();
    window.app.store.modifyGlobalSettings({theaterMode: flag});
  };

  SettingsController.prototype._updateChanged = function() {
    window.app.store.modifyGlobalSettings({
      timerAccuracy: this._view.getUpdate()
    });
  };

  function isNameValid(name) {
    if (name.length === 0) {
      return false;
    } else if (name === window.app.store.getActivePuzzle().name) {
      return true;
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
