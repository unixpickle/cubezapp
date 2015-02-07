(function() {
  
  var ROW_HEIGHT = 40;
  var MORE_BUFFER = 20;
  
  function Times(element) {
    this._selected = -1;
    this._rows = [];
    
    this.buffer = new window.app.SolveBuffer();
    this.element = element;
    this.onDelete = null;
    this.onSelect = null;
    
    // Setup buffer
    this.buffer.onMoreLoaded = this._moreLoaded.bind(this);
    this.buffer.onReload = this._changed.bind(this);
    this.buffer.reload();
    
    // Make scrolling to the bottom load more data.
    this.element.parent().on('scroll', function() {
      var last = this.lastVisibleRow();
      if (last+MORE_BUFFER > this.buffer.getSolves().length) {
        this.buffer.requestMore();
      }
    }.bind(this));
  }
  
  Times.prototype.add = function(solve) {
    this.deselect();
    this.buffer.add(solve);
    var element = this._elementForSolve(solve);
    this.element.prepend(element);
    this._rows.splice(0, 0, element);
  };
  
  Times.prototype.deleteSolve = function(id) {
    this.deselect();
    var idx = this.buffer.deleteSolve(id);
    if (idx >= 0) {
      this._rows[idx].remove();
      this._rows.splice(idx, 1);
    }
  }
  
  Times.prototype.deselect = function() {
    if (this._selected < 0) {
      return;
    }
    var row = this._rows[this._selected];
    row.removeClass('row-selected');
    this._selected = -1;
  };
  
  Times.prototype.lastVisibleRow = function() {
    var p = this.element.parent();
    var offset = p.scrollTop();
    var height = p.height();
    return Math.ceil((offset+height) / ROW_HEIGHT);
  };
  
  Times.prototype.reload = function() {
    this.buffer.reload();
  };
  
  Times.prototype.select = function(solve) {
    this.deselect();
    var idx = this.buffer.getSolves().indexOf(solve);
    if (idx < 0) {
      throw new Error('Select puzzle that does not exist.');
    }
    var row = this._rows[idx];
    row.addClass('row-selected');
    this._selected = idx;
  };
  
  Times.prototype._appendSolves = function(solves) {
    for (var i = 0, len = solves.length; i < len; ++i) {
      var solve = solves[i];
      var element = this._elementForSolve(solve);
      this.element.append(element);
      this._rows.push(element);
    }
  };
  
  Times.prototype._changed = function() {
    this._selected = -1;
    this._rows = [];
    this.element.html('');
    this._appendSolves(this.buffer.getSolves());
  };
  
  Times.prototype._elementForSolve = function(solve) {
    var row = $('<div class="row" />');
    var label = $('<label class="time" />');
    var deleteButton = $('<button class="delete" />');
    
    label.text(window.app.solveToHTML(solve));
    
    row.append(label);
    row.append(deleteButton);
    
    row.click(function() {
      this.select(solve);
      if ('function' === typeof this.onSelect) {
        this.onSelect(solve);
      }
    }.bind(this));
    
    deleteButton.click(function(e) {
      e.stopPropagation();
      if ('function' === typeof this.onDelete) {
        this.onDelete(solve);
      }
    }.bind(this));
    
    return row;
  };
  
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