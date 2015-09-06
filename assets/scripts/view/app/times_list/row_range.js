(function() {

  // TimesListRowRange displays a range of rows at once, filling in the
  // scrollable space above and below them with blank content.
  //
  // TimesListRowRange implements the EventEmitter interface.
  // - rowClick(index) - a row at the given index was clicked.
  function TimesListRowRange() {
    window.app.EventEmitter.call(this);

    this._start = 0;
    this._length = 0;
    this._totalLength = 0;

    this._rowHeight = computeRowHeight();

    this._$beforeSpacer = $('<div class="times-list-spacer"></div>');
    this._$afterSpacer = $('<div class="times-list-spacer"></div>');
    this._$rows = $('<div></div>');
    $('#times-list').append(this._$beforeSpacer, this._$rows,
      this._$afterSpacer);
  }

  TimesListRowRange.prototype =
    Object.create(window.app.EventEmitter.prototype);

  TimesListRowRange.prototype.getLength = function() {
    return this._length;
  };

  TimesListRowRange.prototype.getStart = function() {
    return this._start;
  };

  TimesListRowRange.prototype.getTotalLength = function() {
    return this._totalLength;
  };

  TimesListRowRange.prototype.setParameters = function(total, start, rows) {
    this._$rows.remove();
    this._$rows.empty();
    for (var i = 0, len = rows.length; i < len; ++i) {
      var $row = rows[i].element();
      this._$rows.append($row);
      $row.click(this.emit.bind(this, 'rowClick', i));
    }
    this._$beforeSpacer.after(this._$rows);

    this._$beforeSpacer.css({height: start * this._rowHeight});
    this._$afterSpacer.css({height: (total-start-rows.length) *
      this._rowHeight});
  };

  function computeRowHeight() {
    var $row = $('<div class="times-list-row"></div>').css({
      visibility: 'hidden',
      position: 'fixed'
    });
    $(document.body).append($row);
    var height = $row.height();
    $row.remove();
    return height;
  }

  window.app.TimesListRowRange = TimesListRowRange;

})();
