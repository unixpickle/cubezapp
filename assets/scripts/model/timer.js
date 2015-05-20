(function() {

  var INSPECTION_THRESHOLD = -2000;
  var UPDATE_INTERVAL = Math.floor(1000 / 24);
  var WCA_INSPECTION_TIME = 15000;

  function Timer() {
    window.app.EventEmitter.call(this);

    // Create the hidden class before calling this.reset().
    this._updateInterval = null;
    this._state = Timer.STATE_NOT_RUNNING;
    this._startTime = 0;
    this._deviceTime = 0;
    this._manualTime = 0;
    this._memoTime = -1;
    this._totalTime = 0;
    this._inspectionTime = 0;

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
  Timer.STATE_DEVICE_TIMING = 8;
  Timer.STATE_DONE = 9;

  Timer.prototype.deviceTiming = function(time) {
    this._assertStates([Timer.STATE_READY, Timer.STATE_DEVICE_TIMING]);
    this._state = Timer.STATE_DEVICE_TIMING;
    this._deviceTime = time;
    this.emit('deviceTiming');
  };

  Timer.prototype.done = function() {
    this._assertStates([Timer.STATE_TIMING, Timer.STATE_DEVICE_TIMING]);
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
    if (this._state === Timer.STATE_TIMING) {
      this._totalTime = this.getTime();
    } else {
      this._totalTime = this.getDeviceTime();
    }
  };

  Timer.prototype.doneMemo = function() {
    this._assertState(Timer.STATE_TIMER);
    this._state = STATE_TIMING_DONE_MEMO;
    this._memoTime = this.getTime();
    this.emit('doneMemo');
  };

  Timer.prototype.generateSolve = function() {
    // TODO: here, have an actual scramble.
    return {
      date: new Date().getTime(),
      dnf: false,
      inspection: this._inspectionTime,
      memo: this._memoTime,
      notes: '',
      plus2: false,
      time: this._totalTime,
      scramble: 'No scrambles yet'
    };
  };

  Timer.prototype.getDeviceTime = function() {
    return this._deviceTime;
  };

  Timer.prototype.getInspectionTime = function() {
    switch (this._state) {
    case Timer.STATE_INSPECTION:
      var elapsed = new Date().getTime() - this._startTime;
      return WCA_INSPECTION_TIME - elapsed;
    case Timer.STATE_DONE:
      return this._inspectionTime;
    default:
      return 0;
    }
  };

  Timer.prototype.getManualTime = function() {
    return this._manualTime;
  };

  Timer.prototype.getState = function() {
    return this._state;
  };

  Timer.prototype.getTime = function() {
    switch (this._state) {
    case Timer.STATE_TIMING:
    case Timer.STATE_TIMING_AFTER_MEMO:
      return new Date().getTime() - this._startTime;
    case Timer.STATE_DONE:
      return this._totalTime;
    default:
      return 0;
    }
  };

  Timer.prototype.inspection = function() {
    this._assertState(Timer.STATE_INSPECTION_READY);

    this._startTime = new Date().getTime();
    this._updateInterval = setInterval(function() {
      if (this.getInspectionTime() < INSPECTION_THRESHOLD) {
        this.timing();
      } else {
        this.emit('inspection');
      }
    }.bind(this), UPDATE_INTERVAL);

    this._state = Timer.STATE_INSPECTION;
    this.emit('inspection');
  };

  Timer.prototype.inspectionReady = function() {
    this._assertState(Timer.STATE_NOT_RUNNING);
    this._state = Timer.STATE_INSPECTION_READY;
    this.emit('inspectionReady');
  };

  Timer.prototype.manualTime = function(time) {
    this._assertState(Timer.STATE_MANUAL_ENTRY);
    this._manualTime = time;
    this.emit('manualTime');
  };

  Timer.prototype.ready = function() {
    this._assertStates([Timer.STATE_NOT_RUNNING, Timer.STATE_WAITING]);
    this._state = Timer.STATE_READY;
    this.emit('ready');
  };

  Timer.prototype.reset = function() {
    if (window.app.store.getActivePuzzle().timerInput === Timer.INPUT_ENTRY) {
      this._state = Timer.STATE_MANUAL_ENTRY;
    } else {
      this._state = Timer.STATE_NOT_RUNNING;
    }
    this._startTime = 0;
    this._deviceTime = 0;
    this._manualTime = 0;
    this._memoTime = -1;
    this._totalTime = 0;
    this._inspectionTime = 0;
    this.emit('reset');
  };

  Timer.prototype.timing = function() {
    this._assertStates([Timer.STATE_INSPECTION, Timer.STATE_READY]);

    if (this._updateInterval !== null) {
      clearInterval(this._updateInterval);
    }

    var now = new Date().getTime();

    if (this._state === Timer.STATE_INSPECTION) {
      this._inspectionTime = now - this._startTime;
    }

    this._startTime = now;
    this._state = Timer.STATE_TIMING;
    this.emit('timing');

    this._updateInterval = setInterval(this.emit.bind(this, 'timing'),
      UPDATE_INTERVAL);
  };

  Timer.prototype.waiting = function() {
    this._assertState(Timer.STATE_NOT_RUNNING);
    this._state = Timer.STATE_WAITING;
    this.emit('waiting');
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
