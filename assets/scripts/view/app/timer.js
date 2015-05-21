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

    appView.on('load', this._appLoaded.bind(this));

    // NOTE: we do not run this._showLatestSolve() here because the AppView does
    // it as part of the loading process.
  }

  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;
  TimerView.ACCURACY_NAMES = ['Centiseconds', 'Seconds', 'None'];

  TimerView.prototype.cancel = function() {
    this._assertRunning();
    this._timerRunning = false;

    this._showLatestSolve();
    this._scrambleStream.resumeReuseScramble();
    if (this._theaterMode) {
      this._appView.setTheaterMode(false);
    }
    this._showPBLabel();
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
      this._showLatestSolve();
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
    this._showPBLabel();
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
    this._appView.setMemo(window.app.formatTime(memo));
  };

  TimerView.prototype._appLoaded = function() {
    this._scrambleStream.resume();
    this._showPBLabel();
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
    if (!this._timerRunning) {
      this._showPBLabel();
      if (!this._manualEntry) {
        this._showLatestSolve();
      }
    }
  };

  TimerView.prototype._handleSettingsChanged = function() {
    if (this._timerRunning) {
      this._settingsChangedWhileRunning = true;
    } else {
      this._updateSettings();
    }
  };

  TimerView.prototype._handleStatsComputed = function() {
    if (!this._timerRunning) {
      this._showPBLabel();
    }
  };

  TimerView.prototype._handleStatsLoading = function() {
    this._appView.setPB(null);
  };

  TimerView.prototype._handleTimerInputChanged = function() {
    // In some situations, this function is necessary to change "Hit Space" to
    // "Stackmat" or vice versa.
    // NOTE: we can't use this._manualEntry because _handleTimerInputChanged
    // may be called by the observer before setManualEntry() is called by the
    // controller.
    var isManual = window.app.store.getActivePuzzle().timerInput ===
      window.app.TimerController.INPUT_ENTRY;
    if (!this._timerRunning && !isManual) {
      this._showLatestSolve();
    }
  };

  TimerView.prototype._registerModelEvents = function() {
    window.app.observe.globalSettings(['theaterMode', 'timerAccuracy'],
      this._handleSettingsChanged.bind(this));
    window.app.observe.activePuzzle('timerInput',
      this._handleTimerInputChanged.bind(this));
    window.app.observe.latestSolve(['time', 'memo'],
      this._handleLatestSolveChanged.bind(this));
    window.app.store.on('computedStats', this._handleStatsComputed.bind(this));
    window.app.store.on('loadingStats', this._handleStatsLoading.bind(this));
  };

  TimerView.prototype._showLatestSolve = function() {
    var solve = window.app.store.getLatestSolve();
    if (solve === null) {
      this._appView.setTime(null);
      this._appView.setMemo(null);
    } else {
      var time = solve.time;
      var suffix = '';
      if (solve.plus2) {
        time += 2000;
        suffix = '+';
      }
      this._appView.setTime(window.app.formatTime(time) + suffix);
      if (solve.memo >= 0) {
        this._appView.setMemo(window.app.formatTime(solve.memo));
      } else {
        this._appView.setMemo(null);
      }
    }
  };

  TimerView.prototype._showPBLabel = function() {
    var stats = window.app.store.getStats();
    var latestSolve = window.app.store.getLatestSolve();
    if (stats === null || latestSolve === null) {
      this._appView.setPB(null);
      return;
    }

    var pbSolve = window.app.solveIsPB(latestSolve);
    var pbAverages = [];
    for (var i = 0, len = stats.averages.length; i < len; ++i) {
      if (stats.averages[i].lastWasPB) {
        pbAverages.push(stats.averages[i].name);
      }
    }

    var pbAverage = (pbAverages.length > 0);
    var pbAverageName = '';
    if (pbAverages.length === 1) {
      if (pbAverages[0] === 'mo3') {
        pbAverageName = 'mean of 3';
      } else {
        pbAverageName = 'average of ' + pbAverages[0];
      }
    } else {
      pbAverageName = 'averages';
    }

    if (pbAverage && pbSolve) {
      this._appView.setPB('PB single and ' + pbAverageName);
    } else if (pbAverage) {
      this._appView.setPB('PB ' + pbAverageName);
    } else if (pbSolve) {
      this._appView.setPB('PB single');
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
  
  // formatManualEntry returns a time with ':' and '.' inserted at the right
  // places given a piece of user input.
  function formatManualEntry(raw) {
    // I know, I know, this looks like it's probably not the best way to format
    // the time. My response: it works. Who looks like a fool now? Mwahaha.
    switch (raw.length) {
    case 0:
      return '0.00';
    case 1:
      return '0.0' + raw;
    case 2:
      return '0.' + raw;
    case 3:
      return raw[0] + '.' + raw.substring(1);
    case 4:
      return raw.substring(0, 2) + '.' + raw.substring(2);
    case 5:
      return raw[0] + ':' + raw.substring(1, 3) + '.' + raw.substring(3);
    case 6:
      return raw.substring(0, 2) + ':' + raw.substring(2, 4) + '.' +
      raw.substring(4);
    case 7:
      return raw[0] + ':' + raw.substring(1, 3) + ':' + raw.substring(3, 5) +
        '.' + raw.substring(5);
    default:
      return '';
    }
  }

  window.app.TimerView = TimerView;

})();
