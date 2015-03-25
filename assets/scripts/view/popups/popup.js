// Popups provide both information and options to the user. They overlay the
// rest of the page. Popups can be layered on top of one another.
(function() {
  
  var HEADER_HEIGHT = 50;
  
  // popupStackCount is used to determine if any popups are currently showing.
  var popupStackCount = 0;
  
  // A Popup presents a given element to the user.
  function Popup(element, width, height) {
    // This state makes sure the popup isn't shown or closed more than once.
    this._shown = false;
    this._closed = false;
    
    // Save the constructor arguments
    this._element = element;
    this._width = width;
    this._height = height;
    
    // Relative coordinates of the center of the popup.
    this._x = 0.5;
    this._y = 0.45;
    
    // Generating the shielding element.
    this._shielding = $('<div />', {class: 'popup-shielding'});
    this._shielding.click(function(e) {
      if (this._shown && !this._closed) {
        this.close();
      }
    }.bind(this));
    
    // This is necessary to ensure that the element is styled correctly.
    element.addClass('popup popup-hidden');
    
    // Setup user dragging to move the popup.
    this._setupDragging();
    
    // Setup close button.
    element.find('.title > button').one('click', this.close.bind(this));
    
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
    
    this._shielding.css({opacity: 0, pointerEvents: 'none'});
    this._element.addClass('popup-hidden');
    
    // Disable scrolling again if this was the last showing popup.
    if (--popupStackCount === 0) {
      $('body, html').css({overflow: 'hidden'});
    }
    
    // Re-enable keyboard events.
    window.app.keyboard.remove(this);
    
    // Remove the elements and destroy the popup after a timeout.
    setTimeout(function() {
      this._shielding.remove();
      this._element.remove();
      window.app.windowSize.removeListener(this._layoutHandler);
    }.bind(this), 400);
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
    
    // Disable keyboard events while this popup is in front.
    window.app.keyboard.push(this);
    
    // The popup must scroll if it's too large, but the rest of the time the 
    // site should not be scrollable or else it will bounce on OS X.
    ++popupStackCount;
    $('body, html').css({overflow: 'auto'});
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
  
  // _setupDragging adds event listeners to allow the user to drag the popup.
  Popup.prototype._setupDragging = function() {
    // The user may click on the element itself or on the .title if there is
    // one.
    var downPos = null;
    var initialOffset = null;
    this._element.mousedown(function(e) {
      var offset = this._element.offset();
      if (e.pageY - offset.top > HEADER_HEIGHT) {
        return;
      }
      downPos = [e.pageX, e.pageY];
      initialOffset = offset;
    }.bind(this));
    this._element.find('.title').mousedown(function(e) {
      downPos = [e.pageX, e.pageY];
      initialOffset = this._element.offset();
    }.bind(this));
    
    // Once the mouse is down, the user can drag anywhere in the document.
    $(document).mousemove(function(e) {
      if (downPos === null) {
        return;
      }
      var newX = e.pageX - downPos[0] + initialOffset.left;
      var newY = e.pageY - downPos[1] + initialOffset.top;
      var x = (newX+this._width/2) / window.app.windowSize.width;
      var y = (newY+this._height/2) / window.app.windowSize.height;
      this._x = Math.max(Math.min(x, 1), 0);
      this._y = Math.max(Math.min(y, 1), 0);
      this._layout();
    }.bind(this));
    
    // When they lift the mouse or leave the page, the dragging stops.
    $(document).mouseup(function() {
      downPos = null;
    });
    $(document).mouseleave(function() {
      downPos = null;
    });
  };
  
  window.app.Popup = Popup;
  
})();