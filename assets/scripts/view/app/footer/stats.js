(function() {

  var GRAPH_MIN_WIDTH = 500;
  var AVERAGES_MIN_WIDTH = 300;
  var COLUMN_PADDING = 3;

  var BLURB_FONT_SIZE = 18;
  var BLURB_TEXT_COLOR = '#999';
  var BLURB_FONT_FAMILY = 'Oxygen, sans-serif';
  var BLURB_ARROW_HEIGHT = 12;
  var BLURB_MIN_X = 10;
  var BLURB_ARROW_MIN_MARGIN = 10;

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

  window.app.Stats = Stats;

})();
