(function() {

  var PADDING = 10;

  function TimesListRow(metrics) {
    this._$element = $('<div class="times-list-row"></div>');
    this._$content = $('<div class="times-list-row-content"></div>');
    this._$time = $('<label class="times-list-row-label></label>"');
    this._$plus2 = $('<label class="times-list-row-label">+</label>');
    this._$content.append(this._$time, this._$plus2);
    this._$element.append(this._$content);

    this._width = 0;
    this._solve = null;
    this._metrics = metrics;
  }

  TimesListRow.prototype.element = function() {
    return this._$element;
  };

  TimesListRow.prototype.getSolve = function() {
    return this._solve;
  };

  TimesListRow.prototype.setSolve = function(solve) {
    var solveTime = window.app.solveTime(solve);

    this._$time.text(window.app.formatTime(solveTime));
    this._$plus2.css({visibility: solve.plus2 ? 'visible' : 'hidden'});

    if (window.app.solveIsPB(solve)) {
      this._$element.addClass('flavor-text');
      this._$element.removeClass('times-list-row-not-pb');
    } else {
      this._$element.addClass('times-list-row-not-pb');
      this._$element.removeClass('flavor-text');
    }

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
