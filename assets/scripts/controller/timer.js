(function() {
  
  var MODE_DISABLED = 0;
  var MODE_ENTRY = 1;
  var MODE_REGULAR = 2;
  var MODE_INSPECTION = 3;
  var MODE_BLD = 4;
  
  function Timer() {
    // State of timer.
    this._mode = MODE_DISABLED;
    
    // this._spaceUpAction is a function which is run on the next key up event
    // for the space bar.
    this._spaceUpAction = nullAction;
    
    // this._running is true if the timer is running.
    this._running = false;
    
    // this._startTime represents the time since the last user action. In
    // MODE_REGULAR, this is the time when the user started the timer. In
    // MODE_INSPECTION, this is either the time when the user started inspection
    // time or the time when they started the timer. In MODE_BLD, this is either
    // the time they started memo or the time they started execution.
    this._startTime = -1;
    
    // this._firstPart is the amount of time required for the first "part" of
    // the time. This only has meaning in MODE_INSPECTION and MODE_BLD,
    // representing inspection time and memo time respectively.
    this._firstPart = -1;
    
    // this._timerInterval is the interval from setInterval() used to update the
    // timer text.
    this._timerInterval = null;
    
    // Event handlers.
    this.onCancel = null;
    this.onDone = null;
    this.onMemo = null;
    this.onStart = null;
    this.onUpdateTime = null;
    
    window.app.keyboard.push(this);
  }
  
  Timer.prototype.keydown = function(e) {
    // If this is not MODE_REGULAR, MODE_INSPECTION, or MODE_BLD, the space bar
    // does nothing.
    if (this._mode < MODE_REGULAR || e.which !== 0x20) {
      return true;
    }
    
    // Repeating space events are ignored.
    if (e.repeat) {
      return false;
    }
    
    // If the timer is not running, releasing the space bar should start the
    // timer.
    if (!this._running) {
      this._prepareStart();
      this._spaceUpAction = this._start;
      return false;
    }
    
    // In regular mode, pressing down the space bar stops the timer.
    if (this._mode === MODE_REGULAR) {
      // Stop the timer.
      this._stopRegularSolve();
      this._spaceUpAction = nullAction;
    } else if (this._mode === MODE_INSPECTION) {
      if (this._firstPart > 0) {
        // Stop the timer.
        this._stopInspectionSolve();
        this._spaceUpAction = nullAction;
      } else {
        // On key up, stop the inspection time.
        this._spaceUpAction = this._stopInspection;
      }
    } else if (this._mode === MODE_BLD) {
      if (this._firstPart > 0) {
        // Stop the timer.
        this._stopBLDSolve();
        this._spaceUpAction = nullAction;
      } else {
        // On key up, stop the memo time.
        this._stopMemo();
        this._spaceUpAction = nullAction;
      }
    }
    
    return false;
  };
  
  Timer.prototype.keyup = function(e) {
    // If this is not MODE_REGULAR, MODE_INSPECTION, or MODE_BLD, the space bar
    // does nothing.
    if (this._mode < MODE_REGULAR || e.which !== 0x20) {
      return true;
    }
    
    this._spaceUpAction();
    this._spaceUpAction = nullAction;
    
    return false;
  };
  
  Timer.prototype.setModeBLD = function() {
    this._mode = MODE_BLD;
    var wasRunning = this._running;
    this._stop();
    if (wasRunning && 'function' === typeof this.onCancel) {
      this.onCancel();
    }
  };
  
  Timer.prototype.setModeEntry = function() {
    this._mode = MODE_ENTRY;
    var wasRunning = this._running;
    this._stop();
    if (wasRunning && 'function' === typeof this.onCancel) {
      this.onCancel();
    }
  };
  
  Timer.prototype.setModeInspection = function() {
    this._mode = MODE_INSPECTION;
    var wasRunning = this._running;
    this._stop();
    if (wasRunning && 'function' === typeof this.onCancel) {
      this.onCancel();
    }
  };
  
  Timer.prototype.setModeRegular = function() {
    this._mode = MODE_REGULAR;
    var wasRunning = this._running;
    this._stop();
    if (wasRunning && 'function' === typeof this.onCancel) {
      this.onCancel();
    }
  };
  
  Timer.prototype._isPlus2 = function() {
    return this._mode === MODE_INSPECTION && this._firstPart > 15000;
  };
  
  Timer.prototype._prepareStart = function() {
    this._running = true;
    
    // Tell the callback we've started.
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
    
    // Give the callback the initial time.
    if ('function' === typeof this.onUpdateTime) {
      if (this._mode == MODE_INSPECTION) {
        this.onUpdateTime('15');
      } else {
        this.onUpdateTime('0.00');
      }
    }
  };
  
  Timer.prototype._start = function() {
    this._running = true;
    this._startTime = new Date().getTime();
    this._timerInterval = setInterval(this._update.bind(this), 10);
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
  };
  
  Timer.prototype._stop = function() {
    if (!this._running) {
      return;
    }
    
    this._firstPart = -1;
    this._startTime = -1;
    this._running = false;
    this._spaceUpAction = nullAction;
    
    // this._timerInterval might be null if this._prepareStart has run but not
    // this._start.
    if (this._timerInterval !== null) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }
  
  Timer.prototype._stopBLDSolve = function() {
    var execution = Math.max(new Date().getTime() - this._startTime, 0);
    var res = {
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: this._firstPart,
      notes: '',
      plus2: false,
      time: execution + this._firstPart
    };
    this._stop();
    
    if ('function' === typeof this.onDone) {
      this.onDone(res);
    }
  };
  
  Timer.prototype._stopInspection = function() {
    // If inspection was already stopped by external forces, this does nothing.
    if (this._firstPart >= 0) {
      return;
    }
    
    var timestamp = new Date().getTime();
    var duration = Math.max(timestamp - this._startTime, 0);
    this._firstPart = duration;
    this._startTime = timestamp;
  };
  
  Timer.prototype._stopInspectionSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    var res = {
      date: new Date().getTime(),
      dnf: false,
      inspection: this._firstPart,
      memo: 0,
      notes: '',
      plus2: this._isPlus2(),
      time: time
    };
    this._stop();
    
    if ('function' === typeof this.onDone) {
      this.onDone(res);
    }
  };
  
  Timer.prototype._stopMemo = function() {
    var timestamp = new Date().getTime();
    var duration = Math.max(timestamp - this._startTime, 0);
    this._firstPart = duration;
    this._startTime = timestamp;
    
    if ('function' === typeof this.onMemo) {
      this.onMemo(window.app.formatTime(duration));
    }
  };
  
  Timer.prototype._stopRegularSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    var res = {
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: 0,
      notes: '',
      plus2: false,
      time: time
    };
    this._stop();
    
    if ('function' === typeof this.onDone) {
      this.onDone(res);
    }
  };
  
  Timer.prototype._update = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    var showResult = '';
    
    // NOTE: usually, the effect of this method will be calling 
    // this.onUpdateTime. However, it *may* call this._stopInspection and return
    // prematurely.
    
    if (this._mode === MODE_BLD && this._firstPart >= 0) {
      time += this._firstPart;
    }
    
    // If this is inspection time, we show them something a bit different.
    if (this._mode === MODE_INSPECTION && this._firstPart < 0) {
      if (time < 15000) {
        showResult = '' + Math.ceil(15 - time/1000);
      } else if (time < 17000) {
        showResult = '+2';
      } else {
        // They used too much inspection. Start the timer.
        this._stopInspection();
        this._update();
        return;
      }
    } else {
      if (this._isPlus2()) {
        showResult = window.app.formatTime(time + 2000) + '+';
      } else {
        showResult = window.app.formatTime(time);
      }
    }
    
    if ('function' === typeof this.onUpdateTime) {
      this.onUpdateTime(showResult);
    }
  };
  
  function nullAction() {
  }
  
  window.app.Timer = Timer;
  
})();