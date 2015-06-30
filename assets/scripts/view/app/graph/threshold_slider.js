(function() {

  var MAX_TICK_COUNT = 500;

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
      return;
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

    best = best - (best % 1000);
    if (worst%1000 !== 0) {
      worst += 1000 - (worst % 1000);
    }

    // NOTE: sub-0 makes no sense.
    if (best === 0) {
      best = 1000;
    }

    // Even if worst=best (i.e. they have one solve) we need a range so that the
    // slider has somewhere to go.
    if (worst <= best) {
      worst = best + 1000;
    }

    return {min: best, max: worst};
  }

  function ticksForRange(min, max) {
    var step = Math.floor((max - min) / MAX_TICK_COUNT);
    if (step === 0 || step%1000 !== 0) {
      step += 1000 - (step % 1000);
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
