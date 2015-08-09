(function() {

  var SOFT_TIMEOUT = 300;
  var QUEUE_SIZE = 5;

  var SCRAMBLE_LENGTHS = {
    '3x3x3  Moves': 25,
    '2x2x2  Moves': 25,
    'Skewb  Moves': 25,
    '4x4x4  WCA Moves': 40,
    '5x5x5  WCA Moves': 60,
    '6x6x6  WCA Moves': 80,
    '7x7x7  WCA Moves': 100,
    'Megaminx  Moves': 77
  };
  
  var DONT_QUEUE_SCRAMBLERS = [
    'Megaminx  Moves'
  ];

  // A ScrambleStream generates scrambles for the current puzzle. It emits these
  // scrambles in a stream-like fashion, making it easy to get new scrambles as
  // needed.
  function ScrambleStream() {
    window.app.EventEmitter.call(this);

    this._generatingScramble = false;
    this._needScramble = false;
    this._queue = new ScrambleQueue();
    this._paused = true;

    this._lastEmittedScrambleRighty = null;
    this._lastEmittedScramble = null;
    this._lastEmittedScrambler = null;
    this._lastEmittedScrambleType = null;
    this._currentScrambler = Scrambler.current();

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
    this.emit('scramble', this._lastEmittedScramble, this._lastEmittedScrambler,
      this._lastEmittedScrambleType);
  };

  ScrambleStream.prototype._emitScramble = function(rightyScramble) {
    this._lastEmittedScrambleRighty = rightyScramble;
    this._lastEmittedScrambler = this._currentScrambler.getName();
    this._lastEmittedScrambleType = this._currentScrambler.getType();

    if (!window.app.store.getGlobalSettings().righty &&
        this._currentScrambler.differentForLefty()) {
      this._lastEmittedScramble =
        this._currentScrambler.makeLefty(rightyScramble);
    } else {
      this._lastEmittedScramble = rightyScramble;
    }

    this.emit('scramble', this._lastEmittedScramble,
      this._lastEmittedScrambler, this._lastEmittedScrambleType);
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
    var current = Scrambler.current();
    if (current.equals(this._currentScrambler)) {
      return;
    }
    this._currentScrambler = current;
    if (this._paused) {
      this._replenishQueue();
    } else {
      this._generateOrDequeue();
    }
  };

  ScrambleStream.prototype._queueHasEnough = function() {
    return this._queue.count(this._currentScrambler) >= QUEUE_SIZE;
  };

  ScrambleStream.prototype._registerModelEvents = function() {
    window.app.observe.activePuzzle(['id', 'scrambler', 'scrambleType'],
      this._modelChanged.bind(this));
    window.app.observe.globalSettings('righty', this._rightyChanged.bind(this));
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

  ScrambleStream.prototype._rightyChanged = function() {
    if (!this._paused && !this._needScramble &&
        this._currentScrambler.differentForLefty()) {
      this._emitScramble(this._lastEmittedScrambleRighty);
    }
  };

  // A ScrambleQueue can queue up scrambles for each scramble type.
  function ScrambleQueue() {
    this._queue = {};
    this._load();
    this._removeDontQueueScramblers();
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
  
  ScrambleQueue.prototype._removeDontQueueScramblers = function() {
    // NOTE: this is only to fix broken scrambles from the past.
    // TODO: remove this routine by version 1.
    var changed = false;
    for (var i = 0, len = DONT_QUEUE_SCRAMBLERS.length; i < len; ++i) {
      var name = DONT_QUEUE_SCRAMBLERS[i];
      if (this._queue[name]) {
        this._queue[name] = [];
        changed = true;
      }
    }
    if (changed) {
      this._save();
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

  Scrambler.prototype.differentForLefty = function() {
    return this._name === '2x2x2';
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

  Scrambler.prototype.getName = function() {
    return this._name;
  };

  Scrambler.prototype.getType = function() {
    return this._type;
  };

  Scrambler.prototype.hash = function() {
    return this._name + '  ' + this._type;
  };

  Scrambler.prototype.isNone = function() {
    return this._name === 'None';
  };

  Scrambler.prototype.makeLefty = function(scramble) {
    var moves = scramble.split(' ');
    for (var i = 0, len = moves.length; i < len; ++i) {
      var move = moves[i];
      if (move[0] === 'R') {
        move = move.replace('R', 'L');
      }
      if (move.length === 2) {
        if (move[1] === "'") {
          move = move.substring(0, 1);
        }
      } else {
        move = move + "'";
      }
      moves[i] = move;
    }
    return moves.join(' ');
  };

  window.app.ScrambleStream = ScrambleStream;

})();
