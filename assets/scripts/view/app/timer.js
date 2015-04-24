(function() {
  
  // The TimerView is responsible for presenting the timer to the user.
  function TimerView(appView) {
    this._appView = appView;
    this._timerRunning = false;
    this._settingsChangedWhileRunning = false;
    
    this._manualEntry = false;
    
    // Setup the hidden class before running this._updateSettings().
    this._theaterMode = false;
    this._accuracy = 0;
    this._updateSettings();
    
    this._registerModelEvents();
    
    // NOTE: we do not run this._showLatestTime() here because the AppView does
    // that as part of the loading process.
  }
  
  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;
  
  TimerView.prototype.setManualEntry = function(flag) {
    this._manualEntry = flag;
    if (!flag) {
      this._showLatestTime();
      this._appView.setTimeBlinking(false);
    } else {
      this._appView.setTimeBlinking(true);
      this._appView.setMemo(null);
    }
  };
  
  TimerView.prototype.start = function() {
    if (this._timerRunning) {
      throw new Error('timer already running');
    }
    if (this._theaterMode) {
      this._appView.setTheaterMode(true);
    }
    this._appView.setMemo(null);
    this._appView.setPB(null);
    if (this._accuracy === TimerView.ACCURACY_NONE) {
      this._appView.setTime('Ready');
    } else if (this._accuracy === TimerView.ACCURACY_SECONDS) {
      this._appView.setTime('0');
    } else {
      this._appView.setTime('0.00');
    }
  };
  
  TimerView.prototype.stop = function() {
    this._assertRunning();
    if (this._theaterMode) {
      this._appView.setTheaterMode(false);
    }
    if (this._settingsChangedWhileRunning) {
      this._settingsChangedWhileRunning = false;
      this._updateSettings();
    }
  };
  
  TimerView.prototype.update = function(millis, addTwo) {
    this._assertRunning();
    
    if (this._accuracy === TimerView.ACCURACY_NONE) {
      this._appView.setTime('Timing');
      return;
    }
    
    var showMillis = (addTwo ? millis + 2000 : millis);
    var suffix = (addTwo ? '+' : '');
    
    if (this._accuracy === TimerView.ACCURACY_SECONDS) {
      this._appView.setTime(window.app.formatSeconds(showMillis) + suffix);
    } else {
      this._appView.setTime(window.app.formatTime(showMillis) + suffix);
    }
  };
  
  TimerView.prototype.updateDone = function(millis, addTwo) {
    this._assertRunning();
    var showMillis = (addTwo ? millis + 2000 : millis);
    var suffix = (addTwo ? '+' : '');
    this._appView.setTime(window.app.formatTime(showMillis) + suffix);
  };
  
  TimerView.prototype.updateInspection = function(inspection) {
    this._assertRunning();
    if (inspection > 15000) {
      this._appView.setTime('+2');
    } else {
      this._appView.setTime('' + (15 - Math.floor(inspection / 1000)));
    }
  };
  
  TimerView.prototype.updateMemo = function(memo) {
    this._assertRunning();
    this._appView.setMemo(memo);
  };
  
  TimerView.prototype._assertRunning = function() {
    if (!this._timerRunning) {
      throw new Error('timer is not running');
    }
  };
  
  TimerView.prototype._handleSettingsChanged = function() {
    if (this._timerRunning) {
      this._settingsChangedWhileRunning = true;
    } else {
      this._updateSettings();
    }
  };
  
  TimerView.prototype._handleTimesChanged = function() {
    // If the timer is running we do not show the latest time.
    if (this._timerRunning) {
      return;
    }
    this._showLatestTime();
  };
  
  TimerView.prototype._registerModelEvents = function() {
    var settingsHandler = this._handleSettingsChanged.bind(this);
    var timesHandler = this._handleTimesChanged.bind(this);
    
    window.app.store.on('modifiedGlobalSettings', settingsHandler);
    window.app.store.on('remoteChange', function() {
      settingsHandler();
      timesHandler();
    });
    
    var timesEvents = ['modifiedSolve', 'addedSolve', 'deletedSolve'];
    for (var i = 0; i < timesEvents.length; ++i) {
      window.app.store.on(timesEvents[i], timesHandler);
    }
  };
  
  TimerView.prototype._showLatestTime = function() {
    window.app.store.getSolves(0, 1, function(err, solves) {
      if (err || solves.length !== 1) {
        this._appView.setTime(null);
        return;
      }
      var solve = solves[0];
      this._appView.setTime(window.app.formatTime(solve.time));
      if (solve.memo >= 0) {
        this._appView.setMemo(window.app.formatTime(solve.memo));
      } else {
        this._appView.setMemo(null);
      }
    }.bind(this));
  };
  
  TimerView.prototype._updateSettings = function() {
    var settings = window.app.store.getGlobalSettings();
    this._theaterMode = settings.theaterMode;
    this._accuracy = settings.timerAccuracy;
  };
  
  window.app.TimerView = TimerView;
  
})();