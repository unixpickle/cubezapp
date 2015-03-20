(function() {
  
  var MEMO_SIZE_RATIO = 0.5;
  var MIN_TIME_SIZE = 30;
  var PB_SIZE = 18;
  var SCRAMBLE_PADDING = 10;
  
  function Middle() {
    this._element = $('#middle');
    this._memoTime = this._element.find('.memo-time');
    this._pbStatus = this._element.find('.pb-status');
    this._scramble = this._element.find('.scramble');
    this._time = this._element.find('.time');
  }
  
  Middle.prototype.computeLayout = function(height, showScramble) {
    var maxForWidth = $(window).width() / 5;
    
    var timeY;
    var timeSize;
    if (showScramble) {
      var usedSpace = this.scrambleHeight() + SCRAMBLE_PADDING*2
      var usableSize = height - usedSpace;
      timeSize = (usableSize-PB_SIZE) / (1+MEMO_SIZE_RATIO);
      timeSize = Math.min(Math.max(timeSize, MIN_TIME_SIZE), maxForWidth);
      timeY = (usableSize-timeSize)/2 + usedSpace;
    } else {
      timeSize = (height-PB_SIZE) / (1+MEMO_SIZE_RATIO);
      timeSize = Math.min(Math.max(timeSize, MIN_TIME_SIZE), maxForWidth);
      timeY = (height-timeSize) / 2;
    }
    return {timeY: timeY, timeSize: timeSize};
  };
  
  Middle.prototype.constraints = function() {
    // Compute the soft and bare minimum sizes assuming no scramble.
    var bareMinimum = MIN_TIME_SIZE * (1 + MEMO_SIZE_RATIO) + PB_SIZE;
    var softMinimum = bareMinimum;

    // If there is a scramble, it contributes to the soft minimum.
    if (this._scramble.text().length > 0) {
      var scrambleHeight = this.scrambleHeight();
      softMinimum = bareMinimum + scrambleHeight + SCRAMBLE_PADDING*2;
    }

    return {bare: bareMinimum, soft: softMinimum};
  };

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
      this._pbStatus.css({opacity: attrs.pbOpacity, display: 'block'});
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
    if (attrs.timeOpacity === 0) {
      this._time.css({display: 'none'});
    } else {
      var transform = 'none';
      if (attrs.timeScale) {
        transform = 'scale(' + attrs.timeScale + ',' + attrs.timeScale + ')';
      }
      this._time.css({
        display: 'block',
        opacity: attrs.timeOpacity,
        top: attrs.timeY,
        height: attrs.timeSize,
        'font-size': attrs.timeSize*0.8,
        transform: transform,
        '-ms-transform': transform,
        '-webkit-transform': transform
      });
    }
  };
  
  Middle.prototype.scrambleHeight = function() {
    return this._scramble.height();
  }

  Middle.prototype.setMemo = function(memo) {
    this._memoTime.text(text || '');
  };

  Middle.prototype.setPB = function(pb) {
    this._pbStatus.text(pb || '');
  }

  Middle.prototype.setScramble = function(text) {
    this._scramble.text(text || '');
  };

  Middle.prototype.setTime = function(time) {
    this._time.text(text || '');
  };
  
  window.app.Middle = Middle;
  
})();
