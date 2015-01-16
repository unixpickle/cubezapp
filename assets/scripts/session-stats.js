(function() {
  
  function SessionStats() {
    this.element = $('#session-stats');
  }
  
  SessionStats.prototype.update = function(session) {
    // TODO: things here.
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.SessionStats = SessionStats;
  
})();