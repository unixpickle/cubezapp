(function() {

  var PADDING = 10;

  function TimesListRow(metrics, solve) {
    var solveTime = window.app.solveTime(solve);
    var timeWidth = metrics.widthOfTime(solveTime);
    var plus2Width = metrics.plus2Space();
    this._width = TimesListRow.TOTAL_PADDING + timeWidth + plus2Width;
    this._solve = solve;
  }

  TimesListRow.TOTAL_PADDING = PADDING*2;

  TimesListRow.prototype.getSolve = function() {
    return this._solve;
  };

  TimesListRow.prototype.getWidth = function() {
    return this._width;
  };

  window.app.TimesListRow = TimesListRow;

})();
