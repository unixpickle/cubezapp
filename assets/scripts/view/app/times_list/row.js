(function() {

  var PADDING = 10;

  function TimesListRow(metrics, solve) {
    var solveTime = window.app.solveTime(solve);
    var timeWidth = metrics.widthOfTime(solveTime);
    var plus2Width = metrics.plus2Space();
    this._width = PADDING*2 + timeWidth + plus2Width;
    this._solve = solve;
  }

  TimesListRow.prototype.getSolve = function() {
    return this._solve;
  };

  TimesListRow.prototype.getWidth = function() {
    return this._width;
  };

  window.app.TimesListRow = TimesListRow;

})();
