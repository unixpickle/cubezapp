(function() {

  var TIME_INTERVAL = Math.ceil(1000/24);
  var BACKSPACE_KEY = 8;
  var ENTER_KEY = 13;
  var NUM0_KEY = 0x30;
  var NUM9_KEY = 0x39;
  var TOO_MUCH_INSPECTION = 17000;
  var TEMP_DISABLE_TIMEOUT = 100;

  function TimerController() {
    this._stackmat = new window.app.Stackmat();

    this._inputMode = 0;
    this._interval = null;
    this._intervalStartTime = null;
    this._inputModeChanged = true;
    this._temporarilyDisabled = false;

    this._updateInputMode();
    this._registerModelEvents();
    this._registerStackmatEvents();
    this._registerUIEvents();
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
      // Typing leading zeroes is pointless, so I ignore them.
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
      // Unknown keys should be propagated.
      return true;
    }

    return false;
  };

  TimerController.prototype.keyup = function(e) {
    // Allow the event to propagate.
    return true;
  };

  TimerController.prototype._controlCancel = function() {
    if (window.app.timer.getState() === window.app.Timer.STATE_NOT_RUNNING) {
      return;
    }
    this._stopInterval();
    window.app.timer.reset();
    this._updateInputMode();
  };

  TimerController.prototype._controlDown = function() {
    if (this._temporarilyDisabled) {
      return;
    }

    switch (window.app.timer.getState()) {
    case window.app.Timer.STATE_NOT_RUNNING:
      if (this._inputMode === window.app.Timer.INPUT_INSPECTION) {
        window.app.timer.phaseInspectionReady();
      } else {
        window.app.timer.phaseReady();
      }
      break;
    case window.app.Timer.STATE_INSPECTION:
      // NOTE: inspection keeps running until they release the spacebar or
      // lift their finger.
      break;
    case window.app.Timer.STATE_TIMING:
      window.app.timer.setTime(this._elapsedTime());
      if (this._inputMode === window.app.Timer.INPUT_BLD &&
          !window.app.timer.hasMemoTime()) {
        window.app.timer.doneMemo();
      } else {
        window.app.timer.phaseDone();
        this._stopInterval();
      }
      break;
    default:
      throw new Error('unexpected state: ' + window.app.timer.getState());
    }
  };

  TimerController.prototype._controlUp = function() {
    switch (window.app.timer.getState()) {
    case window.app.Timer.STATE_INSPECTION_READY:
      window.app.timer.phaseInspection();
      this._startInterval();
      break;
    case window.app.Timer.STATE_INSPECTION:
      window.app.timer.setInspectionTime(this._elapsedTime());
      this._stopInterval();
    case window.app.Timer.STATE_READY:
      window.app.timer.phaseTiming();
      this._startInterval();
      break;
    case window.app.Timer.STATE_DONE:
      window.app.timer.saveTime();
      window.app.timer.reset();
      this._updateInputMode();
      this._temporarilyDisabled = true;
      setTimeout(function() {
        this._temporarilyDisabled = false;
      }.bind(this), TEMP_DISABLE_TIMEOUT);
      break;
    case window.app.Timer.STATE_TIMING:
      // NOTE: this will occur if they just finished recording the memo time and
      // are now lifting their finger or releasing the spacebar.
      // This may also occur if they press space or touch the screen while
      // inspection is running, then don't release until inspection goes over
      // and forces the timer to start.
      break;
    case window.app.Timer.STATE_NOT_RUNNING:
      // NOTE: this may occur if this._temporarilyDisabled was set in
      // this._controlDown.
      break;
    default:
      throw new Error('unexpected state: ' + window.app.timer.getState());
    }
  };

  TimerController.prototype._elapsedTime = function() {
    if (this._intervalStartTime === null) {
      throw new Error('cannot get elapsed time');
    }
    return Math.max(new Date().getTime() - this._intervalStartTime, 0);
  };

  // _externalAction is called when the user clicks anywhere on the page in
  // order to notify the timer to cancel.
  TimerController.prototype._externalAction = function() {
    if (window.app.timer.getState() === window.app.Timer.STATE_NOT_RUNNING) {
      return;
    }
    if (this._inputMode === window.app.Timer.INPUT_STACKMAT) {
      this._stackmatCancel();
    } else if (this._inputMode !== window.app.Timer.INPUT_ENTRY) {
      this._controlCancel();
    }
  };

  TimerController.prototype._handleInputModeChanged = function() {
    this._inputModeChanged = true;
    if (!window.app.timer.isActive()) {
      this._updateInputMode();
    }
  };

  TimerController.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle('timerInput',
      this._handleInputModeChanged.bind(this));
  };

  TimerController.prototype._registerStackmatEvents = function() {
    this._stackmat.on('wait', this._stackmatWaiting.bind(this));
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
    window.app.view.timer.on('refreshScramble', function() {
      var stream = window.app.timer.getScrambleStream();
      stream.pause();
      stream.resume();
    });
  };

  TimerController.prototype._stackmatCancel = function() {
    window.app.timer.reset();
    this._updateInputMode();
  };

  TimerController.prototype._stackmatDone = function(t) {
    window.app.timer.phaseDone();
    window.app.timer.saveTime();
    window.app.timer.reset();
    this._updateInputMode();
  };

  TimerController.prototype._stackmatReady = function() {
    window.app.timer.phaseReady();
  };

  TimerController.prototype._stackmatTime = function(millis) {
    if (window.app.timer.getState() === window.app.Timer.STATE_READY) {
      window.app.timer.phaseTiming();
    }
    window.app.timer.setTime(millis);
  };

  TimerController.prototype._stackmatWaiting = function() {
    window.app.timer.phaseWaiting();
  };

  TimerController.prototype._startInterval = function() {
    this._intervalStartTime = new Date().getTime();
    this._interval = setInterval(function() {
      var elapsed = this._elapsedTime();
      if (window.app.timer.getState() === window.app.Timer.STATE_TIMING) {
        window.app.timer.setTime(elapsed);
      } else {
        var maxInspection = window.app.Timer.WCA_INSPECTION_TIME + 2000;
        window.app.timer.setInspectionTime(Math.min(elapsed, maxInspection));

        // If inspection runs over, force the timer to start.
        if (elapsed >= maxInspection) {
          var overInspectTime = elapsed - maxInspection;
          this._intervalStartTime = new Date().getTime() - overInspectTime;
          window.app.timer.phaseTiming();
        }
      }
    }.bind(this), TIME_INTERVAL);
  };

  TimerController.prototype._stopInterval = function() {
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
      this._intervalStartTime = null;
    }
  };

  TimerController.prototype._updateInputMode = function() {
    if (!this._inputModeChanged) {
      return;
    }

    this._inputModeChanged = false;
    this._inputMode = window.app.store.getActivePuzzle().timerInput;

    if (this._inputMode !== window.app.Timer.INPUT_STACKMAT) {
      this._stackmat.disconnect();
    } else {
      this._stackmat.connect();
    }

    if (this._inputMode === window.app.Timer.INPUT_ENTRY ||
        this._inputMode === window.app.Timer.INPUT_STACKMAT) {
      window.app.view.timer.controls.disable();
    } else {
      window.app.view.timer.controls.enable();
    }

    window.app.timer.updateInputMode();
  };

  window.app.TimerController = TimerController;

})();
