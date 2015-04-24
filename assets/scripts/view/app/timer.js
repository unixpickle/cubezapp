(function() {
  
  function TimerView(appView) {
    this._appView = appView;
    this._timerRunning = false;
    this._settingsChangedWhileRunning = false;
    
    var settings = window.app.store.getGlobalSettings();
    this._theaterMode = settings.theaterMode;
    this._accuracy = settings.timerAccuracy;
    
    this._updateSettings();
    this._registerModelEvents();
    
    // NOTE: we do not run this._showLatestTime() here because the AppView does
    // that as part of the loading process.
  }
  
  TimerView.prototype.start = function() {
    if (this._timerRunning) {
      throw new Error('timer already running');
    }
    if (this._theaterMode) {
      this._appView.setTheaterMode(true);
    }
    this._appView.setMemo(null);
    this._appView.setPB(null);
  };
  
  TimerView.prototype.stop = function() {
    if (!this._timerRunning) {
      throw new Error('timer not running');
    }
    if (this._theaterMode) {
      this._appView.setTheaterMode(false);
    }
    if (this._settingsChangedWhileRunning) {
      this._settingsChangedWhileRunning = false;
      this._updateSettings();
    }
  };
  
  TimerView.prototype.update = function(millis, addTwo) {
    if (!this._timerRunning) {
      throw new Error('timer not running');
    }
  };
  
  TimerView.prototype.updateInspection = function(inspection) {
    if (!this._timerRunning) {
      throw new Error('timer not running');
    }
  };
  
  TimerView.prototype.updateMemo = function(memo) {
    if (!this._timerRunning) {
      throw new Error('timer not running');
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
    var settingHandler = this._handleSettingsChanged.bind(this);
    var timesHandler = this._handleTimesChanged.bind(this);
    
    window.app.store.on('modifiedGlobalSettings', handler);
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
  
  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;
  
  window.app.TimerView = TimerView;
  
})();