// Popups provide both information and options to the user. They overlay the
// rest of the page. Popups can be layered on top of one another.
(function() {
  
  // visiblePopupCount is used to measure the number of active popups.
  var visiblePopupCount = 0;
  
  // TITLE_HEIGHT is the height of every popup's title in pixels.
  var TITLE_HEIGHT = 50;
  
  // FOOTER_HEIGHT is the height of a standard popup's footer in pixels.
  var FOOTER_HEIGHT = 60;
  
  // SIDE_PADDING is the space on the left and right of a dialog.
  var SIDE_PADDING = 20;
  
  // Middle_PADDING is the space on the top and bottom of the content of a
  // dialog.
  var MIDDLE_PADDING = 15;
  
  // These are the states the popup could be in.
  var STATE_INITIAL = 0;
  var STATE_SHOWING = 1;
  var STATE_CLOSED = 2;
  
  // ANIMATION_DURATION is the amount of time required to show the popup in
  // milliseconds.
  var ANIMATION_DURATION = 300;
  
  // CSSAnimation is the CSS-based presentation animator. It uses CSS3
  // transitions to show a popup and its shielding. This works well on Chrome
  // and Firefox, but has occasional bugs in Safari.
  function CSSAnimation(popup, shielding) {
    // Copy the arguments.
    this._popup = popup;
    this._shielding = shielding;
    
    // This is set when start() was called but the transition hasn't been
    // started yet.
    this._startTimeout = null;
    
    // Set the transition properties.
    var shieldingTransition = 'opacity ' + ANIMATION_DURATION/1000 + 's ease';
    this._shielding.css({
      opacity: 0,
      transition: shieldingTransition,
      msTransition: shieldingTransition,
      WebkitTransition: shieldingTransition
    });
    this._popup.css({
      opacity: 0,
      transform: 'translateY(-50px)',
      msTransform: 'translateY(-50px)',
      WebkitTransform: 'translateY(-50px)',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      msTransition: '-ms-transform 0.3s ease, opacity 0.3s ease',
      WebkitTransition: '-webkit-transform 0.3s ease, opacity 0.3s ease',
    });
  }
  
  // reverse starts hiding the popup.
  CSSAnimation.prototype.reverse = function() {
    if (this._startTimeout !== null) {
      // The animation is starting and this is a race condition, so to speak.
      clearInterval(this._startTimeout);
      this._shielding.remove();
      this._popup.remove();
      return;
    }
    
    this._shielding.css({opacity: 0, pointerEvents: 'none'});
    this._popup.css({
      opacity: 0,
      pointerEvents: 'none',
      transform: 'translateY(-50px)',
      msTransform: 'translateY(-50px)',
      WebkitTransform: 'translateY(-50px)',
    });
    setTimeout(function() {
      this._shielding.remove();
      this._popup.remove();
    }.bind(this), ANIMATION_DURATION);
  };
  
  // start begins showing the popup.
  CSSAnimation.prototype.start = function() {
    // We wait on a timeout to make sure there's a reflow.
    this._startTimeout = setTimeout(function() {
      this._startTimeout = null;
      this._shielding.css({opacity: 1});
      this._popup.css({
        opacity: 1,
        transform: 'none',
        msTransform: 'none',
        WebkitTransform: 'none'
      });
    }.bind(this), 0);
  };
  
  // ScriptAnimation is the script-based presentation animator. It uses no CSS3
  // transitions or animations.
  function ScriptAnimation(popup, shielding) {
    // Copy the arguments.
    this._popup = popup;
    this._shielding = shielding;
    
    // this._running is true if the animation is running forwards or backwards.
    this._running = false;
    
    // this._reversed is false if the animation has not been reversed yet.
    this._reversed = false;
    
    // this._reverseJump stores amount of time that the reversed animation
    // should effectively "skip". This will be 0 unless the animation was
    // reversed before it was started.
    this._reverseJump = 0;
    
    // this._startTime is the timestamp when the current animation was started.
    // When the animation is reversed, this is set to the time it was reversed.
    this._startTime = new Date().getTime();
    
    // this._waitingFrame is true if the Animation is running and is waiting for
    // a frame update request from an asynchronous source.
    this._waitingFrame = false;
    
    // Setup initial styles.
    this._shielding.css({opacity: 0});
    this._popup.css({
      opacity: 0,
      transform: 'translateY(-50px)',
      webkitTransform: 'translateY(-50px)',
      MozTransform: 'translateY(-50px)',
      msTransform: 'translateY(-50px)'
    });
  }
  
  // reverse runs the animation in reverse. This should only be called once,
  // after start(). This will remove the popup and shielding from the DOM once
  // it completes.
  ScriptAnimation.prototype.reverse = function() {
    var now = new Date().getTime();
    var sinceStart = now - this._startTime;
    this._reverseJump = Math.max(0, ANIMATION_DURATION - sinceStart);
    this._reversed = true;
    this._startTime = now;
    
    // If it's not already animating (i.e. still fading in), we need to restart
    // the animation process.
    if (!this._waitingFrame) {
      this._tick();
    }
  };
  
  // start runs the animation. This should only be called once.
  ScriptAnimation.prototype.start = function() {
    if (this._running || this._reversed) {
      throw new Error('cannot re-start animation');
    }
    this._running = true;
    this._startTime = new Date().getTime();
    this._tick();
  };
  
  // _showFrame renders a given percentage of the animation.
  ScriptAnimation.prototype._showFrame = function(pct) {
    var transform;
    if (pct === 1) {
      transform = 'none';
    } else {
      transform = 'translateY(' + ((pct-1)*50) + 'px)';
    }
    this._shielding.css({opacity: pct});
    this._popup.css({
      opacity: pct,
      transform: transform,
      webkitTransform: transform,
      MozTransform: transform,
      msTransform: transform
    });
  };
  
  // _tick applies a frame of the animation.
  ScriptAnimation.prototype._tick = function() {
    var elapsed = (new Date().getTime() - this._startTime) + this._reverseJump;
    var progress = elapsed / ANIMATION_DURATION;
    if (progress >= 1) {
      if (this._reversed) {
        this._popup.remove();
        this._shielding.remove();
      } else {
        this._showFrame(1);
      }
      this._waitingFrame = false;
      return;
    }
    
    var easedProgress = 3*Math.pow(progress, 2) - 2*Math.pow(progress, 3);
    if (this._reversed) {
      this._showFrame(1 - easedProgress);
    } else {
      this._showFrame(easedProgress);
    }
    
    this._waitingFrame = true;
    if ('function' === typeof window.requestAnimationFrame) {
      window.requestAnimationFrame(this._tick.bind(this));
    } else {
      setTimeout(this._tick.bind(this), 1000/60);
    }
  };
  
  // For now, CSS animations have problems in all major browsers.
  var Animation = ScriptAnimation;
  /*if (navigator.userAgent.indexOf('Chrome') > -1) {
    Animation = CSSAnimation;
  }*/
  
  
  // A Popup presents an element to the user in the form of a popup.
  function Popup(element, width, height) {
    // this._state allows us to validate various operations.
    this._state = STATE_INITIAL;
    
    // Save the constructor arguments. Note that the width and height are
    // static.
    this._element = element;
    this._width = width;
    this._height = height;
    
    // Make sure the element has the right class to be treated as a popup.
    element.addClass('popup');
    
    // These coordinates allow us to position the popup relative to the window
    // size.
    this._x = 0.5;
    this._y = 0.45;
    
    // Generate the semi-opaque shield which goes behind the popup.
    this._shielding = $('<div class="popup-shielding"></div>');
    this._shielding.click(this.close.bind(this));
    
    // this._animation controls the visibility of the popup.
    this._animation = new Animation(this._element, this._shielding);
    
    // Setup user dragging to move the popup.
    this._setupDragging();
    
    // this._layoutHandler is a pre-binded callback handler that will later be
    // used to track window resize events.
    this._layoutHandler = this._layout.bind(this);
  }
  
  // close exits the popup.
  Popup.prototype.close = function() {
    if (this._state !== STATE_SHOWING) {
      return;
    }
    this._state = STATE_CLOSED;
    
    // Hide the popup.
    this._animation.reverse();
    
    // Disable scrolling again if this was the last showing popup.
    if (--visiblePopupCount === 0) {
      $('body, html').css({overflow: 'hidden'});
    }
    
    // Stop capturing keyboard events and browser resizes.
    window.app.keyboard.remove(this);
    window.app.windowSize.removeListener(this._layoutHandler);
  };
  
  // show presents the popup to the user. This may only be called once.
  Popup.prototype.show = function() {
    // Consult this._state to make sure everything works smoothly.
    if (this._state !== STATE_INITIAL) {
      return;
    }
    this._state = STATE_SHOWING;
    
    // Handle window resize events and layout the popup.
    window.app.windowSize.addListener(this._layoutHandler);
    this._layout();
    
    // Capture keyboard events while this popup is in front.
    window.app.keyboard.push(this);
    
    // Append the elements to the body and show them!
    var body = $(document.body);
    body.append([this._shielding, this._element]);
    this._animation.start();
    
    // The popup must scroll if it's too large, but the rest of the time the 
    // site should not be scrollable or else it will bounce when scrolled on
    // Mac OS X.
    if (0 === visiblePopupCount++) {
      $('body, html').css({overflow: 'auto'});
    }
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
    x = Math.max(Math.round(x), 0);
    y = Math.max(Math.round(y), 0);
    
    this._element.css({
      left: x,
      top: y
    });
  };
  
  // _setupDragging adds event listeners to allow the user to drag the popup.
  Popup.prototype._setupDragging = function() {
    // This state tracks the initial point where the user clicked and where the
    // popup was at that time.
    var downPos = null;
    var initialOffset = null;
    
    // Handle the mousedown event to know wher they're clicking.
    this._element.mousedown(function(e) {
      var offset = this._element.offset();
      if (e.pageY - offset.top > TITLE_HEIGHT) {
        return;
      }
      downPos = [e.pageX, e.pageY];
      initialOffset = offset;
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
  
  // A Dialog is a popup with a title, some content, and a set of buttons on the
  // bottom.
  function Dialog(titleStr, content, buttons) {
    // Get the dimensions of the popup.
    content.css({visibility: 'hidden', position: 'fixed'});
    $(document.body).append(content);
    var width = content.width() + SIDE_PADDING*2;
    var height = content.height() + FOOTER_HEIGHT + TITLE_HEIGHT +
      MIDDLE_PADDING*2;
    content.detach();
    content.css({visibility: 'visible', position: 'absolute'});
    
    // Generate title bar.
    var title = $('<div class="title"></div>');
    title.append($('<label></label>').text(titleStr));
    title.append($('<button></button>').click(this.close.bind(this)));
    
    // Generate footer.
    var footer = $('<div class="footer"></div>');
    for (var i = buttons.length-1; i >= 0; --i) {
      var button = $('<button></button>').text(buttons[i]).click(function(n) {
        if ('function' === typeof this.onAction) {
          this.onAction(n);
        }
      }.bind(this, buttons[i]));
      if (i === buttons.length-1) {
        button.addClass('done theme-background');
      } else {
        button.addClass('other');
      }
      footer.append(button);
    }
    
    // Generate the full element.
    content.addClass('content');
    var element = $('<div class="popup-dialog"></div>');
    element.css({width: width, height: height});
    element.append([title, content, footer]);
    
    // Generate the popup, computing the total height in the process.
    Popup.call(this, element, width, height);
    
    // We need to store this for the enter key.
    this._mainButton = content[content.length - 1];
    
    // Event listeners.
    this.onAction = null;
  }
  
  Dialog.prototype = Object.create(Popup.prototype);
  
  // keypress allows us to detect the enter key.
  Dialog.prototype.keypress = function(e) {
    if (e.which === 13 && 'function' === typeof this.onAction) {
      // Submit the main button.
      this.onAction(this._mainButton);
    }
  };
  
  // keyup allows us to detect the escape key.
  Dialog.prototype.keyup = function(e) {
    if (e.which === 27) {
      this.close();
    }
    return false;
  };
  
  window.app.Popup = Popup;
  window.app.Dialog = Dialog;
  
})();