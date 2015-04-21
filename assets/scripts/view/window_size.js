(function() {
  
  // WindowSize tracks the current window size without the added pain of browser
  // reflow.
  function WindowSize() {
    this.width = $(window).width();
    this.height = $(window).height();
    this._listeners = [];
    $(window).resize(this._handler.bind(this));
  }
  
  WindowSize.prototype.addListener = function(listener) {
    this._listeners.push(listener);
  };
  
  WindowSize.prototype.removeListener = function(listener) {
    var idx = this._listeners.indexOf(listener);
    if (idx >= 0) {
      this._listeners.splice(idx, 1);
    }
  };
  
  WindowSize.prototype._handler = function() {
    this.width = $(window).width();
    this.height = $(window).height();
    
    // Assert that the window dimensions are valid.
    if ('number' !== typeof this.width || 'number' !== typeof this.height ||
        isNaN(this.width) || isNaN(this.height)) {
      throw new Error('invalid window dimensions: ' + this.width + ', ' +
        this.height);
    }
    
    // Copy the listeners before calling them since each listener could call
    // addListener() or removeListener().
    var listenerCopy = this._listeners.slice();
    for (var i = 0, len = listenerCopy.length; i < len; ++i) {
      listenerCopy[i]();
    }
  };
  
  window.app.WindowSize = WindowSize;
  
})();