(function() {

  var PADDING = 10;

  function TimesListRow(metrics) {
    this._width = 0;
    this._solve = null;
    this._metrics = metrics;
  }

  TimesListRow.prototype.getSolve = function() {
    return this._solve;
  };

  TimesListRow.prototype.setSolve = function(solve) {
    var solveTime = window.app.solveTime(solve);
    var timeWidth = this._metrics.widthOfTime(solveTime);
    var plus2Width = this._metrics.plus2Space();
    this._width = PADDING*2 + timeWidth + plus2Width;
    this._solve = solve;
  };

  TimesListRow.prototype.width = function() {
    return this._width;
  };

  window.app.TimesListRow = TimesListRow;

})();
