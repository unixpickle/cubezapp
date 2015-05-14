(function() {

  var LIST_FONT_SIZE = 18;
  var LIST_FONT_FAMILY = 'Roboto';

  function Times() {
    this._$element = $('#times');
    this._idToRow = {};
    this._textMetrics = new TextMetrics();

    this._registerModelEvents();
    this._dataInvalidated();
  }

  Times.prototype.layout = function(width) {
    // TODO: actually do something here.
    this._$element.css({width: width || 150});
  };

  Times.prototype.width = function() {
    return this._$element.width();
  };

  Times.prototype._addRowForSolve = function(solve) {
    // TODO: add a row here.
  };

  Times.prototype._dataInvalidated = function() {
    // TODO: reload everything here.
  };

  Times.prototype._deleteRowForSolve = function(id) {
    // TODO: delete a row here.
  };

  Times.prototype._registerModelEvents = function() {
    var invalidateHandler = this._dataInvalidated.bind(this);
    var invalidateEvents = ['addedPuzzle', 'remoteChange', 'switchedPuzzle'];
    for (var i = 0; i < invalidateEvents.length; ++i) {
      window.app.store.on(invalidateEvents[i], invalidateHandler);
    }
    window.app.store.on('deletedSolve', this._deleteRowForSolve.bind(this));
    window.app.store.on('modifiedSolve', this._updateRowForSolve.bind(this));
    window.app.store.on('addedSolve', this._addRowForSolve.bind(this));
  };

  Times.prototype._updateRowForSolve = function(id, attrs) {
    // TODO: update a row here.
  };

  function TextMetrics() {
    this._widths = {};
    this._plus2Space = 0;
    this._initializeWidths();
  }

  TextMetrics.THREE_DIGIT_MAX = 9999;
  TextMetrics.FOUR_DIGIT_MAX = TextMetrics.THREE_DIGIT_MAX + 50000;
  TextMetrics.FIVE_DIGIT_MAX = TextMetrics.FOUR_DIGIT_MAX + 540000;
  TextMetrics.SIX_DIGIT_MAX = TextMetrics.FIVE_DIGIT_MAX + 3000000;

  TextMetrics.prototype.plus2space = function() {
    return this._plus2Space;
  };

  TextMetrics.prototype.widthOfTime = function(time) {
    if (time <= TextMetircs.THREE_DIGIT_MAX) {
      return this._widths['0.00'];
    } else if (time <= TextMetrics.FOUR_DIGIT_MAX) {
      return this._widths['00.00'];
    } else if (time <= TextMetrics.FIVE_DIGIT_MAX) {
      return this._widths['0:00.00'];
    } else if (time <= TextMetrics.SIX_DIGIT_MAX) {
      return this._widths['00:00.00'];
    } else {
      return this._widths['0:00:00.00'];
    }
  };

  TextMetrics.prototype._initializeWidths = function() {
    var $label = $('<label></label>').css({
      fontSize: LIST_FONT_SIZE,
      fontFamily: LIST_FONT_FAMILY,
      position: absolute,
      visibility: hidden
    });
    $(document.body).append($label);
    var textToMeasure = ['0.00', '00.00', '0:00.00', '00:00.00', '0:00:00.00',
      '0.00+'];
    for (var i = 0; i < textToMeasure.length; ++i) {
      var text = textToMeasure[i];
      this._widths[text] = $label.text(text).width();
    }
    $label.remove();
    this._plus2Space = this._widths['0.00+'] - this._widths['0.00'];
  };

  window.app.Times = Times;

})();
