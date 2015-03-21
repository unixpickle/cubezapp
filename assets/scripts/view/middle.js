// The "middle" of the page contains scrambles, times, and some miscellaneous
// labels. This code helps manage the middle of the webpage.
(function() {
  
  var MEMO_SIZE_RATIO = 0.3;
  var MIN_TIME_SIZE = 50;
  var PB_SIZE_RATIO = 0.2;
  var SCRAMBLE_PADDING = 10;
  
  function Middle() {
    this._element = $('#middle');
    this._memoTime = this._element.find('.memo-time');
    this._pbStatus = this._element.find('.pb-status');
    this._scramble = this._element.find('.scramble');
    this._time = new window.app.Time();
  }
  
  // computeTimeLayout uses a size and a state to figure out the layout of the
  // view. It returns an object with a "timeY" and "timeSize" attribute. 
  Middle.prototype.computeTimeLayout = function(width, height, pb, scramble,
    memo) {
    // The "usageHeight" and "usableY" variables represent the space which can
    // be used for the time and memo time.
    var usableHeight = height - SCRAMBLE_PADDING*2;
    var usableY = SCRAMBLE_PADDING;
    if (scramble) {
      var diff = this.scrambleHeight() + SCRAMBLE_PADDING;
      usableY += diff;
      usableHeight -= diff;
    }
    
    if ('number' !== typeof usableHeight || isNaN(usableHeight)) {
      throw new Error('invalid usableHeight: ' + usableHeight);
    } else if ('number' !== typeof usableY || isNaN(usableY)) {
      throw new Error('invalid usableY: ' + usableY);
    }
    
    // If usableHeight is too small, the timer is as small as possible.
    if (usableHeight < 1) {
      return {timeY: 0, timeSize: 0};
    }
    
    // Figure out the font size of the timer text.
    // contentRatio represents usableHeight in terms of timer-font-size units.
    var contentRatio = 1;
    if (pb) {
      contentRatio += PB_SIZE_RATIO;
    }
    if (memo) {
      contentRatio += MEMO_SIZE_RATIO;
    }
    var timeSize = usableHeight / contentRatio;
    if (timeSize > width/5.5) {
      timeSize = width / 5.5;
    }
    
    if ('number' !== typeof timeSize || isNaN(timeSize)) {
      throw new Error('invalid timeSize: ' + timeSize);
    }
    
    // If the time font is less than a pixel tall, the timer is hidden.
    if (timeSize < 1) {
      return {timeY: 0, timeSize: 0};
    }
    
    // Compute the location of the time by centering it (with the memo time).
    if (pb) {
      usableHeight -= timeSize*PB_SIZE_RATIO;
    }
    var middleSize = timeSize;
    if (memo) {
      middleSize *= (1 + MEMO_SIZE_RATIO);
    } else {
      middleSize = timeSize;
    }
    var timeY = usableY + (usableHeight-middleSize)/2;
    
    if ('number' !== typeof timeY || isNaN(timeY)) {
      throw new Error('invalid timeY: ' + timeY + ' = ' + usableY + ' + (' +
        usableHeight + '-' + middleSize + ')/2');
    }
    
    return {timeY: timeY, timeSize: timeSize};
  };
  
  // computeConstraints uses the given arguments and some internal layout
  // information to figure out both a "bare" and a "soft" minimum size.
  // The "soft" minimum size represents the size which the middle can be while
  // still showing everything.
  // The "bare" minimum size represents the size which the middle can be while
  // still allowing the footer to be visible.
  // This returns an object with "soft" and "bare" properties.
  Middle.prototype.computeConstraints = function(pb, scramble, memo) {
    // Compute the minimum size wherein the footer can be visible.
    var bareMinimum = MIN_TIME_SIZE;
    if (memo) {
      bareMinimum *= 1 + MEMO_SIZE_RATIO;
    }
    if (pb) {
      bareMinimum += PB_SIZE_RATIO * MIN_TIME_SIZE;
    }
    bareMinimum += SCRAMBLE_PADDING*2;

    // Compute the minimum size wherein everything can be visible.
    var softMinimum = bareMinimum;
    if (scramble) {
      var scrambleHeight = this.scrambleHeight();
      softMinimum += scrambleHeight + SCRAMBLE_PADDING;
    }

    return {bare: bareMinimum, soft: softMinimum};
  };

  // layout updates attributes of various elements in the middle to reflect a
  // set of supplied animator attributes.
  Middle.prototype.layout = function(attrs) {
    this._element.css({height: attrs.middleHeight, top: attrs.middleY});
    
    // Memo time.
    if (attrs.memoOpacity === 0) {
      this._memoTime.css({display: 'none'});
    } else {
      this._memoTime.css({opacity: attrs.memoOpacity, display: 'block'});
    }
    
    // PB label.
    if (attrs.pbOpacity === 0) {
      this._pbStatus.css({display: 'none'});
    } else {
      var size = attrs.timeSize * PB_SIZE_RATIO;
      this._pbStatus.css({
        opacity: attrs.pbOpacity,
        display: 'block',
        'font-size': size*0.6,
        'line-height': size + 'px',
      });
    }
    
    // Show/hide the scramble without setting display=none. Otherwise, it would
    // not be possible to measure the scramble while it's invisible.
    if (attrs.scrambleOpacity === 0) {
      this._scramble.css({visibility: 'hidden'});
    } else {
      this._scramble.css({
        opacity: attrs.scrambleOpacity,
        visibility: 'visible'
      });
    }
    
    // Time label.
    this._time.layout(attrs);
    
    // Memo label.
    if (attrs.memoOpacity === 0) {
      this._memoTime.css({display: 'none'});
    } else {
      this._memoTime.css({
        top: attrs.timeY + attrs.timeSize,
        'font-size': attrs.timeSize * MEMO_SIZE_RATIO,
        height: attrs.timeSize * MEMO_SIZE_RATIO,
        'line-height': (attrs.timeSize*MEMO_SIZE_RATIO) + 'px',
        opacity: attrs.memoOpacity
      });
    }
  };
  
  // scrambleHeight returns the outer height of the scramble.
  Middle.prototype.scrambleHeight = function() {
    var height = this._scramble.outerHeight();
    if ('number' !== typeof height || isNaN(height)) {
      throw new Error('invalid scrambleHeight: ' + height);
    }
    return height;
  }

  // setMemo sets the memo time's text contents.
  Middle.prototype.setMemo = function(memo) {
    this._memoTime.text(memo || '');
  };

  // setPB sets the PB's text contents.
  Middle.prototype.setPB = function(pb) {
    this._pbStatus.text(pb || '');
  }

  // setScramble sets the scramble's text contents.
  Middle.prototype.setScramble = function(text) {
    this._scramble.text(text || '');
  };

  // setTime sets the time's text contents.
  Middle.prototype.setTime = function(time) {
    this._time.text(time || '');
  };
  
  // setTimeBlinking sets whether the time blinker is blinking.
  Middle.prototype.setTimeBlinking = function(flag) {
    this._time.setBlinking(flag);
  }
  
  window.app.Middle = Middle;
  
})();
