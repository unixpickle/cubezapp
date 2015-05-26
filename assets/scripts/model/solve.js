(function() {

  function copySolve(solve) {
    var res = {};
    var keys = Object.keys(solve);
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      res[key] = solve[key];
    }
    return res;
  }

  function solveIsPB(solve) {
    if (solve.dnf) {
      return false;
    } else if (solve.lastPB === -1) {
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

  window.app.copySolve = copySolve;
  window.app.solveIsPB = solveIsPB;
  window.app.solveTime = solveTime;

})();
