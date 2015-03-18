(function() {
  
  var MIN_TIME_SIZE = 30;
  var MEMO_SIZE = 20;
  var 
  
  function Middle() {
    this._element = $('#middle');
    this._memoTime = this._element.find('.memo-time');
    this._pbStatus = this._element.find('.pb-status');
    this._scramble = this._element.find('.scramble');
    this._time = this._element.find('.time');
  }
  
  Middle.prototype.layout = function(maxHeight) {
    
  };
  
  Middle.prototype.minHeight = function() {
    // Minimum time height + minimum memo time height + minimum "new PB" height.
    return 
  };
  
  window.app.Middle = Middle;
  
})();