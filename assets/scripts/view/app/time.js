(function() {
  
  function Time() {
    // View components.
    this._$element = $('#time');
    this._elementStyler = new window.app.Styler(this._$element[0]);
    this._$label = this._$element.find('label');
    this._labelStyler = new window.app.Styler(this._$label[0]);
    this._$blinker = this._$element.find('.blinker');
    this._blinkerStyler = new window.app.Styler(this._$blinker[0]);
    
    // This state is used to adjust the font size for different text values.
    this._text = this._$label.text();
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
      this._elementStyler.css({display: 'none'});
      return;
    }
    
    // Layout main scene.
    this._elementStyler.css({
      display: 'block',
      opacity: attrs.timeOpacity,
      top: attrs.timeY + attrs.middleY,
      height: attrs.timeSize
    });
    this._labelStyler.css({
      height: attrs.timeSize,
      fontSize: this._usableFontSize() + 'px',
      lineHeight: attrs.timeSize + 'px'
    });
    
    if (this._showingBlinker) {
      // Layout blinker.
      this._blinkerStyler.css({
        left: this._$label.offset().left + this._$label.outerWidth()
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
    this._$label.text(text);
    this._labelStyler.css({'font-size': this._usableFontSize() + 'px'});
    this._setBlinkerVisible(this._showingBlinker);
  };
  
  Time.prototype._setBlinkerVisible = function(flag) {
    if (!flag) {
      this._blinkerStyler.css({display: 'none'});
      return;
    }
    
    // Layout blinker.
    this._blinkerStyler.css({
      display: 'block',
      left: this._$label.offset().left + this._$label.outerWidth()
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