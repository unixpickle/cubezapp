(function() {
  
  var MIN_TIME_SIZE = 30;
  var MEMO_SIZE_RATIO = 0.5;
  
  function Middle() {
    this._element = $('#middle');
    this._memoTime = this._element.find('.memo-time');
    this._pbStatus = this._element.find('.pb-status');
    this._scramble = this._element.find('.scramble');
    this._time = this._element.find('.time');
  }
  
  Middle.prototype.constraints = function() {
    // TODO: return {minSize: ..., hardMinSize: ...}
  };
  
  window.app.Middle = Middle;
  
})();