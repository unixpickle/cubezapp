(function() {

  var MAXIMUM_SPAN = 5000;
  var MINIMUM_SPAN = 5;
  var USE_TICKS_THRESHOLD = 30;

  function GraphSpanSlider(changeEmitter) {
    this._maxValue = -1

    this._discreteSlider = new window.app.DiscreteGraphSlider();
    this._slider = new window.app.TranslatedGraphSlider(this._discreteSlider);
    this._slider.setSliderToExternal(function(v) {
      var value = Math.round(5 * Math.exp(6.908 * v));
      if (value >= this._maxValue) {
        return -1;
      } else {
        return value;
      }
    }.bind(this));
    this._slider.setExternalToSlider(function(v) {
      if (v === -1) {
        v = this._maxValue;
      }
      return Math.log(v / 5) / 6.908;
    }.bind(this));

    this._setBoundaries();

    this._manager = new window.app.GraphSliderManager(this._slider,
      'graphHistogramSpan', changeEmitter);

    this._labeledSlider = new window.app.LabeledGraphSlider(this._manager,
      'Span');
    this._labeledSlider.setLabelFunc(function(v) {
      if (v === -1) {
        return 'all';
      } else {
        return v + ' solves';
      }
    });

    this._registerModelEvents();
  }

  GraphSpanSlider.prototype.element = function() {
    return this._labeledSlider.element();
  };

  GraphSpanSlider.prototype._registerModelEvents = function() {
    var events = ['addedPuzzle', 'addedSolve', 'deletedSolve', 'remoteChange',
      'switchedPuzzle'];
    for (var i = 0, len = events.length; i < len; ++i) {
      window.app.store.on(events[i], this._updateUpperBound.bind(this));
    }
  };

  GraphSpanSlider.prototype._setBoundaries = function() {
    var newMaxValue = currentUpperBound();
    if (newMaxValue === this._maxValue) {
      return;
    }
    this._maxValue = newMaxValue;

    var min = Math.min(window.app.store.getSolveCount(), MINIMUM_SPAN);
    this._slider.setMin(min);
    this._slider.setMax(-1);

    if (newMaxValue-min >= USE_TICKS_THRESHOLD) {
      this._discreteSlider.setAllowedValues(null);
    } else {
      var ticks = [];
      for (var i = min; i <= this._maxValue; ++i) {
        ticks.push(this._slider.getExternalToSlider()(i));
      }
      this._discreteSlider.setAllowedValues(ticks);
    }
  };

  GraphSpanSlider.prototype._updateUpperBound = function() {
    var oldValue = this._slider.getValue();
    this._setBoundaries();
    if (this._slider.getValue() !== oldValue) {
      this._manager.changedExternally();
    }
  };

  function currentUpperBound() {
    return 1 + Math.min(window.app.store.getSolveCount(), MAXIMUM_SPAN);
  }

  window.app.GraphSpanSlider = GraphSpanSlider;

})();
