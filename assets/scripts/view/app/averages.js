(function() {
  
  var DEFAULT_WIDTH = 200;
  
  function Averages() {
    this._element = $('#footer .stats-contents .averages');
  }
  
  Averages.prototype.layout = function(width) {
    if ('undefined' !== typeof width) {
      this._element.css({width: width});
      return;
    }
    
    this._element.css({width: DEFAULT_WIDTH});
    
    // Deal with a potential scrollbar.
    var clientWidth = this._element[0].clientWidth ||
      this._element.width();
    var difference = this._element.width() - clientWidth;
    if (difference > 0) {
      this._element.css({width: DEFAULT_WIDTH + difference});
    }
  };
  
  Averages.prototype.setVisible = function(flag) {
    this._element.css({display: flag ? 'block' : 'none'});
  };
  
  Averages.prototype.width = function() {
    return this._element.width();
  };
  
  window.app.Averages = Averages;
  
})();