(function() {

  var DEFAULT_WIDTH = 200;

  function Averages() {
    this._$element = $('#footer .stats-contents .averages');
  }

  Averages.prototype.layout = function(width) {
    if ('undefined' !== typeof width) {
      this._$element.css({width: width});
      return;
    }

    this._$element.css({width: DEFAULT_WIDTH});

    // Deal with a potential scrollbar.
    var clientWidth = this._$element[0].clientWidth ||
      this._$element.width();
    var difference = this._$element.width() - clientWidth;
    if (difference > 0) {
      this._$element.css({width: DEFAULT_WIDTH + difference});
    }
  };

  Averages.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  Averages.prototype.width = function() {
    return this._$element.width();
  };

  window.app.Averages = Averages;

})();
