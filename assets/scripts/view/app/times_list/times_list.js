(function() {

  var ROW_HEIGHT = 30;

  function TimesList() {
    window.app.EventEmitter.call(this);

    this._$element = $('#times-list');
  }

  // These values are necessary for TimesTextMetrics to perform its calculations.
  TimesList.FONT_SIZE = 18;
  TimesList.FONT_FAMILY = 'Roboto, sans-serif';
  TimesList.FONT_WEIGHT = '300';

  TimesList.prototype = Object.create(window.app.EventEmitter.prototype);

  TimesList.prototype.layout = function(width) {
    this._$element.css({width: width || DEFAULT_WIDTH});
  };

  TimesList.prototype.width = function() {
    return this._$element.width();
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

  window.app.TimesList = TimesList;

})();
