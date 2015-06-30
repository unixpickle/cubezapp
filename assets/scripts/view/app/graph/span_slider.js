(function() {
  
  var MAXIMUM_UPPER_BOUND = 5001;

  function GraphSpanSlider(changeEmitter) {
    this._maxValue = Math.min(Math.max(window.app.store.getSolveCount()+1, 6),
      MAXIMUM_UPPER_BOUND);

    var slider = new window.app.TranslatedGraphSlider();

    slider.setSliderToExternal(function(v) {
      var value = Math.round(5 * Math.exp(6.908 * v));
      if (value >= this._maxValue) {
        return -1;
      } else {
        return value;
      }
    }.bind(this));

    slider.setExternalToSlider(function(v) {
      if (v === -1) {
        v = this._maxValue;
      }
      return Math.log(v / 5) / 6.908;
    }.bind(this));

    slider.setMin(5);
    slider.setMax(-1);

    this._slider = slider;

    this._manager = new window.app.GraphSliderManager(slider,
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

  GraphSpanSlider.prototype._updateUpperBound = function() {
    var newMaxValue = Math.min(Math.max(window.app.store.getSolveCount()+1, 6),
      MAXIMUM_UPPER_BOUND);
    if (newMaxValue === this._maxValue) {
      return;
    }
    var oldValue = this._slider.getValue();
    this._maxValue = newMaxValue;
    this._slider.setMax(-1);
    if (this._slider.getValue() !== oldValue) {
      this._manager.changedExternally();
    }
  };

  window.app.GraphSpanSlider = GraphSpanSlider;

})();
