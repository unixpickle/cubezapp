(function() {
  
  function Times() {
    this.buffer = [];
    this.count = 0;
    this.start = 0;
    
    window.app.store.onPuzzlesChanged = this._changed.bind(this);
    this._changed();
  }
  
  Times.prototype.visibleRange = function() {
    
  };
  
  Times.prototype._changed = function() {
    window.app.store.getPuzzleCount(function(err, count) {
      if (err !== null) {
        return;
      }
      var oldCount = this.count;
      this.count = count;
    }.bind(this));
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Times = Times;
  
})();