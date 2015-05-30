(function() {

  var OVERVIEW_PADDING = 35;
  var MOUSE_RIGHT_CLICK = 3;

  var HOVER_BLURB_TIMEOUT = 300;
  var HOVER_CELL_BG = '#f0f0f0';

  function Averages(footer) {
    window.app.EventEmitter.call(this);
    this._$element = $('#averages');
    this._$overview = null;
    this._$table = null;

    this._blurb = null;
    this._blurbTimeout = null;

    this._showStats(window.app.store.getStats());
    this._registerModelEvents();

    footer.on('hidden', this._cancelBlurb.bind(this));
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
        var $right = $row.find('.right');
        if (average.lastWasPB) {
          $right.addClass('flavor-text').css({fontWeight: 'normal'});
        }
        this._registerBlurbEventsForCell($right, average.best);
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
    $td.css({cursor: 'pointer'});
    var showBlurb = function() {
      this._cancelBlurb();
      this._blurb = new Blurb(averageInfo, this._$element, $td);
      this._blurb.show();
    }.bind(this);
    $td.mousedown(function(e) {
      if (e.which === MOUSE_RIGHT_CLICK) {
        showBlurb();
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }.bind(this));
    $td.mouseenter(function() {
      $td.css({backgroundColor: HOVER_CELL_BG});
      this._cancelBlurb();
      this._blurbTimeout = setTimeout(showBlurb, HOVER_BLURB_TIMEOUT);
    }.bind(this));
    $td.mouseleave(function() {
      $td.css({backgroundColor: ''});
      this._cancelBlurb();
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
    // If there are no stats and stats have been displayed in the past, don't
    // update anything or else a jump may occur during an animation.
    if (window.app.store.getSolveCount() === 0 && this._$table !== null) {
      return;
    }

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

  function Blurb(averageInfo, $container, $td) {
    this._$container = $container;

    this._createLabels(averageInfo);
    this._computeSize();
    this._computePosition($td);
    this._createCanvas();
    this._drawBlurbInCanvas();
    this._positionLabels();
    this._createElement();
    this._disableContextMenus();
  }

  Blurb.ANIMATION_TIME = 0;
  Blurb.ARROW_HEIGHT = 10;
  Blurb.ARROW_MIN_DIST_FROM_EDGE = 10 + Blurb.ARROW_HEIGHT;
  Blurb.CONTENT_PADDING = 10;
  Blurb.FONT_FAMILY = 'Roboto, sans-serif';
  Blurb.FONT_SIZE = 18;
  Blurb.FONT_WEIGHT = 'lighter';
  Blurb.MIN_X = 10;
  Blurb.SHADOW_BLUR = 3;
  Blurb.SHADOW_COLOR = 'rgba(0, 0, 0, 0.5)';
  Blurb.SHADOW_INSET = 3;
  Blurb.TEXT_COLOR = '#999999';

  Blurb.prototype.hide = function() {
    this._$element.fadeOut(Blurb.ANIMATION_TIME, function() {
      this._$element.remove();
    }.bind(this));
  };

  Blurb.prototype.show = function() {
    this._$element.css({
      display: 'none',
      top: this._$container.scrollTop() + this._y
    });
    this._$container.append(this._$element);
    this._$element.fadeIn(Blurb.ANIMATION_TIME);
  };

  Blurb.prototype._computePosition = function($td) {
    this._arrowOnTop = true;

    // We should point somewhere near the middle of $td.
    var offset = $td.offset();
    var containerOffset = this._$container.offset();
    offset.top -= containerOffset.top;
    offset.left -= containerOffset.left;
    offset.top += Math.round($td.outerHeight() * 0.7);
    offset.left += Math.round($td.outerWidth() / 2);
    var pointX = offset.left;
    var pointY = offset.top;

    var containerWidth = this._$container.width();
    var containerHeight = this._$container.height();

    this._x = Math.floor(pointX - this._width/2);
    if (this._x < Blurb.MIN_X) {
      this._x = Blurb.MIN_X;
    } else if (this._x+this._width > containerWidth-Blurb.MIN_X) {
      this._x = containerWidth - Blurb.MIN_X - this._width;
    }

    this._y = pointY;
    if (this._y+this._height > containerHeight) {
      pointY -= Math.round($td.outerHeight() * 0.4);
      this._arrowOnTop = false;
      this._y = pointY - this._height;
    }

    this._arrowX = pointX - this._x;
    if (this._arrowX < Blurb.ARROW_MIN_DIST_FROM_EDGE) {
      this._arrowX = Blurb.ARROW_MIN_DIST_FROM_EDGE;
    } else if (this._arrowX > this._width-Blurb.ARROW_MIN_DIST_FROM_EDGE) {
      this._arrowX = this._width - Blurb.ARROW_MIN_DIST_FROM_EDGE;
    }
  };

  Blurb.prototype._computeSize = function() {
    var stdDevSize = calculateElementSize(this._$stdDev);
    if (this._$timeToBeat === null) {
      this._width = stdDevSize.width;
      this._height = stdDevSize.height;
    } else {
      var ttbSize = calculateElementSize(this._$timeToBeat);
      this._width = Math.max(ttbSize.width, stdDevSize.width);
      this._height = ttbSize.height + stdDevSize.height;
    }
    this._height += Blurb.ARROW_HEIGHT + Blurb.CONTENT_PADDING*2;
    this._width += Blurb.CONTENT_PADDING * 2;
  };

  Blurb.prototype._createCanvas = function() {
    var $canvas = $('<canvas></canvas>').css({
      width: this._width,
      height: this._height,
      position: 'absolute',
      top: 0,
      left: 0
    });
    var pixelRatio = Math.ceil(window.crystal.getRatio());
    $canvas[0].width = pixelRatio * this._width;
    $canvas[0].height = pixelRatio * this._height;
    this._$canvas = $canvas;
    this._canvasScale = pixelRatio;
  };

  Blurb.prototype._createElement = function() {
    this._$element = $('<div class="averages-blurb"></div>').css({
      position: 'absolute',
      left: this._x,
      width: this._width,
      height: this._height,
      pointerEvents: 'none'
    }).append([this._$canvas[0], this._$stdDev[0]]);
    if (this._$timeToBeat !== null) {
      this._$element.append(this._$timeToBeat);
    }
  };

  Blurb.prototype._createLabels = function(averageInfo) {
    var stdDev = averageInfo.stdDev;
    var timeToBeat = averageInfo.beat;

    var labelStyle = {
      color: Blurb.TEXT_COLOR,
      fontSize: Blurb.FONT_SIZE + 'px',
      fontFamily: Blurb.FONT_FAMILY,
      fontWeight: Blurb.FONT_WEIGHT,
      whiteSpace: 'nowrap',
      display: 'block',
      textAlign: 'center',
      position: 'relative'
    };

    var stdDevCode = '<label>&sigma; = ' + window.app.formatTime(stdDev) +
      '</label>';
    this._$stdDev = $(stdDevCode).css(labelStyle);
    if (isNaN(timeToBeat)) {
      this._$timeToBeat = null;
    } else {
      this._$timeToBeat = $('<label>Need ' + window.app.formatTime(timeToBeat) +
        ' to beat</label>').css(labelStyle);
    }
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

  Blurb.prototype._drawBlurbInCanvas = function() {
    var context = this._$canvas[0].getContext('2d');

    var canvasWidth = this._$canvas[0].width;
    var canvasHeight = this._$canvas[0].height;

    context.shadowBlur = Blurb.SHADOW_BLUR * this._canvasScale;
    context.shadowColor = Blurb.SHADOW_COLOR;
    context.fillStyle = 'white';

    context.beginPath();

    var arrowHeight = Blurb.ARROW_HEIGHT * this._canvasScale;
    var shadowInset = Blurb.SHADOW_INSET * this._canvasScale;

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

  Blurb.prototype._positionLabels = function() {
    var topOffset = (this._arrowOnTop ? Blurb.ARROW_HEIGHT : 0);
    this._$stdDev.css({marginTop: topOffset + Blurb.CONTENT_PADDING});
  };

  function calculateElementSize($element) {
    var oldCSS = $element.css(['position', 'top', 'left', 'visibility']);

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

    $element.detach().css(oldCSS);
    return res;
  }

  function generateOverview(stats) {
    var solvesRow = '<div class="row"><label>Solves:</label>' + stats.count +
      '</div>';

    if (stats.count === 0) {
      return $('<div id="averages-overview">' + solvesRow + '</div>');
    }

    var meanRow = '';
    if (!isNaN(stats.mean)) {
      meanRow = '<div class="row"><label>Mean:</label>' +
        window.app.formatTime(stats.mean) + '</div>';
    }
    var bestRow = '';
    if (stats.best !== null) {
      bestRow = '<div class="row"><label>Best:</label>' +
        window.app.formatTime(window.app.solveTime(stats.best)) + '</div>';
    }
    return $('<div id="averages-overview">' + solvesRow + meanRow + bestRow +
      '</div>');
  }

  window.app.Averages = Averages;

})();
