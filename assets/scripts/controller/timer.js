(function() {
  
  function Timer() {
    this._enabled = false;
    this._running = false;
    this._startTime = null;
    this._interval = null;
    
    this.onstart = null;
    this.onchange = null;
    this.onstop = null;
    
    // Space bar event for starting.
    // Note: we should ignore keyup events if they occur right after a keydown
    // event stopped the time.
    var dontProcessUp = false;
    $(document).keyup(function(k) {
      if (!this._enabled) {
        return;
      } else if (dontProcessUp) {
        dontProcessUp = false;
        return;
      }
      var keyCode = k.charCode || k.keyCode;
      if (keyCode === 0x20) {
        k.preventDefault();
        this.start();
        if (this.onstart) {
          this.onstart();
        }
      }
    }.bind(this));
    $(document).keydown(function(k) {
      if (!this._running) {
        return;
      }
      var keyCode = k.charCode || k.keyCode;
      if (keyCode === 0x20) {
        k.preventDefault();
        dontProcessUp = true;
        var solve = this.stop();
        if (this.onstop) {
          this.onstop(solve);
        }
      }
    }.bind(this));
  }
  
  Timer.prototype.disable = function() {
    this._enabled = false;
    if (this._running) {
      this.stop();
    }
  };
  
  Timer.prototype.enable = function() {
    this._enabled = true;
  };
  
  Timer.prototype.start = function() {
    if (this._running) {
      return;
    }
    this._running = true;
    this._startTime = (new Date()).getTime();
    this._interval = setInterval(function() {
      var delay = (new Date()).getTime() - this._startTime;
      var solve = new window.app.Solve(delay);
      if (this.onchange) {
        this.onchange(solve);
      }
    }.bind(this), 43);
  };
  
  Timer.prototype.stop = function() {
    if (!this._running) {
      return;
    }
    this._running = false;
    clearInterval(this._interval);
    var delay = (new Date()).getTime() - this._startTime;
    return new window.app.Solve(delay);
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.timer = new Timer();
  
})();