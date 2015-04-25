(function() {

  var SOFT_TIMEOUT = 300;

  var SCRAMBLE_LENGTHS = {
    '3x3x3  Moves': 25,
    '2x2x2  Moves': 25,
    'Skewb  Moves': 25
  };

  // ScrambleQueue queues up scrambles for the user.
  function ScrambleQueue() {
    window.app.EventEmitter.call(this);
    this._queue = {};
    this._scrambler = Scrambler.current();
    this._requestNumber = 0;
    this._scrambleRequested = false;
    this._registerModelEvents();
  }

  ScrambleQueue.prototype = Object.create(window.app.EventEmitter.prototype);

  ScrambleQueue.prototype.cancel = function() {
    this._scrambleRequested = false;
  };

  ScrambleQueue.prototype.isScrambleRequested = function() {
    return this._scrambleRequested;
  };

  ScrambleQueue.prototype.request = function() {
    if (this._scrambleRequested) {
      return;
    }
    this._scrambleRequested = true;
    this._generateScramble();
    this._attemptToShift();
  };

  ScrambleQueue.prototype.requestInBackground = function() {
    if (!this._scrambleRequested) {
      this.request();
      this.cancel();
    } else {
      this.cancel();
    }
  };
  
  ScrambleQueue.prototype._attemptToShift = function() {
    var scrambler = this._scrambler;
    var scramble = this._shiftQueue(scrambler);
    if (scramble === null) {
      return;
    }
    
    // This needs to be asynchronous because this.emit() is synchronous and the
    // caller will not expect a synchronous callback.
    var reqNum = ++this._requestNumber;
    setTimeout(function() {
      if (this._scrambleRequested && this._requestNumber === reqNum) {
        this.emit('scramble', scramble);
      } else {
        // Race condition; try to reuse the scramble later.
        this._pushQueue(scrambler, scramble);
      }
    }.bind(this), 10);
  };
  
  ScrambleQueue.prototype._generateScramble = function() {
    var reqNum = ++this._requestNumber;
    var timeout;
    timeout = setTimeout(function() {
      if (this._scrambleRequested && this._requestNumber === reqNum) {
        this.emit('softTimeout');
        timeout = null;
      }
    }.bind(this), SOFT_TIMEOUT);

    this._scrambler.generate(function(scrambler, scramble) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      if (this._scrambleRequested && this._requestNumber === reqNum) {
        this.emit('scramble', scramble);
        this._scrambleRequested = false;
      } else {
        this._pushQueue(scrambler, scramble);
      }
    }.bind(this, this._scrambler));
  };

  ScrambleQueue.prototype._handleModelChange = function() {
    var current = Scrambler.current();
    if (!current.equals(this._scrambler)) {
      this._scrambler = current;
      if (this._scrambleRequested) {
        this.cancel();
        this.request();
      } else {
        this.emit('scramblerChanged');
      }
    }
  };

  ScrambleQueue.prototype._pushQueue = function(setting, scramble) {
    var hash = setting.hash();
    var queued = this._queue[hash];
    if (!queued) {
      this._queue[hash] = [scramble];
    } else {
      queued.push(scramble);
    }
  };

  ScrambleQueue.prototype._registerModelEvents = function() {
    var handler = this._handleModelChange.bind(this);
    var events = ['remoteChange', 'modifiedPuzzle', 'switchedPuzzle'];
    for (var i = 0; i < events.length; ++i) {
      window.app.store.on(events[i], handler);
    }
  };

  ScrambleQueue.prototype._shiftQueue = function(setting) {
    var hash = setting.hash();
    if ('undefined' === typeof this._queue[hash]) {
      return null;
    } else if (this._queue[hash].length === 0) {
      return null;
    } else {
      return this._queue[hash].shift();
    }
  };

  // A Scrambler generates scrambles.
  function Scrambler(name, type) {
    this._name = name;
    this._type = type;
  }

  Scrambler.current = function() {
    var puzzle = window.app.store.getActivePuzzle();
    return new Scrambler(puzzle.scrambler, puzzle.scrambleType);
  };

  Scrambler.prototype.equals = function(s) {
    return this._name === s._name && this._type === s._type;
  };

  Scrambler.prototype.generate = function(cb) {
    if (this.isNone()) {
      setTimeout(function() {
        cb(null);
      }, 10);
      return;
    }

    var length = 0;
    var hash = this.hash();
    if (SCRAMBLE_LENGTHS.hasOwnProperty(hash)) {
      length = SCRAMBLE_LENGTHS[hash];
    }

    window.puzzlejs.webscrambler.generateScramble(this._name, this._type,
      length, cb);
  };

  Scrambler.prototype.hash = function() {
    return this._name + '  ' + this._type;
  };

  Scrambler.prototype.isNone = function() {
    return this._name === 'None';
  };

  window.app.ScrambleQueue = ScrambleQueue;

})();