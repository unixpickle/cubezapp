(function() {
  
  function Time() {
    // View components.
    this._element = $('#middle .time');
    this._label = this._element.find('label');
    this._blinker = this._element.find('.blinker');
    
    // This state is used to adjust the font size for different text values.
    this._text = this._label.text();
    this._requestedFontSize = 0;
    
    // Blinker state.
    this._showingBlinker = false;
    this._blinkInterval = null;
  }
  
  Time.prototype.blink = function() {
    if (this._blinkInterval === null) {
      throw new Error('cannot call blink() when not blinking');
    }
    // Show the blinker.
    this._showingBlinker = true;
    this._setBlinkerVisible(true);
    
    // Reset the interval.
    clearInterval(this._blinkInterval);
    this._blinkInterval = setInterval(function() {
      this._showingBlinker = !this._showingBlinker;
      this._setBlinkerVisible(this._showingBlinker);
    }.bind(this), 500);
  };
  
  Time.prototype.layout = function(attrs) {
    this._requestedFontSize = attrs.timeSize;
    
    if (attrs.timeOpacity === 0) {
      this._element.css({display: 'none'});
      return;
    }
    
    var transform = 'none';
    if (attrs.timeScale) {
      transform = 'scale(' + attrs.timeScale + ', ' + attrs.timeScale + ')';
    }
    
    // Layout main scene.
    this._element.css({
      display: 'block',
      opacity: attrs.timeOpacity,
      top: attrs.timeY,
      height: attrs.timeSize,
      transform: transform,
      '-ms-transform': transform,
      '-webkit-transform': transform
    });
    this._label.css({
      height: attrs.timeSize,
      'font-size': this._usableFontSize() + 'px',
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
    this._text = text;
    this._label.text(text);
    this._label.css({'font-size': this._usableFontSize() + 'px'});
    this._setBlinkerVisible(this._showingBlinker);
  };
  
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
  
  Time.prototype._usableFontSize = function() {
    if (this._text === 'Hit Space' || this._text == 'Ready' ||
        this._text === 'Timing') {
      return this._requestedFontSize * 0.8;
    }
    return this._requestedFontSize;
  };
  
  window.app.Time = Time;
  
})();