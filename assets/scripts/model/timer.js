(function() {

  function Timer() {
    window.app.EventEmitter.call(this);

    this._scrambleStream = new window.app.ScrambleStream();

    // Create the hidden class. Performance is critical whenever the user's
    // times are concerned, so we don't want V8 or any other JS engine messing
    // with us.
    this._state = Timer.STATE_NOT_RUNNING;
    this._manualTime = '';
    this._time = -1;
    this._memoTime = -1;
    this._inspectionTime = -1;
    this._didSave = false;

    this.updateInputMethod();
  }

  Timer.prototype = Object.create(window.app.EventEmitter.prototype);

  Timer.INPUT_REGULAR = 0;
  Timer.INPUT_INSPECTION = 1;
  Timer.INPUT_BLD = 2;
  Timer.INPUT_STACKMAT = 3;
  Timer.INPUT_ENTRY = 4;

  Timer.STATE_NOT_RUNNING = 0;
  Timer.STATE_MANUAL_ENTRY = 1;
  Timer.STATE_WAITING = 2;
  Timer.STATE_INSPECTION_READY = 3;
  Timer.STATE_INSPECTION = 4;
  Timer.STATE_READY = 5;
  Timer.STATE_TIMING = 6;
  Timer.STATE_TIMING_DONE_MEMO = 7;
  Timer.STATE_DONE = 8;
  
  Timer.WCA_INSPECTION_TIME = 15000;

  Timer.prototype.getManualTime = function() {
    return this._manualTime;
  };

  Timer.prototype.getMemoTime = function() {
    return this._memoTime;
  };

  Timer.prototype.getPlus2 = function() {
    return this._inspectionTime > Timer.WCA_INSPECTION_TIME;
  };

  Timer.prototype.getScrambleStream = function() {
    return this._scrambleStream;
  };

  Timer.prototype.getState = function() {
    return this._state;
  };

  Timer.prototype.getTime = function() {
    return this._time;
  };

  Timer.prototype.phaseDone = function() {
    this._assertStates([Timer.STATE_TIMING, Timer.STATE_TIMING_DONE_MEMO]);
    this._state = Timer.STATE_DONE;
  };

  Timer.prototype.phaseDoneMemo = function() {
    this._assertState(Timer.STATE_TIMING);
    this._memoTime = this._time;
    this._state = Timer.STATE_TIMING_DONE_MEMO;
    this.emit('doneMemo');
  };

  Timer.prototype.phaseInspection = function() {
    this._assertState(Timer.STATE_INSPECTION_READY);
    this._state = Timer.STATE_INSPECTION;
    this.emit('inspection');
  };

  Timer.prototype.phaseInspectionReady = function() {
    this._assertState(Timer.STATE_NOT_RUNNING);
    this._state = Timer.STATE_INSPECTION_READY;
    this._scrambleStream.pause();
    this._time = 0;
    this.emit('inspectionReady');
  };

  Timer.prototype.phaseReady = function() {
    this._assertStates([Timer.STATE_WAITING, Timer.STATE_NOT_RUNNING]);
    this._state = Timer.STATE_READY;
    this._scrambleStream.pause();
    this._time = 0;
    this.emit('ready');
  };

  Timer.prototype.phaseTiming = function() {
    this._assertState(Timer.STATE_READY);
    this._state = Timer.STATE_TIMING;
    this.emit('timing');
  };

  Timer.prototype.phaseWaiting = function() {
    this._assertState(Timer.STATE_NOT_RUNNING);
    this._state = Timer.STATE_WAITING;
    this._scrambleStream.pause();
    this._time = 0;
    this.emit('waiting');
  };

  Timer.prototype.reset = function() {
    if (window.app.store.getActivePuzzle().timerInput === Timer.INPUT_ENTRY) {
      this._state = Timer.STATE_MANUAL_ENTRY;
    } else {
      this._state = Timer.STATE_NOT_RUNNING;
    }

    this._manualTime = '';
    this._time = -1;
    this._memoTime = -1;
    this._inspectionTime = -1;
    
    // NOTE: we do this before emitting 'reset' because the reset handler could
    // theoretically do something to pause the scramble stream.
    if (this._didSave) {
      this._scrambleStream.resume();
      this._didSave = false;
    } else {
      this._scrambleStream.resumeReuseScramble();
    }

    this.emit('reset');
  };

  // saveTime adds a solve to the store which reflects the current state of the
  // timer.
  Timer.prototype.saveTime = function() {
    this._didSave = true;

    var time = 0;
    if (this._state === Timer.STATE_MANUAL_ENTRY) {
      time = parseManualEntry(this._manualTime);
    } else {
      time = this._time;
    }

    window.app.store.addSolve({
      date: new Date().getTime(),
      dnf: false,
      inspection: this._inspectionTime,
      memo: this._memoTime,
      notes: '',
      plus2: this.getPlus2(),
      time: time,
      scramble: 'No scrambles yet'
    });
  };

  // setManualTime sets a string which represents the numbers the user has
  // entered thus far. This cannot be a number because the user may enter a time
  // in a number of ways (i.e. 90.00 vs 1:30.00).
  Timer.prototype.setManualTime = function(str) {
    this._assertState(Timer.STATE_MANUAL_ENTRY);
    this._manualTime = str;
    this.emit('manualTime');
  }

  // setTime sets the time. This will have a different meaning depending on the
  // current state. If the timer is in inspection mode, this will set the amount
  // of inspection time that has been used so far. If it is in timing mode, it
  // will set the amount of time elapsed.
  Timer.prototype.setTime = function(time) {
    this._assertStates([Timer.STATE_TIMING, Timer.STATE_TIMING_DONE_MEMO,
      Timer.STATE_INSPECTION]);
    this._time = time;
    this.emit('time');
  };

  Timer.prototype.updateInputMethod = function() {
    this._assertStates([Timer.STATE_NOT_RUNNING, Timer.STATE_MANUAL_ENTRY]);
    var oldState = this._state;
    if (window.app.store.getActivePuzzle().timerInput === Timer.INPUT_ENTRY) {
      this._state = Timer.STATE_MANUAL_ENTRY;
    } else {
      this._state = Timer.STATE_NOT_RUNNING;
    }
    if (oldState !== this._state) {
      this.emit('reset');
    }
  };

  Timer.prototype._assertState = function(state) {
    if (this._state !== state) {
      throw new Error('invalid state: ' + state);
    }
  };

  Timer.prototype._assertStates = function(states) {
    if (states.indexOf(this._state) < 0) {
      throw new Error('invalid state: ' + state);
    }
  };

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

  window.app.Timer = Timer;

})();
