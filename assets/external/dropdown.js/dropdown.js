// dropdown.js version 4.0.1
(function() {

  var DEFAULT_BG_COLOR = '#ffffff';
  var DEFAULT_DROPDOWN_HEIGHT = 30;
  var DEFAULT_FONT_HEIGHT_RATIO = 18/30;
  var DOWN_MINIMUM_ITEMS = 4;
  var MINIMUM_MENU_HEIGHT = 60;
  var PAGE_MARGIN = 10;

  // A Dropdown generates and controls the elements involved with a dropdown.
  function Dropdown(width, bgcolor, height, fontSize) {
    // This state can be changed later.
    this._optionNames = [];
    this._selected = 0;

    this._width = width;
    this._height = height || DEFAULT_DROPDOWN_HEIGHT;
    this._fontSize = fontSize || Math.round(DEFAULT_FONT_HEIGHT_RATIO *
      this._height);

    this.onChange = null;

    this._label = $('<label></label>').css({
      height: this._height,
      fontSize: this._fontSize + 'px',
      lineHeight: this._height + 'px'
    });
    var arrow = $('<div class="arrow"></div>').css({
      marginTop: Math.ceil((this._height - 10) / 2),
    });
    this._preview = $('<div class="dropdownjs-preview"></div>').css({
      width: width,
      height: this._height,
      backgroundColor: bgcolor || DEFAULT_BG_COLOR
    });
    this._preview.append([this._label, arrow]);
    this._preview.click(this.open.bind(this));

    this._menu = new Menu(this);
    this._menu.onChange = this._handleSelectionChange.bind(this);
  }

  // close closes the dropdown if it was open.
  Dropdown.prototype.close = function() {
    this._menu.hide();
  };

  // element returns an HTML element which can be displayed for the dropdown.
  Dropdown.prototype.element = function() {
    return this._preview[0];
  };

  // getFontSize returns the font size used by the dropdown.
  Dropdown.prototype.getFontSize = function() {
    return this._fontSize
  };

  // getHeight returns the height of the dropdown.
  Dropdown.prototype.getHeight = function() {
    return this._height;
  };

  // getSelected returns the selected index.
  Dropdown.prototype.getSelected = function() {
    return this._selected;
  };

  // getValue returns the name of the selected element.
  Dropdown.prototype.getValue = function() {
    if (this._optionNames.length === 0) {
      return '';
    }
    return this._optionNames[this._selected];
  };

  // getWidth returns the width of the dropdown.
  Dropdown.prototype.getWidth = function() {
    return this._width;
  };

  // isOpen returns true if the dropdown is open.
  Dropdown.prototype.isOpen = function() {
    return this._menu.isShowing();
  };

  // open opens the dropdown if it was not already open.
  Dropdown.prototype.open = function() {
    if (this._optionNames.length === 0) {
      return;
    }
    this._menu.show();
  };

  // setOptions sets a list of options to show.
  Dropdown.prototype.setOptions = function(list, selected) {
    if (this.isOpen()) {
      throw new Error('cannot set options while open');
    }

    if (list.length === 0) {
      this._optionNames = [];
      this._selected = 0;
      this._label.text('');
      return;
    }

    this._menu.setOptions(list);
    this._optionNames = list.slice();
    this.setSelected(selected || 0);
  };

  // setSelected selects an index in the dropdown.
  Dropdown.prototype.setSelected = function(idx) {
    if (this._optionNames === 0) {
      return;
    }
    this._label.text(this._optionNames[idx]);
    this._selected = idx;
    this._menu.setSelected(idx);
  };

  // setValue selects an index in the dropdown given its name.
  Dropdown.prototype.setValue = function(value) {
    var idx = this._optionNames.indexOf(value);
    if (idx >= 0) {
      this.setSelected(idx);
    }
  };

  Dropdown.prototype._handleSelectionChange = function(idx) {
    this._label.text(this._optionNames[idx]);
    this._selected = idx;
    if ('function' === typeof this.onChange) {
      this.onChange(idx);
    }
  };

  function Menu(dropdown) {
    this._dropdown = dropdown;

    this._showing = false;
    this._down = false;
    this._changeTracker = null;
    this._clickThruHandler = this._clickThru.bind(this);

    this._options = $();
    this._menu = $('<ul class="dropdownjs-menu"></ul>');
    this._container = $('<div class="dropdownjs-menu-container"></div>');
    this._container.append(this._menu);

    this.onChosen = null;
  }

  Menu.prototype.hide = function() {
    if (!this._showing) {
      return;
    }
    this._showing = false;

    this._changeTracker.stop();
    this._changeTracker = null;

    this._container.detach();

    window.clickthru.removeListener(this._clickThruHandler);
  };

  Menu.prototype.isShowing = function() {
    return this._showing;
  };

  Menu.prototype.setOptions = function(list) {
    this._menu.empty();
    this._options = $();
    var rowHeight = this._dropdown.getHeight();
    for (var i = 0, len = list.length; i < len; ++i) {
      var optionElement = $('<li></li>').css({
        height: rowHeight,
        lineHeight: rowHeight + 'px',
        fontSize: this._dropdown.getFontSize() + 'px',
        backgroundSize: rowHeight + 'px ' + rowHeight + 'px'
      }).text(list[i]);
      this._options = this._options.add(optionElement);
      this._menu.append(optionElement);
      optionElement.click(function(idx) {
        if (!this._showing) {
          return;
        }
        this.hide();
        this.setSelected(idx);
        this.onChange(idx);
      }.bind(this, i));
    }
  };

  Menu.prototype.setSelected = function(idx) {
    this._options.removeClass('checked');
    this._options.eq(idx).addClass('checked');
  };

  Menu.prototype.show = function() {
    if (this._showing) {
      return;
    }
    this._showing = true;

    this._changeTracker = new ChangeTracker(this._dropdown.element(),
      this._relayout.bind(this));
    this._layout();

    $(document.body).append(this._container);

    window.clickthru.addListener(this._clickThruHandler);
  };

  Menu.prototype._clickThru = function(e) {
    if (!e.inElement(this._container[0])) {
      this.hide();
    }
  };

  Menu.prototype._layout = function() {
    this._down = this._shouldOpenDown();
    this._relayout(true);
  };

  Menu.prototype._relayout = function(firstTime) {
    var state = this._changeTracker.getState();

    if (!state.elementVisible) {
      this.hide();
      return;
    }

    var extraWidth = scrollbarWidth();

    var left = state.elementLeft;
    var top = 0;
    var width = this._dropdown.getWidth() + extraWidth;
    var height = 0;
    var contentHeight = this._options.length * this._dropdown.getHeight();

    if (width + left > state.bodyWidth) {
      left -= extraWidth;
    }

    if (this._down) {
      height = Math.min(state.bodyHeight - state.elementTop - PAGE_MARGIN,
        contentHeight);
      top = state.elementTop;
    } else {
      height = Math.min(contentHeight, this._dropdown.getHeight() +
        state.elementTop - PAGE_MARGIN);
      top = state.elementTop + this._dropdown.getHeight() - height;
    }

    // If the thing scrolls, make sure the last element is cutoff.
    if (firstTime && height < contentHeight) {
      var remaining = (height % this._dropdown.getHeight());
      var midpoint = this._dropdown.getHeight()/2;
      // If it's already cut near the middle, no need to cut it again.
      if (remaining <= midpoint-3 || remaining >= midpoint+3) {
        height -= remaining + this._dropdown.getHeight()/2;
      }
    }

    this._container.css({
      left: left,
      top: top,
      width: width,
      height: Math.max(height, MINIMUM_MENU_HEIGHT)
    });
  };

  Menu.prototype._shouldOpenDown = function() {
    var dropdownHeight = this._dropdown.getHeight();

    var state = this._changeTracker.getState();
    var minimumDownHeight = DOWN_MINIMUM_ITEMS*this._dropdown.getHeight();

    var upwardsSpace = state.elementTop + this._dropdown.getHeight();
    var downwardsSpace = state.bodyHeight - state.elementTop;

    return downwardsSpace - PAGE_MARGIN >= minimumDownHeight ||
        downwardsSpace > upwardsSpace;
  }

  // A ChangeTracker listens for changes in an element's visibility or position
  // or in the window's size.
  function ChangeTracker(element, callback) {
    this._element = $(element);
    this._callback = callback;

    this._lastAction = new Date().getTime();
    this._lastState = this._computeState();
    this._goingFast = true;

    this._checkInterval = setInterval(this._check.bind(this),
      ChangeTracker.FAST_INTERVAL);

    this._actionCallback = this._externalAction.bind(this);
    $(window).resize(this._actionCallback);
  }

  ChangeTracker.SLOW_INTERVAL = 250;
  ChangeTracker.FAST_DURATION = 1000;
  ChangeTracker.FAST_INTERVAL = 100;

  ChangeTracker.prototype.getState = function() {
    return this._lastState;
  };

  ChangeTracker.prototype.stop = function() {
    clearInterval(this._checkInterval);
    $(window).off('resize', this._actionCallback);
  };

  ChangeTracker.prototype._check = function() {
    var newState = this._computeState();
    var keys = ['elementVisible', 'elementTop', 'elementLeft',
      'bodyWidth', 'bodyHeight'];
    var changed = false;
    for (var keyIdx = 0; keyIdx < keys.length; ++keyIdx) {
      var key = keys[keyIdx];
      if (newState[key] !== this._lastState[key]) {
        changed = true;
        break;
      }
    }

    if (changed) {
      this._lastState = newState;
      this._externalAction();
      this._callback();
    } else if (this._goingFast) {
      var timeSinceAction = new Date().getTime() - this._lastAction;
      if (timeSinceAction > ChangeTracker.FAST_DURATION) {
        this._slowDown();
      }
    }
  };

  ChangeTracker.prototype._computeState = function() {
    var elementOffset = this._element.offset();
    return {
      elementVisible: this._isElementVisible(),
      elementTop: elementOffset.top,
      elementLeft: elementOffset.left,
      bodyWidth: $(document.body).width(),
      bodyHeight: $(document.body).height()
    };
  };

  ChangeTracker.prototype._externalAction = function() {
    if (!this._goingFast) {
      this._goingFast = true;
      clearInterval(this._checkInterval);
      this._checkInterval = setInterval(this._check.bind(this),
        ChangeTracker.FAST_INTERVAL);
    }
    this._lastAction = new Date().getTime();
    this._check();
  };

  ChangeTracker.prototype._isElementVisible = function() {
    var rawElement = this._element[0];
    var visible = false;
    while (rawElement !== null) {
      if (rawElement.style.display === 'none' ||
          rawElement.style.opacity === '0') {
        return false;
      } else if (rawElement === document.body) {
        return true;
      }
      rawElement = rawElement.parentNode;
    }
    return false;
  };

  ChangeTracker.prototype._slowDown = function() {
    this._goingFast = false;
    clearInterval(this._checkInterval);
    this._checkInterval = setInterval(this._check.bind(this),
      ChangeTracker.SLOW_INTERVAL);
  };

  function scrollbarWidth() {
    // Generate a small scrolling element.
    var element = $('<div></div>').css({
      width: 200,
      height: 100,
      overflowY: 'scroll',
      position: 'fixed',
      visibility: 'hidden'
    });

    // Generate a tall element to put inside the small one.
    var content = $('<div></div>').css({height: 300, width: '100%'});
    element.append(content);

    // Append the small element to the body and measure stuff.
    $(document.body).append(element);
    var result = element.width() - content.width();
    element.remove();

    return result;
  }

  window.dropdownjs = {
    Dropdown: Dropdown,
    scrollbarWidth: scrollbarWidth
  };

})();
