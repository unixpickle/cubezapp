(function() {
  
  function Stats() {
    this._movingPane = $('#footer .stats-moving-pane');
    this._grayPuzzleIcon = $('#footer .stats-empty > .gray-icon');
    
    this.averages = new window.app.Averages();
    this.graph = new window.app.Graph();
    this.timesList = new window.app.TimesList();
    
    this._showingStats = false;
  }
  
  Stats.prototype.containerHidden = function() {
    // Close dropdowns here, etc.
  };
  
  Stats.prototype.layout = function() {
    this.averages.layout();
    this.graph.layout();
    this.timesList.layout();
    
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
  
  window.app.Stats = Stats;
  
})();