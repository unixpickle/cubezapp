(function() {
  
  function Middle() {
    this._element = $('#middle');
    this._scramble = this._element.find('.scramble');
    this._time = this._element.find('.time');
    this._pbStatus = this._element.find('.pb-status');
    this._showingScramble = false;
    this._animateScramble = false;
  }
  
  Middle.prototype.hideScramble = function(animate) {
    
  };
  
  Middle.prototype.layout = function(maxHeight) {
    
  };
  
  Middle.prototype.showScramble = function(scramble, animate) {
    
  };
  
  window.app.Middle = Middle;
  
})();