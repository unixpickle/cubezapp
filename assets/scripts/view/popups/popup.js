// Popups provide both information and options to the user. They overlay the
// rest of the page. Popups can be layered on top of one another.
(function() {

  var visiblePopupCount = 0;

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;

  // TITLE_HEIGHT is the height of every dialog's title in pixels.
  var TITLE_HEIGHT = 50;

  // FOOTER_HEIGHT is the height of a dialog's footer in pixels.
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

  // ANIMATION_DURATION is the amount of time to spend animating in a popup.
  var ANIMATION_DURATION = 300;

  // A Popup presents an element to the user in the form of a popup.
  function Popup($element, width, height) {
    window.app.EventEmitter.call(this);

    $element.addClass('popup');

    this._$element = $element;
    this._width = width;
    this._height = height;
    this._$shielding = $('<div class="popup-shielding"></div>');
    this._$shielding.click(this._closeAndEmit.bind(this));

    this._state = STATE_INITIAL;
    this._animation = new Animation(this._$element, this._$shielding);
    this._x = 0.5;
    this._y = 0.45;

    this._setupDragging();
    this._resizeHandler = this._browserResized.bind(this);
  }

  Popup.prototype = Object.create(window.app.EventEmitter.prototype);

  Popup.prototype.close = function() {
    if (this._state !== STATE_SHOWING) {
      return;
    }
    this._state = STATE_CLOSED;
    this._animation.reverse();

    // Disable scrolling again if this was the last showing popup.
    if (--visiblePopupCount === 0) {
      $('body, html').css({overflow: 'hidden'});
    }

    window.app.keyboard.remove(this);
    window.app.windowSize.removeListener(this._resizeHandler);
  };
  
  // keyup allows us to detect the escape key.
  Popup.prototype.keyup = function(e) {
    if (e.which === ESCAPE_KEY) {
      this._closeAndEmit();
    }
    return false;
  };

  // show presents the popup to the user. This may only be called once.
  Popup.prototype.show = function() {
    if (this._state !== STATE_INITIAL) {
      return;
    }
    this._state = STATE_SHOWING;

    window.app.windowSize.addListener(this._resizeHandler);
    window.app.keyboard.push(this);

    this._layout();
    $(document.body).append([this._$shielding, this._$element]);
    this._animation.start();

    // The popup must scroll if it's too large, but the rest of the time the
    // site should not be scrollable or else it will bounce when scrolled on
    // Mac OS X.
    if (0 === visiblePopupCount++) {
      $('body, html').css({overflow: 'auto'});
    }
  };

  Popup.prototype._browserResized = function() {
    this._layout();
  };

  Popup.prototype._closeAndEmit = function() {
    this.close();
    this.emit('close');
  };

  Popup.prototype._layout = function() {
    var x = window.app.windowSize.width*this._x -
      this._width/2;
    var y = window.app.windowSize.height*this._y -
      this._height/2;

    // Clip the top-left corners of the popup to the window.
    // NOTE: if the window is too small, the popup should never go over the left
    // side but it may go over the right.
    if (x + this._width > window.app.windowSize.width) {
      x = window.app.windowSize.width - this._width;
    }
    if (y + this._height > window.app.windowSize.height) {
      y = window.app.windowSize.height - this._height;
    }
    x = Math.max(Math.round(x), 0);
    y = Math.max(Math.round(y), 0);

    this._$element.css({left: x, top: y});
  };

  Popup.prototype._setupDragging = function() {
    // This state tracks the initial point where the user clicked and where the
    // popup was at that time.
    var downPos = null;
    var initialOffset = null;

    // Handle the mousedown event to know wher they're clicking.
    this._$element.mousedown(function(e) {
      var offset = this._$element.offset();
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

  // A Dialog is a popup with a title, content, and buttons.
  function Dialog(titleStr, $content, buttonTitles) {
    var size = this._computeSize($content);
    var $footer = this._generateFooter(buttonTitles);
    var $title = this._generateTitle(titleStr);

    $content.addClass('content');
    var $element = $('<div class="popup-dialog"></div>');
    $element.css({width: size.width, height: size.height});
    $element.append([$title, $content, $footer]);

    // We need to store this for the enter key.
    this._mainButtonIndex = buttonTitles.length - 1;

    Popup.call(this, $element, size.width, size.height);
  }

  Dialog.prototype = Object.create(Popup.prototype);

  // keypress allows us to detect the enter key.
  Dialog.prototype.keypress = function(e) {
    if (e.which === ENTER_KEY) {
      this.emit('action', this._mainButtonIndex);
    }
  };

  Dialog.prototype._computeSize = function($content) {
    $content.css({visibility: 'hidden', position: 'fixed'});
    $(document.body).append($content);
    var width = $content.width() + SIDE_PADDING*2;
    var height = $content.height() + FOOTER_HEIGHT + TITLE_HEIGHT +
      MIDDLE_PADDING*2;
    $content.detach().css({visibility: 'visible', position: 'absolute'});
    return {width: width, height: height};
  };

  Dialog.prototype._generateFooter = function(buttonTitles) {
    var $footer = $('<div class="footer"></div>');
    for (var i = buttonTitles.length-1; i >= 0; --i) {
      var title = buttonTitles[i];
      var $button = $('<button></button>').text(title).click(function(idx) {
        this.emit('action', idx);
      }.bind(this, i));
      if (i === buttonTitles.length-1) {
        $button.addClass('done flavor-background');
      } else {
        $button.addClass('other');
      }
      $footer.append($button);
    }
    return $footer;
  };

  Dialog.prototype._generateTitle = function(titleStr) {
    var $title = $('<div class="title"></div>');
    $title.append($('<label></label>').text(titleStr));

    var $closeButton = $('<button></button>');
    $closeButton.mousedown(function(e) {
      e.stopPropagation();
      return false;
    }).click(this._closeAndEmit.bind(this));

    $title.append($closeButton);
    return $title;
  };

  // Animation is the script-based presentation animator. It uses no CSS3
  // transitions or animations.
  function Animation($popup, $shielding) {
    this._$popup = $popup;
    this._$shielding = $shielding;

    // this._running is true if the animation is running in either direction.
    this._running = false;

    // this._reversed is false if the animation has not been reversed yet.
    this._reversed = false;

    // this._startTime is the timestamp when the current animation was started.
    this._startTime = new Date().getTime();

    // this._waitingFrame is true if the Animation is running and is waiting for
    // a frame update request from an asynchronous source.
    this._waitingFrame = false;

    // Setup initial styles.
    this._$shielding.css({opacity: 0});
    this._$popup.css({
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
  Animation.prototype.reverse = function() {
    var now = new Date().getTime();
    var sinceStart = now - this._startTime;
    this._reversed = true;
    this._startTime = now - Math.max(0, ANIMATION_DURATION - sinceStart);

    // If it's not already animating (i.e. still fading in), we need to restart
    // the animation process.
    if (!this._waitingFrame) {
      this._tick();
    }
  };

  // start runs the animation. This should only be called once.
  Animation.prototype.start = function() {
    if (this._running || this._reversed) {
      throw new Error('cannot re-start animation');
    }
    this._running = true;
    this._startTime = new Date().getTime();
    this._tick();
  };

  Animation.prototype._ease = function(t) {
    // Code taken from https://github.com/mietek/ease
    if (t <= 0) {
      return 0;
    } else if (t >= 1) {
      return 1;
    }
    var a =  1.0042954579734844;
    var b = -6.4041738958415664;
    var c = -7.2908241330981340;
    return a * Math.exp(b * Math.exp(c * t));
  };

  // _showFrame renders a given percentage of the animation.
  Animation.prototype._showFrame = function(pct) {
    var transform;
    if (pct === 1) {
      transform = 'none';
    } else {
      transform = 'translateY(' + ((pct-1)*50) + 'px)';
    }
    this._$shielding.css({opacity: pct});
    this._$popup.css({
      opacity: pct,
      transform: transform,
      webkitTransform: transform,
      MozTransform: transform,
      msTransform: transform
    });
  };

  // _tick applies a frame of the animation.
  Animation.prototype._tick = function() {
    var elapsed = Math.max(new Date().getTime() - this._startTime, 0);
    var progress = elapsed / ANIMATION_DURATION;
    if (progress >= 1) {
      if (this._reversed) {
        this._$popup.remove();
        this._$shielding.remove();
      } else {
        this._showFrame(1);
      }
      this._waitingFrame = false;
      return;
    }

    var easedProgress = this._ease(progress);
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

  window.app.Popup = Popup;
  window.app.Dialog = Dialog;

})();
