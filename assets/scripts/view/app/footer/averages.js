(function() {

  var OVERVIEW_PADDING = 7;
  var OVERVIEW_FLOAT_SPACING = 5;

  function Averages() {
    window.app.EventEmitter.call(this);
    this._$element = $('#footer .stats-contents .averages');
    this._$overview = null;
    this._$table = null;
    this._minWidth = 0;
    this._showStats(window.app.store.getStats());
    this._registerModelEvents();
    
    window.app.fonts.on('load', this.emit.bind(this, 'needsLayout'));
  }
  
  Averages.prototype = Object.create(window.app.EventEmitter.prototype);

  Averages.prototype.layout = function(width) {
    if ('undefined' !== typeof width) {
      this._$element.css({width: width});
      return;
    }
    
    var minWidth = this._minimumWidth();
    this._$element.css({width: minWidth});

    // Deal with a potential scrollbar.
    var clientWidth = this._$element[0].clientWidth ||
      this._$element.width();
    var difference = this._$element.width() - clientWidth;
    if (difference > 0) {
      this._$element.css({width: minWidth + difference});
    }
  };

  Averages.prototype.setVisible = function(flag) {
    this._$element.css({display: flag ? 'block' : 'none'});
  };

  Averages.prototype.width = function() {
    return this._$element.width();
  };
  
  Averages.prototype._minimumWidth = function() {
    this._$table.css({width: 'auto'});
    var tableWidth = this._$table.width();
    this._$table.css({width: '100%'});
    
    var leftPart = this._$overview.find('.left-field').width();
    var rightPart = this._$overview.find('.right-field').width();
    this._$overview.css({display: 'inline-block'});
    var overviewWidth = this._$overview.width();
    this._$overview.css({display: 'block'});
    
    overviewWidth = Math.max(overviewWidth, leftPart + rightPart +
      OVERVIEW_PADDING*2 + OVERVIEW_FLOAT_SPACING);
    return Math.max(tableWidth, overviewWidth);
  };
  
  Averages.prototype._registerModelEvents = function(events) {
    window.app.store.on('computedStats', this._showStats.bind(this));
    // TODO: register loadingStats and empty the table if stats are gone for too
    // long.
  };
  
  Averages.prototype._showStats = function(stats) {
    this._$element.empty();
    if (stats === null) {
      return;
    }
    this._$overview = generateOverview(stats);
    this._$table = generateTable(stats);
    this._$element.append([this._$overview, this._$table]);
    
    this.emit('needsLayout');
  };
  
  function generateOverview(stats) {
    var solvesField = '<div class="left-field"><label>Solves:</label>' +
      stats.count + '</div>';
    
    if (stats.count === 0) {
      return $('<div class="overview"><div class="row">' + solvesField +
        '</div></div>');
    }
    
    var meanField = '<div class="right-field"><label>Mean:</label>' +
      window.app.formatTime(stats.mean) + '</div>';
    var topRow = '<div class="row">' + solvesField + meanField + '</div>';
    var secondRow = '<div class="row"><label>Best:</label>' +
      window.app.formatTime(window.app.solveTime(stats.best)) + '</div>';
    return $('<div class="overview">' + topRow + secondRow + '</div>');
  }
  
  function generateTable(stats) {
    var $table = $('<table><tr><th class="left"></th><th class="middle">' +
      'Last avg</th><th class="right">Best avg</th></tr></table>');
    for (var i = 0, len = stats.averages.length; i < len; ++i) {
      var average = stats.averages[i];
      var last = (average.last === null ? '' :
        window.app.formatTime(average.last.time));
      var best = (average.best === null ? '' :
        window.app.formatTime(average.best.time));
      // TODO: the row should have mouse hover events, etc.
      var row = '<tr><td class="left">' + average.name +
        '</td><td class="middle">' + last + '</td><td class="right">' + best +
        '</td></tr>';
      $table.append($(row));
    }
    return $table;
  }

  window.app.Averages = Averages;

})();
