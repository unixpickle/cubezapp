(function() {

  function Time() {
    // View components.
    this._$element = $('#time');
    this._$label = this._$element.find('label');
    this._$blinker = this._$element.find('.blinker');

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
      this._$element.css({display: 'none'});
      return;
    }

    // Layout main scene.
    this._$element.css({
      display: 'block',
      opacity: attrs.timeOpacity,
      top: attrs.timeY + attrs.middleY,
      height: attrs.timeSize
    });
    this._$label.css({
      height: attrs.timeSize,
      fontSize: this._usableFontSize() + 'px',
      lineHeight: attrs.timeSize + 'px'
    });

    if (this._showingBlinker) {
      this._$blinker.css({
        left: this._$label.offset().left + this._$label.outerWidth()
      });
    }
  };

  Time.prototype.setBlinking = function(flag) {
    if (!flag) {
      this._showingBlinker = false;
      this._setBlinkerVisible(false);
      if (this._blinkInterval !== null) {
        clearInterval(this._blinkInterval);
        this._blinkInterval = null;
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
    this._$label.css({fontSize: this._usableFontSize() + 'px'});
    this._setBlinkerVisible(this._showingBlinker);
  };

  Time.prototype._setBlinkerVisible = function(flag) {
    if (!flag) {
      this._$blinker.css({display: 'none'});
    } else {
      this._$blinker.css({
        display: 'block',
        left: this._$label.offset().left + this._$label.outerWidth()
      });
    }
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
