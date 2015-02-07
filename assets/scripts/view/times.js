(function() {
  
  var ROW_HEIGHT = 44;
  var MORE_BUFFER = 20;
  
  function Times(element) {
    this.element = element;
    this.buffer = new window.app.SolveBuffer();
    
    // Setup buffer
    this.buffer.onMoreLoaded = this._moreLoaded.bind(this);
    this.buffer.onReload = this._changed.bind(this);
    this.buffer.reload();
    
    // Make scrolling to the bottom load more data.
    this.element.scroll(function() {
      var last = this.lastVisibleRow();
      if (last+MORE_BUFFER > this.buffer.getSolves().length) {
        this.buffer.requestMore();
      }
    }.bind(this));
  }
  
  Times.prototype.add = function(solve) {
    this.buffer.add(solve);
    var element = this._elementForSolve(solve);
    this.element.prepend(element);
  };
  
  Times.prototype.lastVisibleRow = function() {
    var offset = this.element.scrollTop();
    var height = this.element.height();
    return Math.ceil((offset+height) / ROW_HEIGHT);
  };
  
  Times.prototype._appendSolves = function(solves) {
    for (var i = 0, len = solves.length; i < len; ++i) {
      var solve = solves[i];
      var element = this._elementForSolve(solve);
      this.element.append(element);
    }
  }
  
  Times.prototype._changed = function() {
    this.element.html('');
    this._appendSolves(this.buffer.getSolves());
  };
  
  Times.prototype._elementForSolve(solve) {
    var row = $('<div />');
    var label = $('<label class="time" />');
    var deleteButton = $('<button class="delete" />');
    
    row.append(label);
    row.append(deleteButton);
    return row;
  }
  
  Times.prototype._moreLoaded = function(count) {
    var solves = this.buffer.getSolves();
    solves = solves.slice(solves.length-count, solves.length);
    this._appendSolves(solves);
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Times = Times;
  
})();