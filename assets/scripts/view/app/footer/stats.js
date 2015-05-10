(function() {

  var GRAPH_MIN_WIDTH = 500;
  var AVERAGES_MIN_WIDTH = 300;
  var COLUMN_PADDING = 3;
  
  var BLURB_FONT_SIZE = 18;
  var BLURB_TEXT_COLOR = '#999';
  var BLURB_FONT_FAMILY = 'Oxygen, sans-serif';
  var BLURB_ARROW_HEIGHT = 12;
  var BLURB_MIN_X = 10;

  function Stats() {
    this._$movingPane = $('#footer .stats-moving-pane');
    this._$grayPuzzleIcon = $('#footer .stats-empty > .gray-icon');
    this._$contents = $('#footer .stats-not-empty');

    this.averages = new window.app.Averages();
    this.graph = new window.app.Graph();
    this.timesList = new window.app.TimesList();

    this.averages.on('needsLayout', this._childNeedsLayout.bind(this));

    this._$contents.append([this.averages, this.graph, this.timesList]);
    this.graph.setVisible(false);
    this.averages.setVisible(false);

    this._showingStats = false;
    this._registerModelEvents();
    this._initializeUI();
  }

  Stats.prototype.layout = function() {
    this._layoutContent();

    var contentHeight = this._$movingPane.height() / 2;
    var iconHeight = Math.floor(contentHeight - 70);
    var iconWidth = Math.floor(iconHeight * (746/505));
    this._$grayPuzzleIcon.css({
      height: iconHeight,
      backgroundSize: iconWidth + 'px ' + iconHeight + 'px'
    });

    if (!this._showingStats) {
      var newTop = -contentHeight;
      this._$movingPane.css({top: newTop});
    }
  };

  Stats.prototype._childNeedsLayout = function() {
    if (window.app.view.footer.visible()) {
      this.layout();
    }
  };

  Stats.prototype._handleIconChanged = function() {
    var iconName = window.app.store.getActivePuzzle().icon;
    var iconPath = 'images/gray_puzzles/' + iconName + '.png';
    this._$grayPuzzleIcon.css({backgroundImage: 'url(' + iconPath + ')'});
  };

  Stats.prototype._handleSolveChanged = function() {
    var showing = (window.app.store.getLatestSolve() !== null);
    var animate = false;
    this._setShowingStats(showing, animate);
  };

  Stats.prototype._initializeUI = function() {
    this._handleIconChanged();
    this._handleSolveChanged();
  };

  Stats.prototype._layoutContent = function() {
    var width = this._$movingPane.width();
    if (width < AVERAGES_MIN_WIDTH) {
      this.graph.setVisible(false);
      this.averages.setVisible(false);
      this.timesList.layout(width);
    } else if (width < GRAPH_MIN_WIDTH) {
      this.graph.setVisible(false);
      this.averages.setVisible(true);
      this.timesList.layout();
      this.averages.layout(width - this.timesList.width() -
        COLUMN_PADDING);
    } else {
      this.graph.setVisible(true);
      this.averages.setVisible(true);
      this.timesList.layout();
      this.averages.layout();
      var left = this.timesList.width();
      var graphWidth = width - (left + this.averages.width());
      this.graph.layout(left+COLUMN_PADDING, graphWidth-COLUMN_PADDING*2);
    }
  };

  Stats.prototype._registerModelEvents = function() {
    window.app.observe.latestSolve('id', this._handleSolveChanged.bind(this));
    window.app.observe.activePuzzle('icon', this._handleIconChanged.bind(this));
  };

  Stats.prototype._setShowingStats = function(flag, animate) {
    if (this._showingStats === flag) {
      return;
    }
    this._showingStats = flag;
    if (flag) {
      if (animate) {
        this._$movingPane.animate({top: 0});
      } else {
        this._$movingPane.css({top: 0});
      }
    } else {
      var newTop = -this._$movingPane.height() / 2;
      if (animate) {
        this._$movingPane.animate({top: newTop});
      } else {
        this._$movingPane.css({top: newTop});
      }
    }
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
    this._width = 0;
    this._height = 0;
    this._computeSize();
    
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
  }
  
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

  window.app.Stats = Stats;

})();
