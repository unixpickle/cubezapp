(function() {

  var TIME_INTERVAL = Math.ceil(1000/24);
  var BACKSPACE_KEY = 8;
  var ENTER_KEY = 13;
  var NUM0_KEY = 0x30;
  var NUM9_KEY = 0x39;
  var TOO_MUCH_INSPECTION = 17000;

  function TimerController() {
    this._inputMode = window.app.store.getActivePuzzle().timerInput;
    this._session = null;
    this._stackmatRunning = false;
    this._stackmat = new window.app.Stackmat();

    this._settingsChangedWhileRunning = false;

    this._registerModelEvents();
    this._registerStackmatEvents();
    this._registerUIEvents();
    this._updateInputMethod();
  }

  TimerController.prototype.keydown = function(e) {
    // Forward backspace to this.keypress().
    if (this._inputMode === window.app.Timer.INPUT_ENTRY &&
        e.which === BACKSPACE_KEY) {
      return this.keypress(e);
    }
    return true;
  };

  TimerController.prototype.keypress = function(e) {
    if (this._inputMode !== window.app.Timer.INPUT_ENTRY) {
      return true;
    }

    if (e.which === BACKSPACE_KEY) {
      var oldTime = window.app.timer.getManualTime();
      window.app.timer.setManualTime(oldTime.substring(0, oldTime.length-1));
    } else if (e.which >= NUM0_KEY && e.which <= NUM9_KEY) {
      var oldTime = window.app.timer.getManualTime();
      // NOTE: typing leading zeroes is pointless, so I ignore them.
      if ((oldTime.length !== 0 || e.which !== NUM0_KEY) &&
          oldTime.length < 7) {
        window.app.timer.setManualTime(oldTime + (e.which - 0x30));
      }
    } else if (e.which === ENTER_KEY) {
      if (window.app.timer.getManualTime().length > 0) {
        window.app.timer.saveTime();
        window.app.timer.reset();
      }
    } else {
      // Unknown keys should be ignored.
      return true;
    }

    return false;
  };

  TimerController.prototype.keyup = function(e) {
    // Ignore the event.
    return true;
  };

  TimerController.prototype._controlCancel = function() {
    if (this._session === null) {
      return;
    }
    this._session.cancel();
    this._session = null;
    this._updateInputMethodIfChanged();
  };

  TimerController.prototype._controlDown = function() {
    if (this._session !== null) {
      this._session.down();
    } else {
      switch (this._inputMode) {
      case window.app.Timer.INPUT_REGULAR:
        this._session = new Session();
        break;
      case window.app.Timer.INPUT_BLD:
        this._session = new BLDSession();
        break;
      case window.app.Timer.INPUT_INSPECTION:
        this._session = new InspectionSession();
        break;
      default:
        break;
      }
      this._session.on('done', this._sessionDone.bind(this));
      this._session.begin();
    }
  };

  TimerController.prototype._controlUp = function() {
    if (this._session !== null) {
      this._session.up();
    }
  };

  TimerController.prototype._externalAction = function() {
    this._controlCancel();
    this._stackmatCancel();
  };

  TimerController.prototype._handleInputChanged = function() {
    if (this._session || this._stackmatRunning) {
      this._settingsChangedWhileRunning = true;
    } else {
      this._updateInputMethod();
    }
  };

  TimerController.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle('timerInput',
      this._handleInputChanged.bind(this));
  };

  TimerController.prototype._registerStackmatEvents = function() {
    this._stackmat.on('wait', this._stackmatWait.bind(this));
    this._stackmat.on('ready', this._stackmatReady.bind(this));
    this._stackmat.on('time', this._stackmatTime.bind(this));
    this._stackmat.on('done', this._stackmatDone.bind(this));
    this._stackmat.on('cancel', this._stackmatCancel.bind(this));
  };

  TimerController.prototype._registerUIEvents = function() {
    $('#header, #footer, #puzzles').click(this._externalAction.bind(this));
    window.app.keyboard.push(this);
    window.app.view.timer.controls.on('up', this._controlUp.bind(this));
    window.app.view.timer.controls.on('down', this._controlDown.bind(this));
    window.app.view.timer.controls.on('cancel', this._controlCancel.bind(this));
  };

  TimerController.prototype._sessionDone = function(result) {
    this._session = null;
    this._updateInputMethodIfChanged();
  };

  TimerController.prototype._stackmatCancel = function() {
    if (!this._stackmatRunning) {
      return;
    }
    this._stackmatRunning = false;
    window.app.timer.reset();
    this._updateInputMethodIfChanged();
  };

  TimerController.prototype._stackmatDone = function(t) {
    if (this._stackmatRunning) {
      this._stackmatRunning = false;
      window.app.timer.done();
      window.app.timer.saveTime();
      window.app.timer.reset();
      this._updateInputMethodIfChanged();
    }
  };

  TimerController.prototype._stackmatReady = function() {
    if (this._stackmatRunning) {
      window.app.timer.phaseReady();
    }
  };

  TimerController.prototype._stackmatTime = function(millis) {
    if (this._stackmatRunning) {
      if (window.app.timer.getState() === window.app.Timer.STATE_READY) {
        window.app.timer.phaseTiming();
      }
      window.app.timer.setTime(millis);
    }
  };

  TimerController.prototype._stackmatWait = function() {
    if (!this._stackmatRunning) {
      this._stackmatRunning = true;
      window.app.timer.phaseWaiting();
    }
  };

  TimerController.prototype._updateInputMethod = function() {
    this._inputMode = window.app.store.getActivePuzzle().timerInput;

    switch (this._inputMode) {
    case window.app.Timer.INPUT_ENTRY:
      this._stackmat.disconnect();
      window.app.view.timer.controls.disable();
      break;
    case window.app.Timer.INPUT_STACKMAT:
      this._stackmat.connect();
      window.app.view.timer.controls.disable();
      break;
    default:
      this._stackmat.disconnect();
      window.app.view.timer.controls.enable();
      break;
    }

    window.app.timer.updateInputMethod();
  };

  TimerController.prototype._updateInputMethodIfChanged = function() {
    if (this._settingsChangedWhileRunning) {
      this._settingsChangedWhileRunning = false;
      this._updateInputMethod();
    }
  };

  // A Session handles the process of recording a time using the space bar
  // or touchscreen.
  // This is a base class and can only be used for MODE_REGULAR.
  function Session() {
    window.app.EventEmitter.call(this);
    this._startTime = null;
    this._timerInterval = null;
  }

  Session.prototype = Object.create(window.app.EventEmitter.prototype);

  // begin is called right after the object is constructed.
  Session.prototype.begin = function() {
    window.app.timer.phaseReady();
  };

  // cancel stops the session prematurely.
  Session.prototype.cancel = function() {
    window.app.timer.reset();
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
    window.app.timer.phaseDone();
    clearInterval(this._timerInterval);
    this._timerInterval = null;
  };

  // timerTick is called by this._timerInterval to update the timer text.
  Session.prototype.timerTick = function() {
    var time = Math.max(new Date().getTime()-this._startTime, 0);
    window.app.timer.setTime(time);
  };

  // up is called when the user releases the space bar or lifts their finger.
  Session.prototype.up = function() {
    if (this._startTime === null) {
      this._startTimer();
    } else {
      this._done();
    }
  };

  Session.prototype._done = function() {
    window.app.timer.saveTime();
    window.app.timer.reset();
    this.emit('done');
  };

  Session.prototype._startTimer = function() {
    this._startTime = new Date().getTime();
    this._timerInterval = setInterval(this.timerTick.bind(this),
      TIME_INTERVAL);
    window.app.timer.phaseTiming();
    this.timerTick();
  };

  // BLDSession is a Session subclass for MODE_BLD.
  function BLDSession(accuracy) {
    Session.call(this, accuracy);
    this._memoDown = false;
  }

  BLDSession.prototype = Object.create(Session.prototype);

  BLDSession.prototype.down = function() {
    if (window.app.timer.hasMemoTime()) {
      Session.prototype.down.call(this);
    } else {
      this._memoDown = true;

      // Need to do this.timerTick() to make sure the memo time is as accurate
      // as possible.
      this.timerTick();

      window.app.timer.doneMemo();
    }
  };

  BLDSession.prototype.up = function() {
    // If this up() corresponds to the first down(), it shouldn't do anything.
    if (this._memoDown) {
      this._memoDown = false;
    } else {
      Session.prototype.up.call(this);
    }
  };

  // InspectionSession is a Session subclass for inspection mode.
  function InspectionSession(accuracy) {
    Session.call(this, accuracy);
    this._downOnInspection = false;
    this._inspectionStart = null;
    this._inspectionInterval = null;
  }

  InspectionSession.prototype = Object.create(Session.prototype);

  InspectionSession.prototype.begin = function() {
    window.app.timer.phaseInspectionReady();
  }

  InspectionSession.prototype.cancel = function() {
    if (this._inspectionInterval) {
      clearInterval(this._inspectionInterval);
    }
    Session.prototype.cancel.call(this);
  };

  InspectionSession.prototype.down = function() {
    // If the inspection time is running, we make sure to note that the user hit
    // space or touched their screen while inspection was running. This way the
    // corresponding up() event doesn't stop the timer if they exceed inspection
    // time.
    if (window.app.timer.getState() === window.app.Timer.STATE_INSPECTION) {
      this._downOnInspection = true;
    } else {
      Session.prototype.down.call(this);
    }
  };

  InspectionSession.prototype.up = function() {
    if (window.app.timer.getState() === window.app.Timer.STATE_TIMING) {
      // If the down() event happened during inspection, the up() event should
      // do nothing.
      if (this._downOnInspection) {
        this._downOnInspection = false;
      } else {
        Session.prototype.up.call(this);
      }
    } else if (this._inspectionInterval !== null) {
      this._endInspection();
      this._downOnInspection = false;
    } else if (window.app.timer.getState() === window.app.Timer.STATE_DONE) {
      Session.prototype.up.call(this);
    } else {
      this._beginInspection();
    }
  };

  InspectionSession.prototype._beginInspection = function() {
    this._inspectionStart = new Date().getTime();
    this._inspectionInterval = setInterval(this._interval.bind(this),
      TIME_INTERVAL);
    window.app.timer.phaseInspection();
  };

  InspectionSession.prototype._endInspection = function() {
    var delay = new Date().getTime() - this._inspectionStart;
    window.app.timer.setInspectionTime(Math.min(Math.max(delay, 0),
      TOO_MUCH_INSPECTION));

    clearInterval(this._inspectionInterval);
    this._inspectionInterval = null;

    // Running super.up() will start the regular timer.
    Session.prototype.up.call(this);
  };

  InspectionSession.prototype._interval = function() {
    var time = Math.max(new Date().getTime()-this._inspectionStart, 0);
    if (time > TOO_MUCH_INSPECTION) {
      this._endInspection();
    } else {
      window.app.timer.setInspectionTime(time);
    }
  };

  window.app.TimerController = TimerController;

})();
