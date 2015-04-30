(function() {

  var ACTIVE_PUZZLE_EVENTS = ['modifiedPuzzle', 'remoteChange',
    'switchedPuzzle', 'addedPuzzle'];
  var GLOBAL_SETTING_EVENTS = ['remoteChange', 'modifiedGlobalSettings'];
  var LATEST_SOLVE_EVENTS = ['modifiedSolve', 'addedSolve', 'deletedSolve',
    'switchedPuzzle', 'addedPuzzle', 'remoteChange'];
  var PUZZLE_COUNT_EVENTS = ['addedPuzzle', 'deletedPuzzle', 'remoteChange'];

  function Observe() {
  }

  Observe.prototype.activePuzzle = function(attrs, callback) {
    return this._observeAttrs(ACTIVE_PUZZLE_EVENTS, function() {
      return window.app.store.getActivePuzzle();
    }, attrs, callback);
  };

  Observe.prototype.globalSettings = function(attrs, callback) {
    return this._observeAttrs(GLOBAL_SETTING_EVENTS, function() {
      return window.app.store.getGlobalSettings();
    }, attrs, callback);
  };

  Observe.prototype.latestSolve = function(attrs, callback) {
    return this._observeAttrs(LATEST_SOLVE_EVENTS, function() {
      return window.app.store.getLatestSolve();
    }, attrs, callback);
  };

  Observe.prototype.puzzleCount = function(callback) {
    var count = window.app.store.getPuzzles().length;
    return new Observation(PUZZLE_COUNT_EVENTS, function() {
      var newCount = window.app.store.getPuzzles().length;
      if (newCount !== count) {
        count = newCount;
        callback();
      }
    }).start();
  };

  // _observeAttrs observes attribute changes on objFunc() for a set of events.
  Observe.prototype._observeAttrs = function(events, objFunc, attrs, cb) {
    if ('string' === typeof attrs) {
      attrs = [attrs];
    } else {
      attrs = attrs.slice();
    }

    var currentValues = extractProperties(objFunc(), attrs);
    return new Observation(events, function() {
      var changed = false;
      var obj = objFunc();

      if (currentValues === null && obj !== null) {
        changed = true;
        currentValues = extractProperties(obj, attrs);
      } else if (currentValues !== null && obj === null) {
        changed = true;
        currentValues = null;
      } else if (currentValues !== null && obj !== null) {
        for (var i = 0, len = attrs.length; i < len; ++i) {
          var attr = attrs[i];
          var newValue = obj[attr];
          if (newValue !== currentValues[attr]) {
            currentValues[attr] = newValue;
            changed = true;
          }
        }
      }

      if (changed) {
        cb();
      }
    }).start();
  }

  function Observation(events, handler) {
    this._events = events;
    this._handler = handler;
    this._started = false;
  }

  Observation.prototype.isRunning = function() {
    return this._started;
  };

  Observation.prototype.start = function() {
    if (this._started) {
      return this;
    }
    this._started = true;
    for (var i = 0, len = this._events.length; i < len; ++i) {
      window.app.store.on(this._events[i], this._handler);
    }
    return this;
  };

  Observation.prototype.stop = function() {
    if (!this._started) {
      return this;
    }
    this._started = false;
    for (var i = 0, len = this._events.length; i < len; ++i) {
      window.app.model.removeListener(this._events[i], this._handler);
    }
    return this;
  };

  function extractProperties(object, attrs) {
    if (object === null) {
      return null;
    }
    var res = {};
    for (var i = 0, len = attrs.length; i < len; ++i) {
      var attr = attrs[i];
      res[attr] = object[attr];
    }
    return res;
  }

  window.app.observe = new Observe();

})();
