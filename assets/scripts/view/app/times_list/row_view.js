(function() {

  function TimesListRowView() {
    this._$element = $('<div class="times-list-row"></div>');
    this._$content = $('<div class="times-list-row-content"></div>');
    this._$time = $('<label class="times-list-row-label></label>"');
    this._$plus2 = $('<label class="times-list-row-label">+</label>');
    this._$content.append(this._$time, this._$plus2);
    this._$element.append(this._$content);
  }

  TimesListRowView.prototype.element = function() {
    return this._$element;
  };

  TimesListRowView.prototype.updateWithSolve = function(s) {
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
  };

  window.app.TimesListRowView = TimesListRowView;

})();
