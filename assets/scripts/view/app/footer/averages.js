(function() {

  var OVERVIEW_PADDING = 35;

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

    var $rows = this._$overview.find('.row');
    var overviewWidth = 0;
    $rows.each(function(i, obj) {
      overviewWidth = Math.max($(obj).width() + OVERVIEW_PADDING,
        overviewWidth);
    });

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
    this._$element.append([this._$table, this._$overview]);

    this.emit('needsLayout');
  };
  
  function Blurb(stdDev, timeToBeat, x, y, parentWidth, parentHeight) {
    var stdDevCode = '<label>&sigma; = ' + window.app.formatTime(stdDev) +
      '</label>';
    this._$stdDev = $(stdDevCode).css({
      color: BLURB_TEXT_COLOR,
      fontSize: BLURB_FONT_SIZE + 'px',
      fontFamily: BLURB_FONT_FAMILY
    });
    if (isNaN(timeToBeat)) {
      this._$timeToBeat = null;
    } else {
      this._$timeToBeat = $('<label>Need ' + window.app.formatTime(timeToBeat) +
        '</label>');
    }
    this._computeSize();
    this._generateCanvas();
    this._computePosition(x, y);
    this._drawBlurb();

    this._$element = $('<div class="averages-blurb"></div>').css({
      position: 'absolute',
      top: this._y,
      left: this._x
    }).append([this._$canvas, this._$stdDev, this._$timeToBeat]);
  }

  Blurb.prototype.hide = function() {
    this._$element.fadeOut(function() {
      this._$element.remove();
    }.bind(this));
  };

  Blurb.prototype.showInElement = function(element) {
    this._$element.css({display: 'none'});
    element.append(this._$element);
    this._$element.fadeIn();
  };

  Blurb.prototype._computePosition = function(x, y) {
    var blurbX = Math.floor(x - this._width/2);
    var blurbY = y;
    var arrowOnTop = true;
    if (blurbX < BLURB_MIN_X) {
      blurbX = BLURB_MIN_X;
    } else if (blurbX+this._width > parentWidth-BLURB_MIN_X) {
      blurbX = parentWidth - BLURB_MIN_X - this.width;
    }
    if (blurbY+canvasHeight > parentHeight) {
      arrowOnTop = false;
      blurbY = y - canvasHeight;
    }

    this._x = blurbX;
    this._y = blurbY;
    this._arrowOnTop = arrowOnTop;
    this._arrowX = Math.min(Math.max(x-blurbX, BLURB_ARROW_MIN_MARGIN),
      this._width-BLURB_ARROW_MIN_MARGIN);
  };

  Blurb.prototype._computeSize = function() {
    var stdDevSize = elementWidthAndHeight(this._$stdDev);
    if (this._$timeToBeat === null) {
      this._width = stdDevSize.width;
      this._height = stdDevSize.height;
    } else {
      var ttbSize = elementWidthAndHeight(this._$timeToBeat);
      this._width = Math.max(ttbSize.width, stdDevSize.width);
      this._height = Math.max(ttbSize.height, stdDevSize.height);
    }
  };

  Blurb.prototype._drawBlurb = function() {
    // TODO: this.
  };

  Blurb.prototype._generateCanvas = function() {
    var canvasHeight = this._height + BLURB_ARROW_HEIGHT;
    var canvas = $('<canvas></canvas>').css({
      width: this._width,
      height: canvasHeight,
      position: 'absolute',
      top: 0,
      left: 0
    });
    var pixelRatio = window.crystal.getRatio();
    canvas.width = Math.floor(pixelRatio * this._width);
    canvas.height = Math.floor(pixelRatio * canvasHeight);
    this._$canvas = canvas;
  };

  function elementWidthAndHeight($element) {
    $element.css({
      position: 'fixed',
      top: 0,
      left: 0,
      visibility: 'hidden'
    });
    var res = {
      width: $element.width(),
      height: $element.height()
    };
    $element.css({
      position: '',
      top: '',
      left: '',
      visibility: ''
    });
    return res;
  }

  function generateOverview(stats) {
    var solvesRow = '<div class="row"><label>Solves:</label>' + stats.count +
      '</div>';

    if (stats.count === 0) {
      return $('<div class="overview">' + solvesRow + '</div>');
    }

    var meanRow = '<div class="row"><label>Mean:</label>' +
      window.app.formatTime(stats.mean) + '</div>';
    var bestRow = '<div class="row"><label>Best:</label>' +
      window.app.formatTime(window.app.solveTime(stats.best)) + '</div>';
    return $('<div class="overview">' + solvesRow + meanRow + bestRow +
      '</div>');
  }

  function generateTable(stats) {
    var size = window.app.store.getSolveCount();

    if (size < 3) {
      return $();
    }

    var $table = $('<table><tr><th class="left"></th><th class="middle">' +
      'Last avg</th><th class="right">Best avg</th></tr></table>');
    for (var i = 0, len = stats.averages.length; i < len; ++i) {
      if (stats.averages[i].size > size) {
        continue;
      }

      var average = stats.averages[i];
      var last = (average.last === null ? 'DNF' :
        window.app.formatTime(average.last.time));
      var best = (average.best === null ? 'DNF' :
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
