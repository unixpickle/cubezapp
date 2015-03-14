(function() {
  
  function Stats() {
    this._element = $('#footer .stats-content .times');
  }
  
  Stats.prototype.layout = function() {
  };
  
  window.app.Stats = Stats;
  
})();