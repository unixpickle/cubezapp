(function() {
  
  function Header() {
    this._element = $('#header');
  }

  Header.prototype.height = function() {
    return 44;
  };
  
  Header.prototype.layout = function(attrs) {
    if (attrs.headerOpacity === 0) {
      this._element.css({display: 'none'});
    } else {
      this._element.css({
        display: 'block',
        opacity: attrs.headerOpacity,
        top: attrs.headerOffset
      });
    }
  }
  
  window.app.Header = Header;
  
})();
