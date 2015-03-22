// This is a simple API for receiving touch-down and touch-up events for the
// timer.
(function() {
  
  function Touches() {
    this.onDown = null;
    this.onUp = null;
    this._down = false;
    this._enabled = false;
    
    // Make sure their device has a touch screen.
    if (!('ontouchstart' in document)) {
      return;
    }
    
    // Setup touch events.
    var element = $('#middle');
    element.on('touchstart', this._start.bind(this));
    element.on('touchend', this._stop.bind(this));
  }
  
  Touches.prototype.disable = function() {
    this._enabled = false;
  };
  
  Touches.prototype.enable = function() {
    this._enabled = true;
  };
  
  Touches.prototype._start = function() {
    if (this._down) {
      return;
    }
    this._down = true;
    if ('function' === typeof this.onDown) {
      this.onDown();
    }
  };
  
  Touches.prototype._stop = function() {
    if (!this._down) {
      return;
    }
    this._down = false;
    if ('function' === typeof this.onUp) {
      this.onUp();
    }
  };
  
  window.app.Touches = Touches;
  
})();