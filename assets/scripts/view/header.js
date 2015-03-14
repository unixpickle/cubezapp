(function() {
  
  function Header() {
    this._element = $('#header');
    this._name = this._element.find('.top .name');
    this._scramble = this._element.find('.top .scramble');
    
    // This label is used to compute the size of a scramble.
    this._scrambleTest = $('<label>');
    this._scrambleTest.css({
      'font-family': this._scramble.css('font-family'),
      'font-size': this._scramble.css('font-size'),
      'white-space': 'nowrap',
      height: 'auto',
      width: 'auto',
      position: 'absolute',
      visibility: 'hidden'
    });
    $(document).append(this._scrambleTest);
  }
  
  Header.prototype.showScramble = function(scramble) {
    // TODO: support something on the right of the header...
    
    // Put the text inside the test label and measure it.
    this._scrambleTest.text(scramble);
    var width = this._scrambleTest.width();
    
    var nameWidth = this._name.width();
    // NOTE: we multiply nameWidth by 2 because the text is centered.
    if (width+nameWidth*2 > this._element.width()) {
      // Scramble is too long.
      this._scramble.css({display: 'none'});
      return false;
    }
    
    // Show the scramble.
    this._scramble.text(scramble);
    this._scramble.css({display: 'block'});
  };
  
})();