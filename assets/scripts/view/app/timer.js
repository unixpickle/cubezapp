(function() {

  var ESCAPE_KEY = 0x1b;
  var SPACE_KEY = 0x20;

  // The TimerView is responsible for presenting the timer to the user.
  function TimerView(appView) {
    this._appView = appView;
    this.controls = new Controls();

    this._registerModelEvents();
    appView.on('load', this._appLoaded.bind(this));

    // NOTE: we do not run this._showLatestSolve() here because the AppView does
    // it as part of the loading process.
  }

  TimerView.ACCURACY_CENTISECONDS = 0;
  TimerView.ACCURACY_SECONDS = 1;
  TimerView.ACCURACY_NONE = 2;
  TimerView.ACCURACY_NAMES = ['Centiseconds', 'Seconds', 'None'];

  TimerView.prototype._appLoaded = function() {
    window.app.timer.getScrambleStream().resume();
    this._showPBLabel();
    this._updateManualEntryUI();
  };

  TimerView.prototype._handleInputChanged = function() {
    // NOTE: this is necessary to change the text when there are no solves. It
    // may be "Stackmat", "Hit Space" or "Tap Screen".
    if (window.app.timer.getState() === window.app.Timer.STATE_NOT_RUNNING &&
        window.app.store.getLatestSolve() === null) {
      this._appView.setTime(null);
    }
  };

  TimerView.prototype._handleLatestSolveChanged = function() {
    if (window.app.timer.getState() === window.app.Timer.STATE_DONE ||
        window.app.timer.getState() === window.app.Timer.STATE_NOT_RUNNING) {
      this._showLatestSolve();
    }
  };

  TimerView.prototype._handleStatsComputed = function() {
    if (!isTimerRunning()) {
      this._showPBLabel();
    }
  };

  TimerView.prototype._handleStatsLoading = function() {
    this._appView.setPB(null);
  };

  TimerView.prototype._handleTimerActive = function() {
    if (window.app.store.getGlobalSettings().theaterMode) {
      this._appView.setTheaterMode(true);
    }
    this._appView.setScramble(null);
    this._appView.setPB(null);
    this._appView.setMemo(null);
  };

  TimerView.prototype._handleTimerDoneMemo = function() {
    this._appView.setMemo(
      window.app.formatTime(window.app.timer.getMemoTime())
    );
  };

  TimerView.prototype._handleTimerInspectionReady = function() {
    this._appView.setTime(Math.ceil(window.app.Timer.WCA_INSPECTION_TIME /
      1000));
  };

  TimerView.prototype._handleTimerInspectionTime = function() {
    var elapsed = window.app.timer.getInspectionTime();
    if (elapsed > window.app.Timer.WCA_INSPECTION_TIME) {
      this._appView.setTime('+2');
    } else {
      this._appView.setTime(Math.ceil((window.app.Timer.WCA_INSPECTION_TIME -
        elapsed) / 1000));
    }
  };

  TimerView.prototype._handleTimerManualTime = function() {
    this._appView.setTime(formatManualEntry(window.app.timer.getManualTime()));
    this._appView.blinkTime();
  };

  TimerView.prototype._handleTimerReady = function() {
    if (this._accuracy === TimerView.ACCURACY_NONE) {
      this._appView.setTime('Ready');
    } else if (this._accuracy === TimerView.ACCURACY_SECONDS) {
      this._appView.setTime('0');
    } else {
      this._appView.setTime('0.00');
    }
  };

  TimerView.prototype._handleTimerReset = function() {
    this._appView.setTheaterMode(false);
    this._showPBLabel();

    this._updateManualEntryUI();
    if (window.app.timer.getState() !== window.app.Timer.STATE_MANUAL_ENTRY) {
      this._showLatestSolve();
    }
  };

  TimerView.prototype._handleTimerTime = function() {
    var accuracy = window.app.store.getGlobalSettings().timerAccuracy;

    if (accuracy === TimerView.ACCURACY_NONE) {
      this._appView.setTime('Timing');
      return;
    }

    var addTwo = window.app.timer.getPlus2();
    var millis = window.app.timer.getTime();

    var showMillis = (addTwo ? millis + 2000 : millis);
    var suffix = (addTwo ? '+' : '');

    if (accuracy === TimerView.ACCURACY_SECONDS) {
      this._appView.setTime(window.app.formatSeconds(showMillis) + suffix);
    } else {
      this._appView.setTime(window.app.formatTime(showMillis) + suffix);
    }
  };

  TimerView.prototype._handleTimerTiming = function() {
    this._handleTimerTime();
  };

  TimerView.prototype._handleTimerWaiting = function() {
    this._appView.setTime('Waiting');
  };

  TimerView.prototype._registerModelEvents = function() {
    window.app.observe.latestSolve(['time', 'memo', 'plus2', 'dnf'],
      this._handleLatestSolveChanged.bind(this));
    window.app.observe.activePuzzle('timerInput',
      this._handleInputChanged.bind(this));
    window.app.store.on('computedStats', this._handleStatsComputed.bind(this));
    window.app.store.on('loadingStats', this._handleStatsLoading.bind(this));

    var stream = window.app.timer.getScrambleStream();
    stream.on('scramble', this._showScramble.bind(this));
    stream.on('softTimeout', this._showScramble.bind(this, 'Loading...'));

    var timerEvents = ['doneMemo', 'inspectionReady', 'inspectionTime', 'time',
      'ready', 'active', 'timing', 'waiting', 'reset', 'manualTime'];
    for (var i = 0; i < timerEvents.length; ++i) {
      var event = timerEvents[i];
      var handlerName = '_handleTimer' + event.charAt(0).toUpperCase() +
        event.substring(1);
      if ('undefined' === typeof this[handlerName]) {
        throw new Error('no handler for: ' + event);
      }
      window.app.timer.on(event, this[handlerName].bind(this));
    }
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

      var timeString = window.app.formatTime(time) + suffix;
      if (solve.dnf) {
        this._appView.setTimeDNF(timeString);
      } else {
        this._appView.setTime(timeString);
      }

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
  };

  TimerView.prototype._updateManualEntryUI = function() {
    if (window.app.timer.getState() === window.app.Timer.STATE_MANUAL_ENTRY) {
      this._appView.setMemo(null);
      this._appView.setTimeBlinking(true);
      this._handleTimerManualTime();
    } else {
      this._appView.setTimeBlinking(false);
    }
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

  function isTimerRunning() {
    switch (window.app.timer.getState()) {
    case window.app.Timer.STATE_NOT_RUNNING:
    case window.app.Timer.STATE_MANUAL_ENTRY:
      return false;
    default:
      return true;
    }
  }

  window.app.TimerView = TimerView;

})();
