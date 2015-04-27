(function() {

  var SOFT_TIMEOUT = 300;
  var QUEUE_SIZE = 5;

  var SCRAMBLE_LENGTHS = {
    '3x3x3  Moves': 25,
    '2x2x2  Moves': 25,
    'Skewb  Moves': 25
  };

  // A ScrambleStream generates scrambles for the current puzzle.
  function ScrambleStream() {
    window.app.EventEmitter.call(this);

    this._generatingScramble = false;
    this._needScramble = false;
    this._queue = new ScrambleQueue();
    this._paused = true;

    this._lastEmittedScramble = null;

    this._currentScrambler = Scrambler.current();
    this._currentPuzzleId = window.app.store.getActivePuzzle().id;

    this._registerModelEvents();
  }

  ScrambleStream.prototype = Object.create(window.app.EventEmitter.prototype);

  ScrambleStream.prototype.pause = function() {
    this._paused = true;
    this._needScramble = false;
  };

  ScrambleStream.prototype.resume = function() {
    this._paused = false;
    this._generateOrDequeue();
  };

  ScrambleStream.prototype.resumeReuseScramble = function() {
    this._paused = false;
    this._replenishQueue();
    this.emit(this._lastEmittedScramble);
  };

  ScrambleStream.prototype._emitScramble = function(scramble) {
    this._lastEmittedScramble = scramble;
    this.emit('scramble', scramble);
  }

  ScrambleStream.prototype._generateOrDequeue = function() {
    var shifted = this._queue.shift(this._currentScrambler);
    if (shifted !== null) {
      this._needScramble = false;
      this._emitScramble(shifted);
    } else {
      this._needScramble = true;
    }
    this._replenishQueue();
  };

  ScrambleStream.prototype._modelChanged = function() {
    var scrambler = Scrambler.current();
    var puzzleId = window.app.store.getActivePuzzle().id;
    if (!scrambler.equals(this._currentScrambler) ||
        this._currentPuzzleId !== puzzleId) {
      this._currentScrambler = scrambler;
      this._currentPuzzleId = puzzleId;
      if (this._paused) {
        this._replenishQueue();
      } else {
        this._generateOrDequeue();
      }
    }
  };

  ScrambleStream.prototype._registerModelEvents = function() {
    var handler = this._modelChanged.bind(this);
    var events = ['remoteChange', 'switchedPuzzle', 'modifiedPuzzle',
      'addedPuzzle'];
    for (var i = 0; i < events.length; ++i) {
      window.app.store.on(events[i], handler);
    }
  };

  ScrambleStream.prototype._replenishQueue = function() {
    if (this._generatingScramble || this._queueHasEnough()) {
      return;
    }
    this._generatingScramble = true;

    var scrambler = this._currentScrambler;
    var timeout;
    timeout = setTimeout(function() {
      if (this._currentScrambler === scrambler && this._needScramble) {
        this.emit('softTimeout');
      }
      timeout = null;
    }.bind(this), SOFT_TIMEOUT);

    scrambler.generate(function(scramble) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      this._generatingScramble = false;
      if (this._currentScrambler !== scrambler || !this._needScramble) {
        this._queue.push(scrambler, scramble);
      } else {
        this._needScramble = false;
        this._emitScramble(scramble);
      }
      this._replenishQueue();
    }.bind(this));
  };

  ScrambleStream.prototype._queueHasEnough = function() {
    return this._queue.count(this._currentScrambler) >= QUEUE_SIZE;
  };

  // A ScrambleQueue can queue up scrambles for each scramble type.
  function ScrambleQueue() {
    this._queue = {};
    this._load();
    this._registerStorageEvents();
  }

  ScrambleQueue.prototype.count = function(scrambler) {
    var hash = scrambler.hash();
    if (this._queue[hash]) {
      return this._queue[hash].length;
    }
    return 0;
  };

  ScrambleQueue.prototype.push = function(scrambler, scramble) {
    var hash = scrambler.hash();
    var queued = this._queue[hash];
    if (!queued) {
      this._queue[hash] = [scramble];
    } else {
      queued.push(scramble);
    }
    this._save();
  }

  ScrambleQueue.prototype.shift = function(scrambler) {
    var hash = scrambler.hash();
    if ('undefined' === typeof this._queue[hash]) {
      return null;
    } else if (this._queue[hash].length === 0) {
      return null;
    } else {
      var res = this._queue[hash].shift();
      this._save();
      return res;
    }
  };

  ScrambleQueue.prototype._load = function() {
    if (localStorage.scrambleQueue) {
      this._queue = JSON.parse(localStorage.scrambleQueue);
    } else {
      this._save();
    }
  };

  ScrambleQueue.prototype._registerStorageEvents = function() {
    var handler = this._storageChanged.bind(this);
    if (window.addEventListener) {
      window.addEventListener('storage', handler, false);
    } else {
      window.attachEvent('onstorage', handler);
    }
  };

  ScrambleQueue.prototype._save = function() {
    try {
      localStorage.scrambleQueue = JSON.stringify(this._queue);
    } catch (e) {
    }
  };

  ScrambleQueue.prototype._storageChanged = function() {
    this._queue = JSON.parse(localStorage.scrambleQueue);
  };

  // A Scrambler generates scrambles of a specific type.
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

  window.app.ScrambleStream = ScrambleStream;

})();
