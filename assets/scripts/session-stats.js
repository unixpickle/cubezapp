(function() {
  
  function SessionStats() {
    this.element = $('#session-stats');
  }
  
  SessionStats.prototype.update = function(session) {
    if (session.count() === 0) {
      this.element.html('<div class="no-stats">No stats.</div>');
      return;
    }
    
    var count = session.count();
    var average = new window.app.Record(session.average()).toString();
    var best = new window.app.Record(session.best()).toString();
    var worst = new window.app.Record(session.worst()).toString();
    
    var code = '<table class="stats-table">' +
      '<tr><td><strong>Solves:</strong> ' + count + '</td>' +
      '<td><strong>Average:</strong> ' + average + '</td></tr>' +
      '<tr><td><strong>Best:</strong> ' + best + '</td>' +
      '<td><strong>Worst:</strong> ' + worst + '</td></tr></table>';
    this.element.html(code);
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.SessionStats = SessionStats;
  
})();