(function() {

  function TimesList() {
    this._$element = $('#footer .stats-contents .times');
  }

  TimesList.prototype.layout = function(width) {
    // Bogus layout, for now.
    this._$element.css({width: width || 100});
  };
  
  TimesList.prototype.width = function() {
    return this._$element.width();
  };
  
  window.app.TimesList = TimesList;

})();
