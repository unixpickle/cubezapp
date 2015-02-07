(function() {
  
  function SessionStats() {
    this.element = $('#session-stats');
  }
  
  SessionStats.prototype.update = function() {
    // TODO: this
  };
  
  function statString(time) {
    if (isNaN(time)) {
      return "DNF";
    }
    return window.app.timeToString(time);
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.SessionStats = SessionStats;
  
})();