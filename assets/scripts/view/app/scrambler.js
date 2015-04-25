(function() {

  var LOADING_LABEL_TIMEOUT = 300;
  var SCRAMBLE_LENGTHS = {
    '3x3x3  Moves': 25,
    '2x2x2  Moves': 25,
    'Skewb  Moves': 25
  };

  var STATE_HIDDEN = 0;
  var STATE_HIDDEN_LOADING = 1;
  var STATE_LOADING = 2;
  var STATE_SHOWING = 3;

  // A Scrambler queues up scrambles for the user.
  function Scrambler() {
    this._queue = {};
    this._state = STATE_HIDDEN;
    this._setting = ScrambleSetting.current();
    this._loadingTimeout = null;
    this._currentScramble = null;

    this._registerModelEvents();
  }
  
  Scrambler.prototype.current = function() {
    return this._currentScramble;
  };

  Scrambler.prototype.hideScramble = function() {
    var wasShowing = false;
    switch (this._state) {
    case STATE_HIDDEN:
    case STATE_HIDDEN_LOADING:
      break;
    case STATE_SHOWING:
      this._state = STATE_HIDDEN_LOADING;
      this._generateScramble();
      break;
    case STATE_LOADING:
      this._state = STATE_HIDDEN_LOADING;
      break;
    default:
      break;
    }
    this._showScramble(null);
  };

  Scrambler.prototype.showScramble = function() {
    switch (this._state) {
    case STATE_LOADING:
    case STATE_SHOWING:
      break;
    case STATE_HIDDEN_LOADING:
      this._state = STATE_LOADING;
      this._showScramble('Loading...');
      this._stopLoadingTimeout();
      break;
    case STATE_HIDDEN:
      var scramble = this._shiftScrambleFromQueue(this._setting);
      if (scramble !== null) {
        this._state = STATE_SHOWING;
        this._showScramble(scramble);
      } else {
        this._state = STATE_LOADING;
        this._generateScramble();
      }
      break;
    default:
      break;
    }
  };

  Scrambler.prototype._generateScramble = function() {
    if (this._setting.isNone()) {
      if (this._state === STATE_LOADING) {
        this._state = STATE_SHOWING;
      } else if (this._state === STATE_HIDDEN_LOADING) {
        this._state = STATE_HIDDEN;
      }
      this._showScramble(null);
      return;
    }
    this._startLoadingTimeout();
    this._setting.generate(function(setting, scramble) {
      if (this._state === STATE_LOADING && setting.equals(this._setting)) {
        this._stopLoadingTimeout();
        this._state = STATE_SHOWING;
        this._showScramble(scramble);
      } else {
        this._pushScrambleToQueue(setting, scramble);
        if (this._state === STATE_HIDDEN_LOADING &&
            setting.equals(this._setting)) {
          this._state = STATE_HIDDEN;
        }
      }
    }.bind(this, this._setting));
  };

  Scrambler.prototype._handleModelChange = function() {
    var current = ScrambleSetting.current();
    if (!current.equals(this._setting)) {
      this._setting = current;
      if (this._state === STATE_HIDDEN) {
        this._state = STATE_HIDDEN_LOADING;
      } else if (this._state === STATE_SHOWING) {
        this._state = STATE_LOADING;
      }
      this._generateScramble();
    }
  };

  Scrambler.prototype._pushScrambleToQueue = function(setting, scramble) {
    var hash = setting.hash();
    var queued = this._queue[hash];
    if (!queued) {
      this._queue[hash] = [scramble];
    } else {
      queued.push(scramble);
    }
  };

  Scrambler.prototype._registerModelEvents = function() {
    var handler = this._handleModelChange.bind(this);
    var events = ['remoteChange', 'modifiedPuzzle', 'switchedPuzzle'];
    for (var i = 0; i < events.length; ++i) {
      window.app.store.on(events[i], handler);
    }
  };

  Scrambler.prototype._shiftScrambleFromQueue = function(setting) {
    var hash = setting.hash();
    if ('undefined' === typeof this._queue[hash]) {
      return null;
    }
    return this._queue[hash].shift();
  };

  Scrambler.prototype._showScramble = function(scramble) {
    window.app.view.setScramble(scramble);
    if (scramble ===  'Loading...' || scramble === null) {
      this._currentScramble = null;
    } else {
      this._currentScramble = scramble;
    }
  };

  Scrambler.prototype._startLoadingTimeout = function() {
    if (this._loadingTimeout !== null) {
      clearTimeout(this._loadingTimeout);
    }
    var setting = this._setting;
    this._loadingTimeout = setTimeout(function() {
      this._loadingTimeout = null;
      if (this._state === STATE_LOADING && this._setting.equals(setting)) {
        this._showScramble('Loading...');
      }
    }.bind(this), LOADING_LABEL_TIMEOUT);
  };

  Scrambler.prototype._stopLoadingTimeout = function() {
    if (this._loadingTimeout !== null) {
      this._loadingTimeout = null;
      clearTimeout(this._loadingTimeout);
    }
  };

  Scrambler.prototype._waitingForScramble = function() {
    return this._state === STATE_REQUESTED ||
      this._state === STATE_OLD || this._state === STATE_LOADING;
  };

  function ScrambleSetting(name, type) {
    this._name = name;
    this._type = type;
  }

  ScrambleSetting.current = function() {
    var puzzle = window.app.store.getActivePuzzle();
    return new ScrambleSetting(puzzle.scrambler, puzzle.scrambleType);
  };

  ScrambleSetting.prototype.equals = function(s) {
    return this._name === s._name && this._type === s._type;
  };

  ScrambleSetting.prototype.generate = function(cb) {
    if (this.isNone()) {
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

  ScrambleSetting.prototype.hash = function() {
    return this._name + '  ' + this._type;
  };

  ScrambleSetting.prototype.isNone = function() {
    return this._name === 'None';
  };

  window.app.Scrambler = Scrambler;

})();