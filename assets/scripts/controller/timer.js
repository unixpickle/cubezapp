(function() {
  
  function Timer() {
    this._enabled = false;
    this._running = false;
    this._startTime = null;
    this._interval = null;
    
    this.onStart = null;
    this.onChange = null;
    this.onStop = null;
    
    this.dontProcessUp = false;
    
    if ('ontouchstart' in document) {
      $('#temp-scramble').css({'font-size': '17px'});
      $('#main-content').on('touchstart', function() {
        if (!this._running) {
          return;
        }
        this.startDown();
      }.bind(this));
      $('#main-content').on('touchend', function() {
        if (!this._enabled) {
          return;
        }
        this.startUp();
      }.bind(this));
    }
    
    // Space bar event for starting.
    // Note: we should ignore keyup events if they occur right after a keydown
    // event stopped the time.
    $(document).keyup(function(k) {
      if (!this._enabled) {
        return;
      }
      var keyCode = k.charCode || k.keyCode;
      if (keyCode === 0x20) {
        k.preventDefault();
        k.stopPropagation();
        this.startUp();
      }
    }.bind(this));
    $(document).keydown(function(k) {
      if (!this._running) {
        return;
      }
      var keyCode = k.charCode || k.keyCode;
      if (keyCode === 0x20) {
        k.preventDefault();
        k.stopPropagation();
        this.startDown();
      }
    }.bind(this));
    $(document).keypress(function(k) {
      var keyCode = k.charCode || k.keyCode;
      if (keyCode === 0x20) {
        k.preventDefault();
        k.stopPropagation();
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
      if ('function' === typeof this.onChange) {
        this.onChange(delay);
      }
    }.bind(this), 43);
  };
  
  Timer.prototype.startDown = function() {
    this.dontProcessUp = true;
    var time = this.stop();
    if ('function' === typeof this.onStop) {
      this.onStop(time);
    }
  };
  
  Timer.prototype.startUp = function() {
    if (this.dontProcessUp) {
      this.dontProcessUp = false;
      return;
    }
    this.start();
    if ('function' === typeof this.onStart) {
      this.onStart();
    }
  };
  
  Timer.prototype.stop = function() {
    if (!this._running) {
      return;
    }
    this._running = false;
    clearInterval(this._interval);
    return (new Date()).getTime() - this._startTime;
  };
  
  if (!window.app) {
    window.app = {};
  }
  window.app.Timer = Timer;
  
})();