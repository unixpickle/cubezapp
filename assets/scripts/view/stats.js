(function() {
  
  function SessionStats() {
    this.element = $('#session-stats');
  }
  
  SessionStats.prototype.update = function() {
    this.element.html('<div class="no-stats">NYI</div>');
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.SessionStats = SessionStats;
  
})();