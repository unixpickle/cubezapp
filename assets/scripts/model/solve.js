(function() {

  function solveIsPB(solve) {
    if (solve.lastPB === -1) {
      return true;
    } else {
      return Math.floor(solveTime(solve) / 10) < Math.floor(solve.lastPB / 10);
    }
  }

  function solveTime(solve) {
    if (solve.plus2) {
      return solve.time + 2000;
    } else {
      return solve.time;
    }
  }

  window.app.solveIsPB = solveIsPB;
  window.app.solveTime = solveTime;

})();