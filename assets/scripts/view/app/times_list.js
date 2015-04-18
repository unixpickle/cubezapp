(function() {

  function TimesList() {
    this._element = $('#footer .stats-contents .times');
  }

  TimesList.prototype.layout = function(width) {
    // Bogus layout, for now.
    this._element.css({width: width || 100});
  };
  
  TimesList.prototype.width = function() {
    return this._element.width();
  };
  
  window.app.TimesList = TimesList;

})();
