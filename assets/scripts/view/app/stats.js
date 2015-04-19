(function() {
  
  var GRAPH_MIN_WIDTH = 500;
  var AVERAGES_MIN_WIDTH = 300;
  var COLUMN_PADDING = 3;
  
  function Stats() {
    this._movingPane = $('#footer .stats-moving-pane');
    this._grayPuzzleIcon = $('#footer .stats-empty > .gray-icon');
    this._contents = $('#footer .stats-not-empty');
    
    this.averages = new window.app.Averages();
    this.graph = new window.app.Graph();
    this.timesList = new window.app.TimesList();
    
    this._contents.append([this.averages, this.graph, this.timesList]);
    this.graph.setVisible(false);
    this.averages.setVisible(false);
    
    this._showingStats = false;
  }
  
  Stats.prototype.layout = function() {
    this._layoutContent();
    
    var contentHeight = this._movingPane.height() / 2;
    var iconHeight = Math.floor(contentHeight - 70);
    var iconWidth = Math.floor(iconHeight * (746/505));
    this._grayPuzzleIcon.css({
      height: iconHeight,
      backgroundSize: iconWidth + 'px ' + iconHeight + 'px'
    });
    
    if (!this._showingStats) {
      var newTop = -contentHeight;
      this._movingPane.css({top: newTop});
    }
  };
  
  Stats.prototype.setPuzzle = function(puzzle) {
    var icon = 'images/gray_puzzles/' + puzzle.icon + '.png';
    this._grayPuzzleIcon.css({backgroundImage: 'url(' + icon + ')'});
  };
  
  Stats.prototype.setShowingStats = function(flag, animate) {
    if (this._showingStats === flag) {
      return;
    }
    this._showingStats = flag;
    if (flag) {
      if (animate) {
        this._movingPane.animate({top: 0});
      } else {
        this._movingPane.css({top: 0});
      }
    } else {
      var newTop = -this._movingPane.height() / 2;
      if (animate) {
        this._movingPane.animate({top: newTop});
      } else {
        this._movingPane.css({top: newTop});
      }
    }
  };
  
  Stats.prototype._layoutContent = function() {
    var width = this._movingPane.width();
    if (width < AVERAGES_MIN_WIDTH) {
      this.graph.setVisible(false);
      this.averages.setVisible(false);
      this.timesList.layout(contentWidth);
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
  
  window.app.Stats = Stats;
  
})();