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
    
    var averages = session.averageTable();
    if (averages.length == 0) {
      this.element.html(code);
      return;
    }
    
    // Generate the nice averages table
    code += '<table class="stats-averages"><tr><td></td><td>Last avg of</td>' +
      '<td>Best avg of</td></tr>';
    for (var i = 0, len = averages.length; i < len; ++i) {
      var row = averages[i];
      var last = new window.app.Record(row[1]).toString();
      var best = new window.app.Record(row[2]).toString();
      code += '<tr><td>' + row[0] + '</td><td>' + last + '</td><td>' + best +
        '</td></tr>';
    }
    
    this.element.html(code);
  };
  
  if (!window.app) {
    window.app = {};
  }
  
  window.app.SessionStats = SessionStats;
  
})();