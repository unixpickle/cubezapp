(function() {
  
  // A Styler sets and caches CSS attributes for an element.
  function Styler(element) {
    this.element = element;
    this.cached = {};
  }
  
  // css updates the CSS attributes of the element.
  Styler.prototype.css = function(attrs) {
    // TODO: optimize the hell out of this routine.
    
    for (var key in attrs) {
      var value = attrs[key];
      if ('number' === typeof value) {
        if (key === 'opacity') {
          value = '' + value;
        } else {
          value = value + 'px';
        }
      }
      if (this.cached[key] !== value) {
        this.cached[key] = value;
        this.element.style[key] = value;
      }
    }
  };
  
  window.app.Styler = Styler;
  
})();