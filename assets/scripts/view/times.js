(function() {
  
  var ROW_HEIGHT = 44;
  var BUFFER_SIZE = 1000;
  var SAFE_BUFFER = 20;
  
  function Times(element) {
    this.count = 0;
    this.element = element;
    this.solves = [];
    this.start = 0;
    
    window.app.store.onSolvesChanged = this._changed.bind(this);
    this._changed();
    
    this.currentTicket = 0;
    this.loadingMore = false;
    this.element.scroll(function() {
      if (this.visibleRange[1]+SAFE_BUFFER > this.solves.length &&
          this.solves.length < this.count) {
        this._loadMore();
      }
    }.bind(this));
  }
  
  Times.prototype.visibleRange = function() {
    var offset = this.element.scrollTop();
    var height = this.element.height();
    var rowOffset = Math.floor(offset / ROW_HEIGHT);
    var bottomRow = Math.ceil((offset+height) / ROW_HEIGHT);
    return [rowOffset, bottomRow];
  };
  
  Times.prototype._changed = function() {
    this._updateSolves(function() {
      this.count = count;
      this.solves = solves;
      this.element.html('');
      for (var i = 0, len = this.solves.length; i < len; ++i) {
        var solve = this.solves[i];
        var element = elementForSolve(solve);
        this.element.append(element);
      }
    }.bind(this));
  };
  
  Times.prototype._loadMore = function() {
    if (this.loadingMore) {
      return;
    }
    this.loadingMore = true;
    
    // Get the next range
    var len = this.count - this.solves.length;
    if (len > BUFFER_SIZE) {
      len = BUFFER_SIZE;
    }
    var start = this.count - (len+this.solves.length);
    
    // Fetch the data
    var ticket = ++this.currentTicket;
    window.app.store.getSolves(start, len, function(err, solves) {
      if (ticket !== this.currentTicket) {
        return;
      }
      this.loadingMore = false;
      if (err !== null) {
        return;
      }
      for (var i = 0, len = solves.length; i < len; ++i) {
        var solve = solves[i];
        var element = elementForSolve(solve);
        this.elements.append(element);
      }
    }.bind(this));
  };
  
  Times.prototype._updateSolves = function(cb) {
    var ticket = ++this.currentTicket;
    window.app.store.getSolveCount(function(err, count) {
      if (err !== null || ticket !== this.currentTicket) {
        this.loadingMore = false;
        return;
      }
      var x = count;
      if (x > BUFFER_SIZE) {
        x = BUFFER_SIZE;
      }
      window.app.store.getSolves(count-x, x, function(err, solves) {
        if (err !== null || ticket !== this.currentTicket) {
          return;
        }
        this.currentTicket++;
        this.solves = solves;
        this.count = count;
        cb();
      }.bind(this));
    }.bind(this));
  }
  
  function elementForSolve(solve) {
    var row = $('<div />');
    var label = $('<label class="time" />');
    var deleteButton = $('<button class="delete" />');
    
    row.append(label);
    row.append(deleteButton);
    return row;
  }
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Times = Times;
  
})();