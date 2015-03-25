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
  
  // This is the framerate that the timer will update at.
  var TIME_INTERVAL = Math.ceil(1000/24);
  
  // Timer is a controller which handles the timer flow.
  function Timer() {
    // this._accuracy is used to determine how to show the time mid-solve.
    this._accuracy = ACCURACY_CENTISECONDS;
    
    // this._manualText is used to store the characters that a user type in
    // manual entry mode.
    this._manualText = '';
    
    // this._mode is used to determine the current timer mode.
    this._mode = MODE_DISABLED;
    
    // this._session stores the current session if the mode is >= MODE_REGULAR.
    this._session = null;
    
    // this._stackmatRunning is true if a stackmat time is happening.
    this._stackmatRunning = false;
    
    // Event sources.
    this._upDown = new UpDown();
    this._upDown.onCancel = this._sessionCancel.bind(this);
    this._upDown.onDown = this._sessionDown.bind(this);
    this._upDown.onUp = this._sessionUp.bind(this);
    this._stackmat = new window.app.Stackmat();
    this._stackmat.onWait = this._stackmatWait.bind(this);
    this._stackmat.onReady = this._stackmatReady.bind(this);
    this._stackmat.onTime = this._stackmatTime.bind(this);
    this._stackmat.onDone = this._stackmatDone.bind(this);
    this._stackmat.onCancel = this._stackmatCancel.bind(this);
    
    // this.onCancel is called to reset the timer view to the last time.
    // This should exit theater mode if it was active.
    this.onCancel = null;
    
    // this.onDone is called when a new time has been recorded.
    // This should exit theater mode if it was active.
    this.onDone = null;
    
    // this.onStart is called in order to (optionally) enter theater mode.
    this.onStart = null;
    
    window.app.keyboard.push(this);
    
    // Catch external actions and make sure they cancel the timer.
    $('#header, #footer, #puzzles').click(this._externalAction.bind(this));
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
  
  // keydown ignores the event.
  Timer.prototype.keydown = function(e) {
    return true;
  };
  
  // keypress is used to process typing events for manual entry.
  Timer.prototype.keypress = function(e) {
    // If we are not in entry mode, do not accept input.
    if (this._mode !== MODE_ENTRY) {
      return true;
    }
    
    if (e.which === 8) {
      // Backspace.
      this._manualText = this._manualText.substring(0,
        this._manualText.length-1);
    } else if (e.which >= 0x30 && e.which <= 0x39) {
      // Number.
      this._manualText = this._manualText + (e.which - 0x30);
    } else if (e.which === 13) {
      // Enter.
      // TODO: add the time here.
      this._manualText = '';
    } else {
      return true;
    }
    
    window.app.view.blinkTime();
    
    // TODO: update the text properly.
    window.app.view.setTime(this._manualText);
    return false;
  }
  
  // keyup ignores the event.
  Timer.prototype.keyup = function(e) {
    return true;
  };
  
  // setAccuracy changes the accuracy of the timer.
  Timer.prototype.setAccuracy = function(accuracy) {
    this._accuracy = accuracy;
  }
  
  // setMode changes the mode of the timer. This will not interrupt the current
  // time.
  Timer.prototype.setMode = function(mode) {
    // Setting the mode to the current mode changes nothing.
    if (this._mode === mode) {
      return;
    }
    
    this._mode = mode;
    
    // If no session is active, we immediately change the input method.
    if (this._session === null && !this._stackmatRunning) {
      this._updateInputMethod();
    }
  }
  
  // _externalAction should be called whenever the user clicks or does anything
  // on the site. This way, the timer is cancelled if they do something.
  Timer.prototype._externalAction = function() {
    this._sessionCancel();
    this._stackmatCancel();
  }
  
  // _sessionCancel is called to cancel the current session.
  Timer.prototype._sessionCancel = function() {
    // Nullify the session if it exists.
    if (this._session === null) {
      return;
    }
    this._session.cancel();
    this._session = null;
    
    if (this._mode < MODE_REGULAR) {
      // The mode was changed while the session was running.
      this._updateInputMethod();
    }
    
    if ('function' !== typeof this.onCancel) {
      throw new Error('invalid onCancel callback');
    }
    this.onCancel();
  };
  
  // _sessionDone is used as a callback for when the session completes.
  Timer.prototype._sessionDone = function(record) {
    // Nullify the session.
    this._session = null;
    
    if (this._mode < MODE_REGULAR) {
      // The mode was changed while the session was running.
      this._updateInputMethod();
    }
    
    if ('function' !== typeof this.onDone) {
      throw new Error('invalid onDone callback');
    }
    this.onDone(record);
  };
  
  // _sessionDown is called when the space bar is pressed or the screen is
  // touched.
  Timer.prototype._sessionDown = function() {
    // Check if there's an existing session.
    if (this._session !== null) {
      this._session.down();
      return;
    } else if (this._mode < MODE_REGULAR) {
      throw new Error('sessionDown event with invalid mode.');
    }
    
    // Start a new session.
    switch (this._mode) {
    case MODE_REGULAR:
      this._session = new Session(this._accuracy);
      break;
    case MODE_BLD:
      this._session = new BLDSession(this._accuracy);
      break;
    case MODE_INSPECTION:
      this._session = new InspectionSession(this._accuracy);
      break;
    default:
      throw new Error('unknown mode: ' + this._mode);
      break;
    }
    this._session.onDone = this._sessionDone.bind(this);
    this._session.begin();
    
    if ('function' !== typeof this.onStart) {
      throw new Error('invalid onStart callback');
    }
    this.onStart();
  };
  
  // _sessionUp is called when the space bar is released or the user's finger is
  // lifted from the screen.
  Timer.prototype._sessionUp = function() {
    if (this._session !== null) {
      this._session.up();
    }
  };
  
  Timer.prototype._stackmatCancel = function() {
    if (!this._stackmatRunning) {
      return;
    }
    this._stackmatRunning = false;
    if ('function' !== typeof this.onCancel) {
      throw new Error('invalid onCancel callback');
    }
    this.onCancel();
  };
  
  Timer.prototype._stackmatDone = function(t) {
    if (!this._stackmatRunning) {
      return;
    }
    this._stackmatRunning = false;
    if ('function' !== typeof this.onDone) {
      throw new Error('invalid onDone callback');
    }
    this.onDone({
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: 0,
      notes: '',
      plus2: false,
      time: t
    });
  };
  
  Timer.prototype._stackmatReady = function() {
    if (!this._stackmatRunning) {
      return;
    }
    window.app.view.setTime('Ready');
  };
  
  Timer.prototype._stackmatTime = function(millis) {
    if (!this._stackmatRunning) {
      return;
    }
    
    // If there is no accuracy, we simply say "Timing".
    if (this._accuracy === ACCURACY_NONE) {
      window.app.view.setTime('Timing');
    } else if (this._accuracy === ACCURACY_SECONDS) {
      window.app.view.setTime(window.app.formatSeconds(millis));
    } else {
      window.app.view.setTime(window.app.formatTime(millis));
    }
  };
  
  Timer.prototype._stackmatWait = function() {
    if (this._stackmatRunning) {
      return;
    }
    this._stackmatRunning = true;
    if ('function' !== typeof this.onStart) {
      throw new Error('invalid onStart callback');
    }
    this.onStart();
    window.app.view.setTime('Wait');
  };
  
  // _updateInputMethod enables/disables different input methods to be right for
  // the current mode.
  Timer.prototype._updateInputMethod = function() {
    if (this._mode === MODE_ENTRY) {
      window.app.view.setTimeBlinking(true);
    } else {
      window.app.view.setTimeBlinking(false);
    }
    
    switch (this._mode) {
    case MODE_ENTRY:
      this._manualText = '';
      window.app.view.setTime('0.00');
    case MODE_DISABLED:
      this._stackmat.disconnect();
      this._upDown.disable();
      break;
    case MODE_STACKMAT:
      this._stackmat.connect();
      this._upDown.disable();
      break;
    case MODE_REGULAR:
    case MODE_INSPECTION:
    case MODE_BLD:
      this._stackmat.disconnect();
      this._upDown.enable();
      break;
    default:
      break;
    }
  };
  
  // A Session handles the process of recording a time using the space bar
  // or touchscreen.
  // This is a base class and can only be used for MODE_REGULAR.
  function Session(accuracy) {
    this.onDone = null;
    this._accuracy = accuracy;
    this._result = null;
    this._startTime = null;
    this._timerInterval = null;
  }
  
  // begin is called right after the object is constructed.
  Session.prototype.begin = function() {
    window.app.view.setMemo(null);
    switch (this._accuracy) {
    case ACCURACY_CENTISECONDS:
      window.app.view.setTime('0.00');
      break;
    case ACCURACY_SECONDS:
      window.app.view.setTime('0');
      break;
    case ACCURACY_NONE:
      window.app.view.setTime('Ready');
      break;
    default:
      throw new Error('unknown accuracy: ' + this._accuracy);
      break;
    }
  };
  
  // cancel stops the session prematurely.
  Session.prototype.cancel = function() {
    if (this._timerInterval !== null) {
      clearInterval(this._timerInterval);
    }
  };
  
  // down is called when the user pushes down the space bar or touches the
  // screen.
  Session.prototype.down = function() {
    if (this._timerInterval === null) {
      throw new Error('down event with no timer interval');
    }
    
    // Generate the result and stop the timer.
    this._result = this.generateSolve();
    clearInterval(this._timerInterval);
    this._timerInterval = null;
    
    // Show the result with full accuracy.
    var timeStr;
    if (this._result.plus2) {
      timeStr = window.app.formatTime(this._result.time + 2000) + '+';
    } else {
      timeStr = window.app.formatTime(this._result.time);
    }
    window.app.view.setTime(timeStr);
  };
  
  // generateSolve is called when the timer is stopped in order to get a usable
  // record to store in a database.
  Session.prototype.generateSolve = function() {
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
  
  Session.prototype.timeString = function(time) {
    if (this._accuracy === ACCURACY_SECONDS) {
      return window.app.formatSeconds(time);
    } else {
      return window.app.formatTime(time);
    }
  };
  
  // timerTick is called by this._timerInterval to update the timer text.
  Session.prototype.timerTick = function() {
    if (this._startTime === null) {
      throw new Error('this._startTime is null in timer');
    }
    
    // With no accuracy, the time is not shown.
    if (this._accuracy == ACCURACY_NONE) {
      window.app.view.setTime('Timing');
      return;
    }
    
    // Show the time since the beginning of the solve.
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    window.app.view.setTime(this.timeString(time));
  };
  
  // up is called when the user releases the space bar or lifts their finger.
  Session.prototype.up = function() {
    if (this._timerInterval === null && this._result === null) {
      // Start the timer.
      this._startTime = new Date().getTime();
      this._timerInterval = setInterval(this.timerTick.bind(this),
        TIME_INTERVAL);
      this.timerTick();
    } else if (this._result !== null) {
      // Callback with our result.
      if ('function' !== typeof this.onDone) {
        throw new Error('invalid this.onDone function');
      }
      this.onDone(this._result);
    } else {
      throw new Error('invalid state at this.up');
    }
  };
  
  // BLDSession is a Session subclass for MODE_BLD.
  function BLDSession(accuracy) {
    Session.call(this, accuracy);
    this._memoDown = false;
    this._memoTime = null;
  }
  
  BLDSession.prototype = Object.create(Session.prototype);
  
  // down either stops the memo time or calls the superclass's down function.
  BLDSession.prototype.down = function() {
    if (this._memoTime === null) {
      this._memoDown = true;
      this._memoTime = Math.max(new Date().getTime() - this._startTime, 0);
      window.app.view.setMemo(window.app.formatTime(this._memoTime));
    } else {
      Session.prototype.down.call(this);
    }
  };
  
  // generateSolve sets the memo time on the superclass's result.
  BLDSession.prototype.generateSolve = function() {
    var res = Session.prototype.generateSolve.call(this);
    res.memo = this._memoTime;
    return res;
  };
  
  // up calls the superclass's up function, but will ignore the event if the
  // corresponding "down" event ended memo time.
  BLDSession.prototype.up = function() {
    // If this up() corresponds to the first down(), do nothing.
    if (this._memoDown) {
      this._memoDown = false;
    } else {
      Session.prototype.up.call(this);
    }
  };
  
  // InspectionSession is a Session subclass for MODE_INSPECTION.
  function InspectionSession(accuracy) {
    Session.call(this, accuracy);
    this._downOnInspection = false;
    this._inspectionStart = null;
    this._inspectionInterval = null;
    this._inspectionTime = null;
  }
  
  InspectionSession.prototype = Object.create(Session.prototype);
  
  // begin shows the "15" text to indicate that inspection time will start.
  InspectionSession.prototype.begin = function() {
    window.app.view.setMemo(null);
    window.app.view.setTime('15');
  }
  
  // cancel stops the inspection interval and calls the superclass's cancel
  // method.
  InspectionSession.prototype.cancel = function() {
    if (this._inspectionInterval) {
      clearInterval(this._inspectionInterval);
    }
    Session.prototype.cancel.call(this);
  };
  
  // down will do nothing if inspection is active, or call to the superclass
  // otherwise.
  InspectionSession.prototype.down = function() {
    // If the inspection time is running, we make sure to note that the user hit
    // space or touched their screen while inspection was running. This way the
    // corresponding up() event doesn't stop the timer if they exceed inspection
    // time.
    if (this._inspectionTime === null) {
      this._downOnInspection = true;
      return;
    }
    
    Session.prototype.down.call(this);
  };
  
  // generateSolve calls the superclass's method and sets the "inspection" and
  // "plus2" fields on the result.
  InspectionSession.prototype.generateSolve = function() {
    var res = Session.prototype.generateSolve.call(this);
    res.inspection = this._inspectionTime;
    res.plus2 = (this._inspectionTime > 15000);
    return res;
  };
  
  // timeString returns the superclass's time string with a possible +2.
  InspectionSession.prototype.timeString = function(time) {
    if (this._inspectionTime > 15000) {
      return Session.prototype.timeString.call(this, time + 2000) +
        '+';
    }
    return Session.prototype.timeString.call(this, time);
  };
  
  InspectionSession.prototype.up = function() {
    if (this._inspectionTime !== null) {
      // If the down() event happened during inspection, the up() event should
      // do nothing.
      if (this._downOnInspection) {
        this._downOnInspection = false;
      } else {
        Session.prototype.up.call(this);
      }
    } else if (this._inspectionInterval !== null) {
      // Save the inspection time.
      var delay = new Date().getTime() - this._inspectionStart;
      this._inspectionTime = Math.max(delay, 0);
      
      // Stop the inspection interval.
      clearInterval(this._inspectionInterval);
      this._inspectionInterval = null;
      
      // Reset this state so the next up event gets processed.
      this._downOnInspection = false;
      
      // Running Session.prototype.up will start the regular timer.
      Session.prototype.up.call(this);
    } else {
      // Start inspection time.
      this._inspectionStart = new Date().getTime();
      this._inspectionInterval = setInterval(this._interval.bind(this),
        TIME_INTERVAL);
    }
  };
  
  InspectionSession.prototype._interval = function() {
    var time = Math.max(new Date().getTime() - this._inspectionStart, 0);
    if (time > 17000) {
      // Force the timer to start.
      this.up();
    } else if (time > 15000) {
      window.app.view.setTime('+2');
    } else {
      window.app.view.setTime('' + (15 - Math.floor(time / 1000)));
    }
  };
  
  function UpDown() {
    this.onCancel = null;
    this.onDown = null;
    this.onUp = null;
    this._enabled = false;
    this._down = false;
    
    window.app.keyboard.push(this);
    
    // If the device has a touchscreen, track touch events on the middle
    // element.
    if ('ontouchstart' in document) {
      var element = $(document.body);
      element.on('touchstart', this._touchDown.bind(this));
      element.on('touchend', this._touchUp.bind(this));
    }
  }
  
  UpDown.prototype.disable = function() {
    this._enabled = false;
  };
  
  UpDown.prototype.enable = function() {
    this._enabled = true;
  };
  
  UpDown.prototype.keydown = function(e) {
    // The escape key cancels the timer if possible.
    if (this._enabled && e.which === 0x1b) {
      this._down = false;
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
    
    // If we were already in the down state (for example, because of the
    // touchscreen or key repeat) we do nothing.
    if (this._down) {
      return;
    }
    this._down = true;
    
    if ('function' === typeof this.onDown) {
      this.onDown();
    }
    return false;
  };
  
  UpDown.prototype.keyup = function(e) {
    // If we were not waiting for the space bar, we allow the keyboard manager
    // to propagate the event.
    if (!this._enabled || e.which !== 0x20) {
      return true;
    }
    
    // If we were not in the down state (for example, because of the
    // touchscreen) we do nothing.
    if (!this._down) {
      return;
    }
    this._down = false;
    
    if ('function' === typeof this.onUp) {
      this.onUp();
    }
    return false;
  };
  
  UpDown.prototype._touchDown = function(e) {
    // Only accept touch events from the middle part of the page.
    var t = e.target;
    if (t !== document.body && t.id !== 'memo-time' &&
        t.id !== 'pb-status' && t.id !== 'time') {
      return;  
    }
    
    if (this._down) {
      return;
    }
    this._down = true;
    if ('function' === typeof this.onDown) {
      this.onDown();
    }
  };
  
  UpDown.prototype._touchUp = function() {
    if (!this._down) {
      return;
    }
    this._down = false;
    if ('function' === typeof this.onUp) {
      this.onUp();
    }
  };
  
  window.app.Timer = Timer;
  
})();