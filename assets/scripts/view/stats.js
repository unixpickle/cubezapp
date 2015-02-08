(function() {
  
  function Stats() {
    this.element = $('#stats');
  }
  
  Stats.prototype.update = function(stats) {
    if (stats.count === 0) {
      this.element.html('<div class="no-stats">Solve the cube.</div>');
      return;
    }

    // Create the general info table.
    var code = '<table class="general">' +
      '<tr><td><strong>Solves:</strong> ' + stats.count + '</td>' +
      '<td><strong>Average:</strong> ' + statString(stats.average) +
      '</td></tr><tr><td><strong>Best:</strong> ' + statString(stats.best) +
      '</td><td><strong>Worst:</strong> ' + statString(stats.worst) +
      '</td></tr></table>';

    // Don't create the averages table if we don't need to.
    if (stats.averages.length === 0) {
      this.element.html(code);
      return;
    }

    code += '<table class="averages"><tr><td></td><td>Last avg of</td>' +
      '<td>Best avg of</td></tr>';
    for (var i = 0, len = stats.averages.length; i < len; ++i) {
      var row = stats.averages[i];
      var lastStr = statString(row[1]);
      var bestStr = statString(row[2]);
      code += '<tr><td>' + row[0] + '</td><td>' + lastStr + '</td><td>' +
        bestStr + '</td></tr>';
    }
    code += '</table>';

    this.element.html(code);
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
  window.app.Stats = Stats;
  
})();