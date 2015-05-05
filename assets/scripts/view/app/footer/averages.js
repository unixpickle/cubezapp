(function() {

  var DEFAULT_WIDTH = 200;

  function Averages() {
    this._$element = $('#footer .stats-contents .averages');
    this._showStats(window.app.store.getStats());
  }

  Averages.prototype.layout = function(width) {
    if ('undefined' !== typeof width) {
      this._$element.css({width: width});
      return;
    }

    this._$element.css({width: DEFAULT_WIDTH});

    // Deal with a potential scrollbar.
    var clientWidth = this._$element[0].clientWidth ||
      this._$element.width();
    var difference = this._$element.width() - clientWidth;
    if (difference > 0) {
      this._$element.css({width: DEFAULT_WIDTH + difference});
    }
  };

  Averages.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  Averages.prototype.width = function() {
    return this._$element.width();
  };
  
  Averages.prototype._registerModelEvents = function(events) {
    window.app.store.on('computedStats', this._showStats.bind(this));
    // TODO: register loadingStats and empty table if stats are gone for too
    // long.
  };
  
  Averages.prototype._showStats = function(stats) {
    this._$element.empty();
    if (stats === null) {
      return;
    }
    var solvesField = '<div class="solves-field"><label>Solves:</label>' +
      stats.count + '</div>';
    var avgField = '<div class="avg-field"><label>Mean:</label>' +
      window.app.formatTime(stats.mean) + '</div>';
    var topRow = '<div class="top-info">' + solvesField + avgField + '</div>';
    // TODO: show + for solve time.
    var secondRow = '<div class="lower-info"><label>Best:</label>' +
      window.app.formatTime(window.app.solveTime(stats.best)) + '</div>';
    var $table = $('<table><tr><td></td><td>Last avg</td>' +
      '<td>Best avg</td></tr></table>');
    for (var i = 0, len = stats.averages.length; i < len; ++i) {
      var average = stats.averages[i];
      var last = (average.last === null ? '' :
        window.app.formatTime(average.last.time));
      var best = (average.best === null ? '' :
        window.app.formatTime(average.best.time));
      // TODO: the row should have mouse hover events, etc.
      var row = '<tr><td>' + average.name + '</td><td>' + last + '</td><td>' +
        best + '</td></tr>';
      $table.append($(row));
    }
    this._$element.append([$(topRow + secondRow), $table]);
  };

  window.app.Averages = Averages;

})();
