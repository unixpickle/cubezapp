(function() {
  
  // These represent the modes of input that the timer can use.
  var MODE_DISABLED = 0;
  var MODE_ENTRY = 1;
  var MODE_STACKMAT = 2;
  var MODE_REGULAR = 3;
  var MODE_INSPECTION = 4;
  var MODE_BLD = 5;
  
  // These represent the three different ways of showing user the current time
  // while timing.
  var ACCURACY_CENTISECONDS = 0;
  var ACCURACY_SECONDS = 1;
  var ACCURACY_NONE = 2;
  
  function Timer() {
    // this._accuracy is used to determine how to show the time mid-solve.
    this._accuracy = ACCURACY_CENTISECONDS;
    
    // this._mode is used to determine the current timer mode.
    this._mode = MODE_DISABLED;
    
    // this._upAction is a function which is run on the next space-up or
    // touch-up event for MODE_REGULAR, MODE_INSPECTION, and MODE_BLD.
    this._upAction = nullAction;
    
    // this._startTime represents the time since the beginning of the solve. In
    // MODE_REGULAR, this is the time when the user started the timer. In
    // MODE_INSPECTION, this is either the time when the user started inspection
    // time or the time when they started the timer. In MODE_BLD, this is the
    // time they started memo. In all other modes, this is meaningless.
    this._startTime = -1;
    
    // this._firstPart is the amount of time used for the first "part" of the
    // time. This only has meaning in MODE_INSPECTION and MODE_BLD,
    // representing inspection time and memo time respectively.
    this._firstPart = -1;
    
    // this._timerInterval is the interval from setInterval() used to update the
    // timer text.
    this._timerInterval = null;
    
    // this._started is true if this.onStart was called more recently than      
    // this.onCancel or this.onCancel.
    this._started = false;
    
    // Event sources.
    this._spaceListener = new SpaceListener();
    this._spaceListener.onCancel = this._cancel.bind(this);
    this._spaceListener.onDown = this._down.bind(this);
    this._spaceListener.onUp = this._up.bind(this);
    this._touches = new window.app.Touches();
    this._touches.onDown = this._down.bind(this);
    this._touches.onUp = this._up.bind(this);
    this._stackmat = new window.app.Stackmat();
    this._stackmat.onWait = this._stackmatWait.bind(this);
    this._stackmat.onReady = this._stackmatReady.bind(this);
    this._stackmat.onTime = this._stackmatTime.bind(this);
    this._stackmat.onDone = this._stackmatDone.bind(this);
    this._stackmat.onCancel = this._stackmatCancel.bind(this);
    
    // Event handlers.
    this.onCancel = null;
    this.onDone = null;
    this.onMemo = null;
    this.onStart = null;
    this.onUpdateTime = null;
  }
  
  Timer.MODE_DISABLED = MODE_DISABLED;
  Timer.MODE_ENTRY = MODE_ENTRY;
  Timer.MODE_STACKMAT = MODE_STACKMAT;
  Timer.MODE_REGULAR = MODE_REGULAR;
  Timer.MODE_INSPECTION = MODE_INSPECTION;
  Timer.MODE_BLD = MODE_BLD;
  
  Timer.ACCURACY_CENTISECONDS = ACCURACY_CENTISECONDS;
  Timer.ACCURACY_SECONDS = ACCURACY_SECONDS;
  Timer.ACCURACY_NONE = ACCURACY_NONE;
  
  // setAccuracy changes the accuracy of the timer.
  Timer.prototype.setAccuracy = function(accuracy) {
    this._accuracy = accuracy;
  }
  
  // setMode changes the mode of the timer. This will cancel any current timing
  // operations.
  Timer.prototype.setMode = function(mode) {
    this._cancel();
    this._mode = mode;
    
    // Setup the input method.
    switch (mode) {
    case MODE_DISABLED:
    case MODE_ENTRY:
      this._stackmat.disconnect();
      this._touches.disable();
      this._spaceListener.disable();
      break;
    case MODE_STACKMAT:
      this._stackmat.connect();
      this._touches.disable();
      this._spaceListener.disable();
      break;
    case MODE_REGULAR:
    case MODE_INSPECTION:
    case MODE_BLD:
      this._stackmat.disconnect();
      this._touches.enable();
      this._spaceListener.enable();
      break;
    default:
      break;
    }
  }
  
  Timer.prototype._cancel = function() {
    if (this._mode === MODE_STACKMAT) {
      this._stackmatCancel();
      return;
    } else if (this._mode < MODE_REGULAR) {
      return;
    }
    
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this._upAction = nullAction;
    this._startTime = -1;
    this._firstPart = -1;
    if (this._started) {
      this._started = false;
      if ('function' === typeof this.onCancel) {
        this.onCancel();
      }
    }
  };
  
  Timer.prototype._down = function() {
    // If they have a touchscreen and a keyboard, it's possible this._down
    // could be called multiple times before this._up. This is how we check.
    if (this._upAction !== nullAction) {
      return;
    }
    
    if (this._mode < MODE_REGULAR) {
      throw new Error('down event in wrong mode: ' + this._mode);
    }
    
    // If the timer is not started, we prepare the timer.
    if (!this._started) {
      this._ready();
      this._upAction = this._startTimer;
      return;
    }
    
    // This press may start a new step of the solve.
    if (this._mode === MODE_INSPECTION && this._firstPart < 0) {
      this._upAction = this._stopInspection;
      return;
    } else if (this._mode == MODE_BLD && this._firstPart < 0) {
      this._stopMemo();
      return;
    }
    
    // The time is ending.
    this._prepareStop();
  };
  
  Timer.prototype._generateBLDSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    return {
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: this._firstPart,
      notes: '',
      plus2: false,
      time: time
    };
  };
  
  Timer.prototype._generateInspectionSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    return {
      date: new Date().getTime(),
      dnf: false,
      inspection: this._firstPart,
      memo: 0,
      notes: '',
      plus2: this._isPlus2(),
      time: time
    };
  };
  
  Timer.prototype._generateRegularSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    return {
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: 0,
      notes: '',
      plus2: false,
      time: time
    };
  };
  
  Timer.prototype._isPlus2 = function() {
    return this._mode === MODE_INSPECTION && this._firstPart > 15000;
  };
  
  Timer.prototype._prepareStop = function() {
    // Compute the result of the timer.
    var res;
    if (this._mode === MODE_REGULAR) {
      res = this._generateRegularSolve();
    } else if (this._mode === MODE_INSPECTION) {
      res = this._generateInspectionSolve();
    } else if (this._mode === MODE_BLD) {
      res = this._generateBLDSolve();
    }
    this._showResult(res);
    
    // Reset the timer state.
    this._firstPart = -1;
    this._startTime = -1;
    
    // Stop the timer interval.
    if (this._timerInterval === null) {
      throw new Error('this._timerInterval should not be null');
    }
    clearInterval(this._timerInterval);
    this._timerInterval = null;
    
    // When this._up() is called, we should tell the callback about the result.
    this._upAction = function() {
      this._started = false;
      if ('function' === typeof this.onDone) {
        this.onDone(res);
      }
    }.bind(this);
  };
  
  Timer.prototype._ready = function() {
    this._started = true;
    
    // Tell the callback we've started.
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
    
    // Give the callback the initial time.
    if ('function' === typeof this.onUpdateTime) {
      if (this._mode == MODE_INSPECTION) {
        this.onUpdateTime('15');
      } else {
        var label = ['0.00', '0', 'Ready'][this._accuracy];
        this.onUpdateTime(label);
      }
    }
  };
  
  Timer.prototype._showResult = function(res) {
    if ('function' !== typeof this.onUpdateTime) {
      return;
    }
    
    var timeStr;
    if (res.plus2) {
      timeStr = window.app.formatTime(res.time + 2000) + '+';
    } else {
      timeStr = window.app.formatTime(res.time);
    }
    this.onUpdateTime(timeStr);
  };
  
  Timer.prototype._stackmatCancel = function() {
    if (!this._active) {
      return;
    }
    this._active = false;
    if ('function' === typeof this.onCancel) {
      this.onCancel();
    }
  };
  
  Timer.prototype._stackmatDone = function(t) {
    if (!this._active) {
      return;
    }
    this._active = false;
    if ('function' === typeof this.onDone) {
      this.onDone({
        date: new Date().getTime(),
        dnf: false,
        inspection: 0,
        memo: 0,
        notes: '',
        plus2: false,
        time: t
      });
    }
  };
  
  Timer.prototype._stackmatReady = function() {
    if (!this._active) {
      return;
    }
    if ('function' === typeof this.onUpdateTime) {
      this.onUpdateTime('Ready');
    }
  };
  
  Timer.prototype._stackmatTime = function(millis) {
    if (!this._active || 'function' !== typeof this.onUpdateTime) {
      return;
    }
    
    // If there is no accuracy, we simply say "Timing".
    if (this._accuracy === ACCURACY_NONE) {
      this.onUpdateTime('Timing');
      return;
    }
    
    // Show the time with the given accuracy.
    if (this._accuracy === ACCURACY_SECONDS) {
      this.onUpdateTime(window.app.formatSeconds(millis));
    } else {
      this.onUpdateTime(window.app.formatTime(millis));
    }
  };
  
  Timer.prototype._stackmatWait = function() {
    if (this._active) {
      return;
    }
    this._active = true;
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
    if ('function' === typeof this.onUpdateTime) {
      this.onUpdateTime('Wait');
    }
  };
  
  Timer.prototype._startTimer = function() {
    this._startTime = new Date().getTime();
    this._timerInterval = setInterval(this._update.bind(this), 10);
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
  };
  
  Timer.prototype._stopInspection = function() {
    // If inspection was already stopped because they went over 17 seconds, we
    // should do nothing here.
    if (this._firstPart >= 0) {
      return;
    }
    
    var timestamp = new Date().getTime();
    var duration = Math.max(timestamp - this._startTime, 0);
    this._firstPart = duration;
    this._startTime = timestamp;
  };
  
  Timer.prototype._stopMemo = function() {
    var timestamp = new Date().getTime();
    var duration = Math.max(timestamp - this._startTime, 0);
    this._firstPart = duration;
    
    if ('function' === typeof this.onMemo) {
      this.onMemo(window.app.formatTime(duration));
    }
  };
  
  Timer.prototype._up = function() {
    if (this._mode < MODE_REGULAR) {
      throw new Error('up event in wrong mode: ' + this._mode);
    }
    this._upAction();
    this._upAction = nullAction;
  };
  
  Timer.prototype._update = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    
    // If they used too much inspection, we will skip to solving.
    if (this._mode == MODE_INSPECTION && this._firstPart < 0 &&
        time >= 17000) {
      this._stopInspection();
      this._update();
      return;
    }
    
    // If there is no this.onUpdateTime, there's nothing to do.
    if ('function' !== typeof this.onUpdateTime) {
      return;
    }
    
    // If this is inspection time, we show them the seconds remaining.
    if (this._mode === MODE_INSPECTION && this._firstPart < 0) {
      if (time < 15000) {
        this.onUpdateTime('' + Math.ceil(15 - time/1000));
      } else {
        this.onUpdateTime('+2');
      }
      return;
    }
    
    // If there is no accuracy, we simply say "Timing".
    if (this._accuracy === ACCURACY_NONE) {
      this.onUpdateTime('Timing');
      return;
    }
    
    // Show the time with an optional "+" after it.
    var showTime = (this._isPlus2() ? time + 2000 : time);
    var showResult = '';
    if (this._accuracy === ACCURACY_SECONDS) {
      showResult = window.app.formatSeconds(showTime);
    } else {
      showResult = window.app.formatTime(showTime);
    }
    if (this._isPlus2()) {
      this.onUpdateTime(showResult + '+');
    } else {
      this.onUpdateTime(showResult);
    }
  };
  
  function SpaceListener() {
    this.onCancel = null;
    this.onDown = null;
    this.onUp = null;
    this._enabled = false;
    
    window.app.keyboard.push(this);
  }
  
  SpaceListener.prototype.disable = function() {
    this._enabled = false;
  };
  
  SpaceListener.prototype.enable = function() {
    this._enabled = true;
  };
  
  SpaceListener.prototype.keydown = function(e) {
    // The escape key cancels the timer if possible.
    if (this._enabled && e.which === 0x1b) {
      if ('function' == typeof this.onCancel) {
        this.onCancel();
      }
      return;
    }
    
    // If we were not waiting for the space bar, we allow the keyboard manager
    // to propagate the event.
    if (!this._enabled || e.which !== 0x20) {
      return true;
    }
    
    // Repeating space events are ignored.
    if (e.repeat) {
      return false;
    }
    
    if ('function' === typeof this.onDown) {
      this.onDown();
    }
    return false;
  };
  
  SpaceListener.prototype.keyup = function(e) {
    // If we were not waiting for the space bar, we allow the keyboard manager
    // to propagate the event.
    if (!this._enabled || e.which !== 0x20) {
      return true;
    }
    
    if ('function' === typeof this.onUp) {
      this.onUp();
    }
    return false;
  };
  
  function nullAction() {
  }
  
  window.app.Timer = Timer;
  
})();