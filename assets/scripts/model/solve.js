(function() {

  var MINIMUM_SOLVE_COUNT_FOR_PB = 5;

  function solveIsPB(solve) {
    if (solve.lastPB === -1) {
      return true;
    } else {
      return Math.floor(solveTime(solve) / 10) < Math.floor(solve.lastPB / 10);
    }
  }

  function solveShouldShowAsPB(solve) {
    return window.app.store.getSolveCount() >= MINIMUM_SOLVE_COUNT_FOR_PB && 
      solveIsPB(solve);
  }

  function solveTime(solve) {
    if (solve.plus2) {
      return solve.time + 2000;
    } else {
      return solve.time;
    }
  }

  window.app.solveIsPB = solveIsPB;
  window.app.solveShouldShowAsPB = solveShouldShowAsPB;
  window.app.solveTime = solveTime;

})();
