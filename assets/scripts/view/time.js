(function() {
  
  function Time() {
    // View components.
    this._element = $('#middle .time');
    this._label = this._element.find('label');
    this._blinker = this._element.find('.blinker');
    
    // Blinker state.
    this._showingBlinker = false;
    this._blinkInterval = null;
  }
  
  Time.prototype.layout = function(attrs) {
    if (attrs.timeOpacity === 0) {
      this._element.css({display: 'none'});
      return;
    }
    
    var transform = 'none';
    if (attrs.timeScale) {
      transform = 'scale(' + attrs.timeScale + ',' + attrs.timeScale + ')';
    }
    
    // Layout main scene.
    this._element.css({
      display: 'block',
      opacity: attrs.timeOpacity,
      top: attrs.timeY,
      height: attrs.timeSize,
      'font-size': attrs.timeSize + 'px',
      'line-height': attrs.timeSize + 'px',
      transform: transform,
      '-ms-transform': transform,
      '-webkit-transform': transform
    });
    this._label.css({
      height: attrs.timeSize,
      'font-size': attrs.timeSize + 'px',
      'line-height': attrs.timeSize + 'px'
    });
    
    if (this._showingBlinker) {
      // Layout blinker.
      this._blinker.css({
        left: this._label.offset().left + this._label.outerWidth()
      });
    }
  };
  
  Time.prototype.setBlinking = function(flag) {
    if (!flag) {
      // Hide the blinker and stop blinking.
      this._setBlinkerVisible(false);
      if (this._blinkInterval !== null) {
        clearInterval(this._blinkInterval);
      }
      return;
    }
    
    if (this._blinkInterval !== null) {
      return;
    }
    
    this._blinkInterval = setInterval(function() {
      this._showingBlinker = !this._showingBlinker;
      this._setBlinkerVisible(this._showingBlinker);
    }.bind(this), 500);
  };
  
  Time.prototype.text = function(text) {
    this._label.text(text);
    this._setBlinkerVisible(this._showingBlinker);
  }
  
  Time.prototype._setBlinkerVisible = function(flag) {
    if (!flag) {
      this._blinker.css({display: 'none'});
      return;
    }
    
    // Layout blinker.
    this._blinker.css({
      display: 'block',
      left: this._label.offset().left + this._label.outerWidth()
    });
  };
  
  window.app.Time = Time;
  
})();