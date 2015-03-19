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
  
  Middle.prototype.constraints = function() {
    // Compute the soft and bare minimum sizes.
    var scrambleHeight = this._scramble.height();
    var bareMinimum = MIN_TIME_SIZE * (1 + MEMO_SIZE_RATIO) + PB_SIZE;
    var softMinimum = bareMinimum + scrambleHeight + SCRAMBLE_PADDING*2;
    return {bare: bareMinimum, soft: softMinimum};
  };

  Middle.prototype.layout = function(attrs) {
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
    this._time.css({
      opacity: attrs.timeOpacity,
      top: attrs.timeY,
      'font-size': attrs.timeSize * attrs.timeScale
    });
  };

  Middle.prototype.setMemo = function(memo) {
    this._memoTime.text(text || '');
  };

  Middle.prototype.setScramble = function(text) {
    this._scramble.text(text || '');
  };

  Middle.prototype.setTime = function(time) {
    this._time.text(text || '');
  };
  
  window.app.Middle = Middle;
  
})();
