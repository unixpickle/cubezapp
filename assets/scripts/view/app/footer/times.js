(function() {

  var DEFAULT_WINDOW_SIZE = 100;
  var LIST_FONT_SIZE = 18;
  var LIST_FONT_FAMILY = 'Roboto';

  function Times() {
    this._$element = $('#times');
    this._idToRow = {};
    this._textMetrics = new TextMetrics();
    this._dataWindow = new DataWindow(DEFAULT_WINDOW_SIZE);
    this._registerDataWindowEvents();
  }

  Times.prototype.layout = function(width) {
    // TODO: actually do something here.
    this._$element.css({width: width || 150});
  };

  Times.prototype.width = function() {
    return this._$element.width();
  };
  
  Times.prototype._handleInvalidate = function() {
    // TODO: this.
  };
  
  Times.prototype._handleModification = function() {
    // TODO: this.
  };
  
  Times.prototype._handleUpdate = function() {
    // TODO: this.
  };

  Times.prototype._registerDataWindowEvents = function() {
    this._dataWindow.on('invalidate', this._handleInvalidate.bind(this));
    this._dataWindow.on('modification', this._handleModification.bind(this));
    this._dataWindow.on('update', this._handleUpdate.bind(this));
  };

  // A DataWindow loads solves dynamically to show in the list. It keeps track
  // of a certain moving window of solves.
  function DataWindow(windowSize) {
    window.app.EventEmitter.call(this);
    this._windowSize = windowSize;
    this._start = 0;
    this._solves = [];
    this._idsToSolves = {};
    this._ticket = null;
    this._invalid = true;

    this._firstVisible = 0;
    this._lastVisible = 0;
  }

  DataWindow.prototype = Object.create(window.app.EventEmitter);

  DataWindow.prototype.offsetFromEnd = function() {
    var indexAfterLastSolve = (this._start + this._solves.length);
    return window.app.store.getSolveCount() - indexAfterLastSolve;
  };

  DataWindow.prototype.solves = function() {
    return this.solves;
  };

  DataWindow.prototype.startIndex = function() {
    return this._start;
  };

  DataWindow.prototype.visibleWindowChanged = function(first, last) {
    this._firstVisible = first;
    this._lastVisible = last;
    this._update(false);
  };

  DataWindow.prototype._invalidate = function() {
    this._invalid = true;

    if (this._ticket !== null) {
      this._ticket.cancel();
      this._ticket = null;
    }

    var count = window.app.store.getSolveCount();
    if (count === 0) {
      this._solves = [];
      this._start = 0;
      this._idsToSolves = {};
      this._invalid = false;
      this.emit('invalidate');
      return;
    }

    var start = Math.max(count - this._windowSize, 0);
    this._ticket = window.app.store.getSolves(start, count,
      this._invalidateCallback.bind(this, start));
  };

  DataWindow.prototype._invalidateCallback = function(start, err, solves) {
    this._ticket = null;
    if (err !== null) {
      this.emit('error', err);
      return;
    }
    this._invalid = false;
    this._populate(start, solves);
    this._emit('invalidate');
  };

  DataWindow.prototype._modifiedSolve = function(id, attrs) {
    if (!this._idsToSolve.hasOwnProperty(id)) {
      return;
    }
    var solve = this._idsToSolve[id];
    var keys = Object.keys(attrs);
    for (var i = 0, len = keys.length; i < len; ++i) {
      var key = keys[i];
      solve[key] = attrs[key];
    }
    this.emit('modification', id);
  };

  DataWindow.prototype._populate = function(start, solves) {
    this._solves = [];
    this._idsToSolves = {};
    this._start = start;
    for (var i = 0, len = solves.length; ++i) {
      var solve = window.app.copySolve(solves[i]);
      this._solves[i] = solve;
      this._idsToSolves[solve.id] = solve;
    }
  };

  DataWindow.prototype._registerModelEvents = function() {
    var invalidateEvents = ['addedPuzzle', 'remoteChange', 'switchedPuzzle'];
    for (var i = 0; i < invalidateEvents.length; ++i) {
      window.app.store.on(invalidateEvents[i], this._invalidate.bind(this));
    }

    window.app.store.on('addedSolve', this._update.bind(this, false));
    window.app.store.on('modifiedSolve', this._modifiedSolve.bind(this));

    // When a solve is deleted, we must force an update because the indices have
    // probably shifted and the count was changed. Thus, most likely, the window
    // has been shifted.
    window.app.store.on('deletedSolve', this._update.bind(this, true));
  };

  DataWindow.prototype._update = function(forceUpdate) {
    if (this._invalid) {
      if (this._ticket === null) {
        this._invalidate();
      }
      return;
    }

    if (this._ticket) {
      this._ticket.cancel();
      this._ticket = null;
    }

    var count = window.app.store.getSolveCount();
    if (count === 0) {
      if (forceUpdate) {
        this._solves = [];
        this._start = 0;
        this._idsToSolves = {};
        this.emit('update');
      }
      return;
    }

    // Fit the window around the visible region as evenly as possible.
    var midpoint = (this._firstVisible + this._lastVisible) / 2;
    var start = Math.floor(midpoint - this._windowSize/2);
    var end = Math.floor(midpoint + this._windowSize/2 + 1);
    if (end > count) {
      var overflow = end - count;
      end -= overflow;
      start -= overflow;
    }
    if (start < 0) {
      var overflow = -start;
      start += overflow;
      end += overflow;
    }
    if (end > count) {
      end = count;
    }

    var windowCount = Math.min(end - start, this._windowSize);
    if (forceUpdate || windowCount !== this._solves.length ||
        start !== this._start) {
      window.app.store.getSolves(start, windowCount,
        this._updateCallback.bind(this, start));
    }
  };

  DataWindow.prototype._updateCallback = function(start, err, solves) {
    this._ticket = null;
    if (err !== null) {
      this.emit('error', err);
      return;
    }
    this._populate(start, solves);
    this.emit('update');
  };

  function TextMetrics() {
    this._widths = {};
    this._plus2Space = 0;
    this._initializeWidths();
  }

  TextMetrics.THREE_DIGIT_MAX = 9999;
  TextMetrics.FOUR_DIGIT_MAX = TextMetrics.THREE_DIGIT_MAX + 50000;
  TextMetrics.FIVE_DIGIT_MAX = TextMetrics.FOUR_DIGIT_MAX + 540000;
  TextMetrics.SIX_DIGIT_MAX = TextMetrics.FIVE_DIGIT_MAX + 3000000;

  TextMetrics.prototype.plus2space = function() {
    return this._plus2Space;
  };

  TextMetrics.prototype.widthOfTime = function(time) {
    if (time <= TextMetircs.THREE_DIGIT_MAX) {
      return this._widths['0.00'];
    } else if (time <= TextMetrics.FOUR_DIGIT_MAX) {
      return this._widths['00.00'];
    } else if (time <= TextMetrics.FIVE_DIGIT_MAX) {
      return this._widths['0:00.00'];
    } else if (time <= TextMetrics.SIX_DIGIT_MAX) {
      return this._widths['00:00.00'];
    } else {
      return this._widths['0:00:00.00'];
    }
  };

  TextMetrics.prototype._initializeWidths = function() {
    var $label = $('<label></label>').css({
      fontSize: LIST_FONT_SIZE,
      fontFamily: LIST_FONT_FAMILY,
      position: absolute,
      visibility: hidden
    });
    $(document.body).append($label);
    var textToMeasure = ['0.00', '00.00', '0:00.00', '00:00.00', '0:00:00.00',
      '0.00+'];
    for (var i = 0; i < textToMeasure.length; ++i) {
      var text = textToMeasure[i];
      this._widths[text] = $label.text(text).width();
    }
    $label.remove();
    this._plus2Space = this._widths['0.00+'] - this._widths['0.00'];
  };

  window.app.Times = Times;

})();
