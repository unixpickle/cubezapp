(function() {

  var TIME_INTERVAL = Math.ceil(1000/24);
  var BACKSPACE_KEY = 8;
  var ENTER_KEY = 13;
  var NUM0_KEY = 0x30;
  var NUM9_KEY = 0x39;

  function TimerController() {
    this._inputMode = window.app.store.getActivePuzzle().timerInput;
    this._manualText = '';
    this._session = null;
    this._lastScramble = null;

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
    if (this._inputMode === TimerController.INPUT_ENTRY &&
        e.which === BACKSPACE_KEY) {
      this.keypress(e);
      return false;
    }
    return true;
  };

  TimerController.prototype.keypress = function(e) {
    if (this._inputMode !== TimerController.INPUT_ENTRY) {
      return true;
    }

    if (e.which === BACKSPACE_KEY) {
      this._manualText = this._manualText.substring(0,
        this._manualText.length-1);
    } else if (e.which >= NUM0_KEY && e.which <= NUM9_KEY) {
      if (this._manualText.length < 7) {
        this._manualText = this._manualText + (e.which - 0x30);
      }
    } else if (e.which === ENTER_KEY) {
      if (this._manualText.length > 0) {
        this._scramble = window.app.view.timer.currentScramble();
        this._addRegularSolve(parseManualEntry(this._manualText));
        window.app.view.timer.newScramble();
      }
      this._manualText = '';
    } else {
      // Unknown keys should be ignored.
      return true;
    }

    // There is no point of typing a leading zero.
    if (this._manualText === '0') {
      this._manualText = '';
    }

    // Give the user the authentic experience of entering text.
    window.app.view.blinkTime();
    window.app.view.setTime(formatManualEntry(this._manualText));
    return false;
  };

  TimerController.prototype.keyup = function(e) {
    // Ignore the event.
    return true;
  };

  TimerController.prototype._addRegularSolve = function(millis) {
    window.app.store.addSolve({
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: -1,
      notes: '',
      plus2: false,
      time: millis,
      scramble: this._scramble
    });
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
      case TimerController.INPUT_REGULAR:
        this._session = new Session();
        break;
      case TimerController.INPUT_BLD:
        this._session = new BLDSession();
        break;
      case TimerController.INPUT_INSPECTION:
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
    window.app.view.timer.cancel();
    this._updateInputMethodIfChanged();
  };

  TimerController.prototype._stackmatDone = function(t) {
    if (this._stackmatRunning) {
      this._stackmatRunning = false;
      window.app.view.timer.updateDone(t, false);
      window.app.store.addSolve({
        date: new Date().getTime(),
        dnf: false,
        inspection: 0,
        memo: -1,
        notes: '',
        plus2: false,
        time: t
      });
      window.app.view.timer.stop();
      this._updateInputMethodIfChanged();
    }
  };

  TimerController.prototype._stackmatReady = function() {
    if (this._stackmatRunning) {
      window.app.view.setTime('Ready');
    }
  };

  TimerController.prototype._stackmatTime = function(millis) {
    if (this._stackmatRunning) {
      window.app.view.timer.updateTime(millis);
    }
  };

  TimerController.prototype._stackmatWait = function() {
    if (!this._stackmatRunning) {
      this._stackmatRunning = true;
      this._lastScramble = window.app.view.timer.currentScramble();
      window.app.view.timer.start();
      window.app.view.setTime('Wait');
    }
  };

  TimerController.prototype._updateInputMethod = function() {
    this._inputMode = window.app.store.getActivePuzzle().timerInput;
    this._manualText = '';
    switch (this._inputMode) {
    case TimerController.INPUT_ENTRY:
      window.app.view.timer.setManualEntry(true);
      window.app.view.timer.controls.disable();
      this._manualText = '';
      window.app.view.setTime('0.00');
      break;
    case TimerController.INPUT_STACKMAT:
      window.app.view.timer.setManualEntry(false);
      this._stackmat.connect();
      window.app.view.timer.controls.disable();
      break;
    default:
      window.app.view.timer.setManualEntry(false);
      this._stackmat.disconnect();
      window.app.view.timer.controls.enable();
      break;
    }
  };

  TimerController.prototype._updateInputMethodIfChanged = function() {
    if (this._settingsChangedWhileRunning) {
      this._settingsChangedWhileRunning = false;
      this._updateInputMethod();
    }
  };

  TimerController.INPUT_REGULAR = 0;
  TimerController.INPUT_INSPECTION = 1;
  TimerController.INPUT_BLD = 2;
  TimerController.INPUT_STACKMAT = 3;
  TimerController.INPUT_ENTRY = 4;

  // A Session handles the process of recording a time using the space bar
  // or touchscreen.
  // This is a base class and can only be used for MODE_REGULAR.
  function Session() {
    window.app.EventEmitter.call(this);
    this._result = null;
    this._startTime = null;
    this._timerInterval = null;
    this._scramble = window.app.view.timer.currentScramble();
  }

  Session.prototype = Object.create(window.app.EventEmitter.prototype);

  // begin is called right after the object is constructed.
  Session.prototype.begin = function() {
    window.app.view.timer.start();
  };

  // cancel stops the session prematurely.
  Session.prototype.cancel = function() {
    window.app.view.timer.cancel();
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

    this._result = this.generateSolve();
    clearInterval(this._timerInterval);
    this._timerInterval = null;

    window.app.view.timer.updateDone(this._result.time, this._result.plus2);
  };

  // generateSolve is called when the timer is stopped in order to get a usable
  // record to store in a database.
  Session.prototype.generateSolve = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    return {
      date: new Date().getTime(),
      dnf: false,
      inspection: 0,
      memo: -1,
      notes: '',
      plus2: false,
      time: time,
      scramble: this._scramble
    };
  };

  // timerTick is called by this._timerInterval to update the timer text.
  Session.prototype.timerTick = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    window.app.view.timer.update(time, false);
  };

  // up is called when the user releases the space bar or lifts their finger.
  Session.prototype.up = function() {
    if (this._timerInterval === null && this._result === null) {
      this._startTimer();
    } else if (this._result !== null) {
      this._done();
    } else {
      throw new Error('invalid state at up()');
    }
  };

  Session.prototype._done = function() {
    window.app.store.addSolve(this._result);
    window.app.view.timer.stop();
    this.emit('done');
  };

  Session.prototype._startTimer = function() {
    this._startTime = new Date().getTime();
    this._timerInterval = setInterval(this.timerTick.bind(this),
      TIME_INTERVAL);
    this.timerTick();
  };

  // BLDSession is a Session subclass for MODE_BLD.
  function BLDSession(accuracy) {
    Session.call(this, accuracy);
    this._memoDown = false;
    this._memoTime = null;
  }

  BLDSession.prototype = Object.create(Session.prototype);

  BLDSession.prototype.down = function() {
    if (this._memoTime === null) {
      this._memoDown = true;
      this._memoTime = Math.max(new Date().getTime() - this._startTime, 0);
      window.app.view.timer.updateMemo(this._memoTime);
    } else {
      Session.prototype.down.call(this);
    }
  };

  BLDSession.prototype.generateSolve = function() {
    var res = Session.prototype.generateSolve.call(this);
    res.memo = this._memoTime;
    return res;
  };

  BLDSession.prototype.up = function() {
    // If this up() corresponds to the first down(), it shouldn't do anything.
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

  InspectionSession.prototype.begin = function() {
    Session.prototype.begin.call(this);
    window.app.view.timer.updateInspection('15');
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
    if (this._inspectionTime === null) {
      this._downOnInspection = true;
    } else {
      Session.prototype.down.call(this);
    }
  };

  InspectionSession.prototype.generateSolve = function() {
    var res = Session.prototype.generateSolve.call(this);
    res.inspection = this._inspectionTime;
    res.plus2 = (this._inspectionTime > 15000);
    return res;
  };

  InspectionSession.prototype.timerTick = function() {
    var time = Math.max(new Date().getTime() - this._startTime, 0);
    window.app.view.timer.update(time, this._inspectionTime > 15000);
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
      this._endInspection();
      this._downOnInspection = false;
    } else {
      this._beginInspection();
    }
  };

  InspectionSession.prototype._beginInspection = function() {
    this._inspectionStart = new Date().getTime();
    this._inspectionInterval = setInterval(this._interval.bind(this),
      TIME_INTERVAL);
  };

  InspectionSession.prototype._endInspection = function() {
    var delay = new Date().getTime() - this._inspectionStart;
    this._inspectionTime = Math.max(delay, 0);

    clearInterval(this._inspectionInterval);
    this._inspectionInterval = null;

    // Running Session.prototype.up will start the regular timer.
    Session.prototype.up.call(this);
  };

  InspectionSession.prototype._interval = function() {
    var time = Math.max(new Date().getTime() - this._inspectionStart, 0);
    if (time > 17000) {
      this._endInspection();
    } else {
      window.app.view.timer.updateInspection(time);
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

  // parseManualEntry takes the raw user input and turns it into a time in
  // milliseconds. For example, parseTimeInput('123') yields 1230.
  function parseManualEntry(raw) {
    // Pad the time with zeroes so we can use substrings without fear.
    var toParse = raw;
    while (toParse.length < 7) {
      toParse = '0' + toParse;
    }

    // Get the time components.
    var hour = parseInt(toParse[0]);
    var minute = parseInt(toParse.substring(1, 3));
    var second = parseInt(toParse.substring(3, 5));
    var centisecond = parseInt(toParse.substring(5));

    // Generate milliseconds and cap it at 9:59:59.99
    var millis = centisecond*10 + second*1000 + minute*60000 + hour*3600000;
    return Math.min(millis, 35999990);
  }

  window.app.TimerController = TimerController;

})();
