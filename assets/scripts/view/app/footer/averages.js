(function() {

  var OVERVIEW_PADDING = 35;

  var MOUSE_RIGHT_CLICK = 3;

  var BLURB_FONT_SIZE = 18;
  var BLURB_TEXT_COLOR = '#999';
  var BLURB_FONT_FAMILY = 'Oxygen, sans-serif';
  var BLURB_FONT_WEIGHT = 'lighter';
  var BLURB_ARROW_HEIGHT = 10;
  var BLURB_MIN_X = 10;
  var BLURB_ARROW_MIN_MARGIN = 10 + BLURB_ARROW_HEIGHT;
  var BLURB_CONTENT_PADDING = 10;
  var BLURB_SHADOW_INSET = 3;
  var BLURB_SHADOW_BLUR = 3;
  var BLURB_SHADOW_COLOR = 'rgba(0, 0, 0, 0.5)';

  function Averages(footer) {
    window.app.EventEmitter.call(this);
    this._$element = $('#footer .stats-contents .averages');
    this._$overview = null;
    this._$table = null;

    this._blurb = null;
    this._blurbTimeout = null;

    this._showStats(window.app.store.getStats());
    this._registerModelEvents();

    footer.on('hidden', this._cancelBlurb.bind(this));
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

  Averages.prototype._cancelBlurb = function() {
    if (this._blurb) {
      this._blurb.hide();
      this._blurb = null;
    } else if (this._blurbTimeout) {
      clearTimeout(this._blurbTimeout);
      this._blurbTimeout = null;
    }
  };

  Averages.prototype._generateTable = function(stats) {
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
      var $row = $('<tr><td class="left">' + average.name +
        '</td><td class="middle">' + last + '</td><td class="right">' + best +
        '</td></tr>');
      if (average.last !== null) {
        this._registerBlurbEventsForCell($row.find('.middle'), average.last);
      }
      if (average.best !== null) {
        this._registerBlurbEventsForCell($row.find('.right'), average.best);
      }
      $table.append($row);
    }
    return $table;
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

  Averages.prototype._registerBlurbEventsForCell = function($td, averageInfo) {
    var showBlurb = function() {
      var offset = $td.offset();
      var elementOffset = this._$element.offset();
      offset.top -= elementOffset.top;
      offset.left -= elementOffset.left;
      offset.top += Math.round($td.outerHeight() * 0.7);
      offset.left += Math.round($td.outerWidth() / 2);

      this._cancelBlurb();
      this._blurb = new Blurb(averageInfo.stdDev, averageInfo.beat,
        offset.left, offset.top, this._$element.width(),
        this._$element.height());
      this._blurb.showInElement(this._$element);
    }.bind(this);
    $td.mousedown(function(e) {
      if (e.which === MOUSE_RIGHT_CLICK) {
        showBlurb();
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }.bind(this));
    $td.on('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }.bind(this));
  };

  Averages.prototype._registerModelEvents = function(events) {
    window.app.store.on('computedStats', this._showStats.bind(this));
    // TODO: register loadingStats and empty the table if stats are gone for too
    // long.
  };

  Averages.prototype._showStats = function(stats) {
    this._cancelBlurb();

    this._$element.empty();
    if (stats === null) {
      return;
    }
    this._$overview = generateOverview(stats);
    this._$table = this._generateTable(stats);
    this._$element.append([this._$table, this._$overview]);
    this.emit('needsLayout');
  };

  function Blurb(stdDev, timeToBeat, x, y, parentWidth, parentHeight) {
    var labelCSS = {
      color: BLURB_TEXT_COLOR,
      fontSize: BLURB_FONT_SIZE + 'px',
      fontFamily: BLURB_FONT_FAMILY,
      fontWeight: BLURB_FONT_WEIGHT,
      whiteSpace: 'nowrap'
    };

    var stdDevCode = '<label>&sigma; = ' + window.app.formatTime(stdDev) +
      '</label>';
    this._$stdDev = $(stdDevCode).css(labelCSS);
    if (isNaN(timeToBeat)) {
      this._$timeToBeat = null;
    } else {
      this._$timeToBeat = $('<label>Need ' + window.app.formatTime(timeToBeat) +
        ' to beat</label>').css(labelCSS);
    }
    this._computeSize();
    this._generateCanvas();
    this._computePosition(x, y, parentWidth, parentHeight);
    this._drawBlurb();

    var labels = [this._$stdDev[0]];
    if (this._$timeToBeat !== null) {
      labels.push(this._$timeToBeat[0]);
    }
    $(labels).css({
      display: 'block',
      textAlign: 'center',
      position: 'relative'
    });

    var topOffset = (this._arrowOnTop ? BLURB_ARROW_HEIGHT : 0);
    this._$stdDev.css({marginTop: topOffset + BLURB_CONTENT_PADDING});

    this._$element = $('<div class="averages-blurb"></div>').css({
      position: 'absolute',
      top: this._y,
      left: this._x,
      width: this._width,
      height: this._height,
      pointerEvents: 'none'
    }).append(this._$canvas).append(labels);

    this._disableContextMenus();
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

  Blurb.prototype._computePosition = function(x, y, parentWidth, parentHeight) {
    var blurbX = Math.floor(x - this._width/2);
    var blurbY = y;
    var arrowOnTop = true;
    if (blurbX < BLURB_MIN_X) {
      blurbX = BLURB_MIN_X;
    } else if (blurbX+this._width > parentWidth-BLURB_MIN_X) {
      blurbX = parentWidth - BLURB_MIN_X - this._width;
    }
    if (blurbY+this._height > parentHeight) {
      arrowOnTop = false;
      blurbY = y - this._height;
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
      this._height = ttbSize.height + stdDevSize.height;
    }
    this._height += BLURB_ARROW_HEIGHT + BLURB_CONTENT_PADDING*2;
    this._width += BLURB_CONTENT_PADDING * 2;
  };

  Blurb.prototype._disableContextMenus = function() {
    var $all = $([this._$element[0], this._$canvas[0], this._$stdDev[0]]);
    if (this._$timeToBeat !== null) {
      $all = $all.add(this._$timeToBeat);
    }
    $all.on('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }.bind(this));
  };

  Blurb.prototype._drawBlurb = function() {
    // Bogus code to draw a color in the bg.
    var context = this._$canvas[0].getContext('2d');

    var canvasWidth = this._$canvas[0].width;
    var canvasHeight = this._$canvas[0].height;

    context.shadowBlur = BLURB_SHADOW_BLUR;
    context.shadowColor = BLURB_SHADOW_COLOR;
    context.fillStyle = 'white';

    context.beginPath();

    var arrowHeight = BLURB_ARROW_HEIGHT * this._canvasScale;
    var shadowInset = BLURB_SHADOW_INSET * this._canvasScale;

    var boxY = shadowInset + (this._arrowOnTop ? arrowHeight : 0);
    context.rect(shadowInset, boxY, canvasWidth - shadowInset*2,
      canvasHeight - shadowInset*2 - arrowHeight);

    var arrowX = this._arrowX * this._canvasScale;
    if (this._arrowOnTop) {
      context.moveTo(arrowX-arrowHeight, arrowHeight+shadowInset);
      context.lineTo(arrowX, shadowInset);
      context.lineTo(arrowX+arrowHeight, arrowHeight+shadowInset);
    } else {
      context.moveTo(arrowX-arrowHeight,
        canvasHeight-shadowInset-arrowHeight);
      context.lineTo(arrowX, canvasHeight-shadowInset);
      context.lineTo(arrowX+arrowHeight,
        canvasHeight-shadowInset-arrowHeight);
    }

    context.closePath();
    context.fill();
  };

  Blurb.prototype._generateCanvas = function() {
    var canvas = $('<canvas></canvas>').css({
      width: this._width,
      height: this._height,
      position: 'absolute',
      top: 0,
      left: 0
    });
    var pixelRatio = Math.ceil(window.crystal.getRatio());
    canvas[0].width = pixelRatio * this._width;
    canvas[0].height = pixelRatio * this._height;
    this._$canvas = canvas;
    this._canvasScale = pixelRatio;
  };

  function elementWidthAndHeight($element) {
    $element.css({
      position: 'fixed',
      top: 0,
      left: 0,
      visibility: 'hidden'
    });
    $(document.body).append($element);
    var res = {
      width: $element.width(),
      height: $element.height()
    };
    $element.detach().css({
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

  window.app.Averages = Averages;

})();
