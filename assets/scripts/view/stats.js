(function() {
  
  function SessionStats() {
    this.element = $('#session-stats');
  }
  
  SessionStats.prototype.update = function(session) {
    if (session.count() === 0) {
      this.element.html('<div class="no-stats">No stats.</div>');
      return;
    }
    this.element.html('<div class="no-stats">NYI</div>');
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.SessionStats = SessionStats;
  
})();