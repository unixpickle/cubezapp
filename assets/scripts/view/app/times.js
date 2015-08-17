(function() {

  var DEFAULT_WIDTH = 150;
  var DEFAULT_WINDOW_SIZE = 100;
  var LIST_FONT_SIZE = 18;
  var LIST_FONT_FAMILY = 'Roboto, sans-serif';
  var LIST_FONT_WEIGHT = 'lighter';
  var LIST_PADDING_LEFT = 10;
  var LIST_PADDING_RIGHT = 10;
  var LIST_ROW_HEIGHT = 30;
  var LIST_TEXT_COLOR = '#999999';
  var HOVER_BACKGROUND = '#f0f0f0';
  var HOVER_BACKGROUND_RGB = '240, 240, 240';
  var SCROLL_SHOW_CONTEXT_DELAY = 500;

  function Times() {
    window.app.EventEmitter.call(this);

    this._$element = $('#times');
    this._textMetrics = new TextMetrics();
  }

  Times.prototype = Object.create(window.app.EventEmitter.prototype);

  Times.prototype.layout = function(width) {
    this._$element.css({width: width || DEFAULT_WIDTH});
  };

  Times.prototype.width = function() {
    return this._$element.width();
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

  TextMetrics.prototype.plus2Space = function() {
    return this._plus2Space;
  };

  TextMetrics.prototype.widthOfTime = function(time) {
    if (time <= TextMetrics.THREE_DIGIT_MAX) {
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
      fontWeight: LIST_FONT_WEIGHT,
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

  function scrollbarWidth() {
    // Generate a small scrolling element.
    var element = $('<div></div>').css({
      width: 200,
      height: 100,
      overflowY: 'scroll',
      position: 'fixed',
      visibility: 'hidden'
    });

    // Generate a tall element to put inside the small one.
    var content = $('<div></div>').css({height: 300, width: '100%'});
    element.append(content);

    // Append the small element to the body and measure stuff.
    $(document.body).append(element);
    var result = element.width() - content.width();
    element.remove();

    return result;
  }

  window.app.Times = Times;

})();
