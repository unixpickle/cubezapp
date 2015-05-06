(function() {

  var PB_MIN_COUNT = 5;

  function showAverageAsPB(average) {
    return average.lastWasPB && average.count >= PB_MIN_COUNT;
  }

  function showSolveAsPB(solve) {
    return window.app.store.getSolveCount() > PB_MIN_COUNT &&
      window.app.solveIsPB(solve);
  }

  window.app.showAverageAsPB = showAverageAsPB;
  window.app.showSolveAsPB = showSolveAsPB;

})();
