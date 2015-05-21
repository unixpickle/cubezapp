(function() {

  var INSPECTION_THRESHOLD = -2000;
  var UPDATE_INTERVAL = Math.floor(1000 / 24);
  var WCA_INSPECTION_TIME = 15000;

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

    // NOTE: we set this._didSave to true so that reset() uses a new scramble.
    this._didSave = true;

    this.reset();
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

  Timer.prototype.getManualTime = function() {
    return this._manualTime;
  };

  Timer.prototype.getMemoTime = function() {
    return this._memoTime;
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
    this._assertStates([Timer.STATE_DONE, Timer.STATE_MANUAL_ENTRY]);
    if (window.app.store.getActivePuzzle().timerInput === Timer.INPUT_ENTRY) {
      this._state = Timer.STATE_MANUAL_ENTRY;
    } else {
      this._state = Timer.STATE_NOT_RUNNING;
    }
    this._manualTime = '';
    this._time = -1;
    this._memoTime = -1;
    this._inspectionTime = -1;
    this.emit('reset');

    if (this._didSave) {
      this._scrambleStream.resume();
      this._didSave = false;
    } else {
      this._scrambleStream.resumeReuseScramble();
    }
  };

  // saveTime adds a solve to the store which reflects the current state of the
  // timer.
  Timer.prototype.saveTime = function() {
    this._didSave = true;
    window.app.store.addSolve({
      date: new Date().getTime(),
      dnf: false,
      inspection: this._inspectionTime,
      memo: this._memoTime,
      notes: '',
      plus2: (this._inspectionTime > WCA_INSPECTION_TIME),
      time: this._time,
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

})();
