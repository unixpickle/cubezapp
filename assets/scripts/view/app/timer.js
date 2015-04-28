(function() {

  var ESCAPE_KEY = 0x1b;
  var SPACE_KEY = 0x20;

  // The TimerView is responsible for presenting the timer to the user.
  function TimerView(appView) {
    this._appView = appView;
    this._manualEntry = false;
    this._settingsChangedWhileRunning = false;
    this._timerRunning = false;

    this._currentScramble = null;
    this._scrambleStream = new window.app.ScrambleStream();
    this._scrambleStream.on('scramble', this._showScramble.bind(this));
    this._scrambleStream.on('softTimeout',
      this._showScramble.bind(this, 'Loading...'));

    this.controls = new Controls();

    // Setup the hidden class before running this._updateSettings().
    this._theaterMode = false;
    this._accuracy = 0;
    this._updateSettings();

    this._registerModelEvents();

    appView.on('load', this._scrambleStream.resume.bind(this._scrambleStream));

    // NOTE: we do not run this._showLatestSolve() here because the AppView does
    // it as part of the loading process.
  }

  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;

  TimerView.prototype.cancel = function() {
    this._assertRunning();
    this._timerRunning = false;

    this._showLatestSolve();
    this._scrambleStream.resumeReuseScramble();
    if (this._theaterMode) {
      this._appView.setTheaterMode(false);
    }
    if (this._settingsChangedWhileRunning) {
      this._settingsChangedWhileRunning = false;
      this._updateSettings();
    }
  };

  TimerView.prototype.currentScramble = function() {
    return this._currentScramble;
  };

  TimerView.prototype.newScramble = function() {
    this._scrambleStream.pause();
    this._scrambleStream.resume();
  };

  TimerView.prototype.setManualEntry = function(flag) {
    this._assertNotRunning();
    if (this._manualEntry === flag) {
      return;
    }
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
    this._assertNotRunning();
    this._timerRunning = true;

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
    this._scrambleStream.pause();
    this._showScramble(null);
  };

  TimerView.prototype.stop = function() {
    this._assertRunning();
    this._timerRunning = false;

    this._scrambleStream.resume();
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

  TimerView.prototype._assertNotRunning = function() {
    if (this._timerRunning) {
      throw new Error('timer cannot be running');
    }
  };

  TimerView.prototype._assertRunning = function() {
    if (!this._timerRunning) {
      throw new Error('timer is not running');
    }
  };

  TimerView.prototype._handleLatestSolveChanged = function() {
    if (!this._timerRunning && !this._manualEntry) {
      this._showLatestSolve();
    }
  };

  TimerView.prototype._handleSettingsChanged = function() {
    if (this._timerRunning) {
      this._settingsChangedWhileRunning = true;
    } else {
      this._updateSettings();
    }
  };

  TimerView.prototype._registerModelEvents = function() {
    window.app.observe.globalSettings(['theaterMode', 'timerAccuracy'],
      this._handleSettingsChanged.bind(this));
    window.app.observe.latestSolve(['time', 'memo'],
      this._handleLatestSolveChanged.bind(this));
  };

  TimerView.prototype._showLatestSolve = function() {
    var solve = window.app.store.getLatestSolve();
    if (solve === null) {
      this._appView.setTime(null);
    } else {
      this._appView.setTime(window.app.formatTime(solve.time));
      if (solve.memo >= 0) {
        this._appView.setMemo(window.app.formatTime(solve.memo));
      } else {
        this._appView.setMemo(null);
      }
    }
  };

  TimerView.prototype._showScramble = function(scramble) {
    this._appView.setScramble(scramble);
    if (scramble ===  'Loading...' || scramble === null) {
      this._currentScramble = null;
    } else {
      this._currentScramble = scramble;
    }
  };

  TimerView.prototype._updateSettings = function() {
    var settings = window.app.store.getGlobalSettings();
    this._theaterMode = settings.theaterMode;
    this._accuracy = settings.timerAccuracy;
  };

  // Controls handles keyboard and/or touchscreen events for starting and
  // stopping the timer.
  function Controls() {
    window.app.EventEmitter.call(this);
    this._enabled = false;
    this._down = false;

    window.app.keyboard.push(this);

    // If the device has a touchscreen, track touch events on the middle
    // element.
    if ('ontouchstart' in document) {
      var $body = $(document.body);
      $body.on('touchstart', this._touchDown.bind(this));
      $body.on('touchend', this._touchUp.bind(this));
    }
  }

  Controls.prototype = Object.create(window.app.EventEmitter.prototype);

  Controls.prototype.disable = function() {
    this._enabled = false;
  };

  Controls.prototype.enable = function() {
    this._enabled = true;
  };

  Controls.prototype.keydown = function(e) {
    if (this._enabled && e.which === ESCAPE_KEY) {
      this._down = false;
      this.emit('cancel');
      return false;
    }

    if (!this._enabled || e.which !== SPACE_KEY) {
      // Allow the keyboard manager to propagate the event.
      return true;
    }

    // We could already be in the down state if they also have a touchscreen.
    if (!this._down) {
      this._down = true;
      this.emit('down');
    }
    return false;
  };

  Controls.prototype.keyup = function(e) {
    if (!this._enabled || e.which !== SPACE_KEY) {
      // Allow the keyboard manager to propagate the event.
      return true;
    }

    // We could be in the up state if they also have a touchscreen.
    if (this._down) {
      this._down = false;
      this.emit('up');
    }
    return false;
  };

  Controls.prototype._touchDown = function(e) {
    if (!this._enabled) {
      return;
    }

    // Only accept touch events from the middle part of the page.
    var t = e.target;
    if (t !== document.body && t.id !== 'memo-time' &&
        t.id !== 'pb-status' && t.id !== 'time') {
      return;
    }

    // We could be in the down state if they have multitouch or a keyboard.
    if (!this._down) {
      this._down = true;
      this.emit('down');
    }
  };

  Controls.prototype._touchUp = function() {
    if (!this._enabled) {
      return;
    }

    // We could be in the up state if they have multitouch or a keyboard.
    if (this._down) {
      this._down = false;
      this.emit('up');
    }
  };

  window.app.TimerView = TimerView;

})();
