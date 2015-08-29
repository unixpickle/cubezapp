(function() {

  function TimeTextMetrics() {
    this._widths = {};
    this._plus2Space = 0;
    this._initializeWidths();
  }

  TimeTextMetrics.THREE_DIGIT_MAX = 9999;
  TimeTextMetrics.FOUR_DIGIT_MAX = TimeTextMetrics.THREE_DIGIT_MAX + 50000;
  TimeTextMetrics.FIVE_DIGIT_MAX = TimeTextMetrics.FOUR_DIGIT_MAX + 540000;
  TimeTextMetrics.SIX_DIGIT_MAX = TimeTextMetrics.FIVE_DIGIT_MAX + 3000000;

  TimeTextMetrics.prototype.plus2Space = function() {
    return this._plus2Space;
  };

  TimeTextMetrics.prototype.widthOfTime = function(time) {
    if (time <= TimeTextMetrics.THREE_DIGIT_MAX) {
      return this._widths['0.00'];
    } else if (time <= TimeTextMetrics.FOUR_DIGIT_MAX) {
      return this._widths['00.00'];
    } else if (time <= TimeTextMetrics.FIVE_DIGIT_MAX) {
      return this._widths['0:00.00'];
    } else if (time <= TimeTextMetrics.SIX_DIGIT_MAX) {
      return this._widths['00:00.00'];
    } else {
      return this._widths['0:00:00.00'];
    }
  };

  TimeTextMetrics.prototype._initializeWidths = function() {
    var $label = $('<label></label>').css({
      fontSize: window.app.TimesList.FONT_SIZE,
      fontFamily: window.app.TimesList.FONT_FAMILY,
      fontWeight: window.app.TimesList.FONT_WEIGHT,
      position: 'absolute',
      visibility: 'hidden'
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

  window.app.TimeTextMetrics = TimeTextMetrics;

})();
