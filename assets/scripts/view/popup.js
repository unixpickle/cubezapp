// Popups provide both information and options to the user. They overlay the
// rest of the page. Popups can be layered on top of one another.
(function() {
  
  // A Popup presents a given element to the user.
  function Popup(element) {
    // This is necessary to ensure that the element is styled correctly.
    element.addClass('popup popup-hidden');
    
    // This state makes sure the popup isn't shown or closed more than once.
    this._shown = false;
    this._closed = false;
    
    // Generate UI components.
    this._element = element;
    
    // Relative coordinates of the windows.
    this._x = 0.5;
    this._y = 0.4;
    
    // Cache the size to avoid potential reflows.
    this._width = element.width();
    this._height = element.height();
    
    // Generating the shielding element.
    this._shielding = $('<div />', {class: 'popup-shielding'});
    this._shielding.click(function(e) {
      if (this._shown && !this._closed) {
        this.close();
      }
    }.bind(this));
    
    // Setup layout management.
    this._layoutHandler = this._layout.bind(this);
    window.app.windowSize.addListener(this._layoutHandler);
    this._layout();
  }
  
  // close exits the popup.
  Popup.prototype.close = function() {
    if (!this._shown) {
      throw new Error('cannot close a popup that was not shown');
    } else if (this._closed) {
      return;
    }
    this._closed = true;
    
    this._shielding.css({opacity: 0});
    this._element.addClass('popup-hidden');
    
    // Remove the elements and destroy the popup after a timeout.
    setTimeout(function() {
      this._shielding.remove();
      this._container.remove();
      window.app.windowSize.removeListener(this._layoutHandler);
    }.bind(this), 500);
  };
  
  // show presents the popup to the user. This may only be called once.
  Popup.prototype.show = function() {
    if (this._shown) {
      throw new Error('cannot re-show popup');
    }
    this._shown = true;
    
    var body = $(document.body);
    body.append(this._shielding);
    body.append(this._element);
    
    // Trigger a reflow so that our CSS transitions apply.
    this._shielding[0].offsetHeight;
    this._element[0].offsetHeight;
    
    // Start the presentation animation.
    this._shielding.css({opacity: 1});
    this._element.removeClass('popup-hidden');
  };
  
  // _layout re-positions the popup on the screen.
  Popup.prototype._layout = function() {
    var x = window.app.windowSize.width*this._x -
      this._width/2;
    var y = window.app.windowSize.height*this._y -
      this._height/2;
    
    // Clip the top-left corners of the popup to the window.
    // NOTE: if the window is too small, the window should never go over the
    // left side but it may go over the right.
    if (x + this._width > window.app.windowSize.width) {
      x = window.app.windowSize.width - this._width;
    }
    if (y + this._height > window.app.windowSize.height) {
      y = window.app.windowSize.height - this._height;
    }
    x = Math.max(x, 0);
    y = Math.max(y, 0);
    
    this._element.css({
      left: x,
      top: y
    });
  };
  
  window.app.Popup = Popup;
  
})();