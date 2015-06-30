(function() {

  var MAX_TICK_COUNT = 500;
  var MIN_TICK_COUNT = 10;
  var TIME_QUANTUM = 1000;

  function GraphThresholdSlider(changeEmitter) {
    this._slider = new window.app.DiscreteGraphSlider();
    this._computeAndSetBounds();

    this._manager = new window.app.GraphSliderManager(this._slider,
      'graphStreakUpperBound', changeEmitter);

    this._labeledSlider = new window.app.LabeledGraphSlider(this._manager,
      'Threshold');
    this._labeledSlider.setLabelFunc(function(v) {
      return 'sub ' + window.app.formatSeconds(v);
    });

    this._registerModelEvents();
  }

  GraphThresholdSlider.prototype.element = function() {
    return this._labeledSlider.element();
  };

  GraphThresholdSlider.prototype._computeAndSetBounds = function() {
    var maxMin = minimumAndMaximumValues();
    var ticks = ticksForRange(maxMin.min, maxMin.max);
    this._slider.setMin(maxMin.min);
    this._slider.setMax(maxMin.max);
    this._slider.setAllowedValues(ticks);
  };

  GraphThresholdSlider.prototype._registerModelEvents = function() {
    window.app.observe.latestSolve(['lastPW', 'lastPB', 'time', 'plus2',
      'dnf'], this._updateBounds.bind(this));
  };

  GraphThresholdSlider.prototype._updateBounds = function() {
    var oldValue = this._slider.getValue();
    this._computeAndSetBounds();
    if (oldValue !== this._slider.getValue()) {
      this._manager.changedExternally();
    }
  };

  function minimumAndMaximumValues() {
    var solve = window.app.store.getLatestSolve();
    if (solve === null) {
      return {min: 15000, max: 15000 + MIN_TICK_COUNT*TIME_QUANTUM};
    }

    var worst = solve.lastPW;
    var best = solve.lastPB;
    if (!solve.dnf) {
      var time = window.app.solveTime(solve);
      if (worst === -1 || time > worst) {
        worst = time;
      }
      if (best === -1 || time < best) {
        best = time;
      }
    }

    best = best - (best % TIME_QUANTUM);
    if (worst%TIME_QUANTUM !== 0) {
      worst += TIME_QUANTUM - (worst % TIME_QUANTUM);
    }

    // NOTE: sub-0 makes no sense.
    if (best === 0) {
      best = TIME_QUANTUM;
    }

    while (worst-best < MIN_TICK_COUNT*TIME_QUANTUM) {
      if (best > TIME_QUANTUM) {
        best -= TIME_QUANTUM;
      }
      worst += TIME_QUANTUM;
    }

    return {min: best, max: worst};
  }

  function ticksForRange(min, max) {
    var step = Math.floor((max - min) / MAX_TICK_COUNT);
    if (step === 0 || step%TIME_QUANTUM !== 0) {
      step += TIME_QUANTUM - (step % TIME_QUANTUM);
    }

    var ticks = [];
    for (var i = min; i < max; i += step) {
      ticks.push(i);
    }
    // NOTE: we have to push max separately because we don't know that step will
    // divide (max - min) perfectly.
    ticks.push(max);

    return ticks;
  }

  window.app.GraphThresholdSlider = GraphThresholdSlider;

})();
