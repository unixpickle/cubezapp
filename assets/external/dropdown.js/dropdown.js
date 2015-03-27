(function() {
  
  var DROPDOWN_HEIGHT = 30;
  var ITEM_HEIGHT = 30;
  var PAGE_MARGIN = 10;
  
  // A Dropdown generates and controls the elements involved with a dropdown.
  function Dropdown(width, bgcolor) {
    // This information can be changed as elements are modified or selected.
    this._optionNames = [];
    this._selected = 0;
    this._width = width;
    this._bgColor = bgcolor || [1, 1, 1];
    
    // Event handler for change events.
    this.onChange = null;
    
    // This is used to layout the dropdown.
    this._metrics = null;
    
    // This callback is used while the dropdown is showing.
    this._resizeCallback = this._resize.bind(this);
    
    // Generate the preview element to show to the user before they click.
    this._label = $('<label></label>');
    this._arrow = $('<div></div>');
    this._preview = $('<div class="dropdownjs-preview"></div>').css({
      width: width,
      backgroundColor: colorToHTML(this._bgColor)
    });
    var content = $('<div class="dropdownjs-preview-content"></div>');
    content.append([this._label, this._arrow]);
    this._preview.append(content);
    this._preview.click(this._show.bind(this));
    
    // Generate the shielding element.
    this._shielding = $('<div class="dropdownjs-shielding"></div>');
    this._shielding.click(this._hide.bind(this));
    
    // Generate the menu which will popup.
    this._menuContainer = $('<div class="dropdownjs-menu-container"></div>');
    this._menu = $('<ul class="dropdownjs-menu"></ul>');
    this._options = $();
    this._menuContainer.append(this._menu);
  }
  
  // element returns an HTML element which can be displayed for the dropdown.
  Dropdown.prototype.element = function() {
    return this._preview[0];
  };
  
  // isOpen returns true if the dropdown is open.
  Dropdown.prototype.isOpen = function() {
    return this._metrics !== null;
  };
  
  // selected returns the selected index.
  Dropdown.prototype.selected = function() {
    return this._selected;
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
    
    // Generate list elements.
    this._menu.empty();
    this._options = $();
    for (var i = 0, len = list.length; i < len; ++i) {
      var element = $('<li></li>');
      element.text(list[i]);
      this._options = this._options.add(element);
      this._menu.append(element);
      element.click(function(idx) {
        if (this.isOpen()) {
          this._hide();
          this.setSelected(idx);
          if ('function' === typeof this.onChange) {
            this.onChange();
          }
        }
      }.bind(this, i));
    }
    
    this._optionNames = list.slice();
    this.setSelected(selected || 0);
  };
  
  // setSelected selects an index in the dropdown.
  Dropdown.prototype.setSelected = function(selected) {
    if (this._optionNames === 0) {
      return;
    }
    
    this._label.text(this._optionNames[selected]);
    this._selected = selected;
    
    // Change the classes of all the options.
    this._options.removeClass('checked');
    this._options.eq(this._selected).addClass('checked');
  };
  
  // setSelectedValue selects an index in the dropdown given its name.
  Dropdown.prototype.setSelectedValue = function(v) {
    var idx = this._optionNames.indexOf(v);
    if (idx >= 0) {
      this.setSelected(idx);
    }
  };
  
  // value returns the name of the selected element.
  Dropdown.prototype.value = function() {
    if (this._optionNames.length === 0) {
      return '';
    }
    return this._optionNames[this._selected];
  };
  
  Dropdown.prototype._hide = function() {
    if (!this.isOpen()) {
      return;
    }
    
    this._metrics = null;
    this._shielding.detach();
    this._menuContainer.detach();
    
    $(window).off('resize', this._resizeCallback);
  };
  
  Dropdown.prototype._resize = function() {
    this._metrics.resized();
    this._menuContainer.css({
      left: this._metrics.left,
      top: this._metrics.top,
      width: this._metrics.width,
      height: this._metrics.viewHeight
    });
  };
  
  Dropdown.prototype._show = function() {
    if (this.isOpen() || this._optionNames.length === 0) {
      return;
    }
    
    // Setup the new state.
    this._metrics = new Metrics(this);
    this._menuContainer.css({
      left: this._metrics.left,
      top: this._metrics.top,
      width: this._metrics.width,
      height: this._metrics.viewHeight
    });
    
    // Add the elements to the DOM.
    $(document.body).append(this._shielding);
    $(document.body).append(this._menuContainer);
    
    // Setup resizing events.
    $(window).resize(this._resizeCallback);
  };
  
  // Metrics manages the layout of a dropdown menu.
  function Metrics(dropdown) {
    this.dropdown = dropdown;
    
    // Compute the position of the dropdown preview.
    var offset = dropdown._preview.offset();
    offset.bottom = offset.top + DROPDOWN_HEIGHT;
    
    // Compute the height of the document and the menu content.
    var docHeight = $(document.body).height();
    this.requestedHeight = dropdown._optionNames.length * ITEM_HEIGHT;
    
    // Compute the direction, height, and scrollability of the dropdown.
    this.down = true;
    this.viewHeight = this.requestedHeight;
    this.scrolls = false;
    if (offset.top + this.requestedHeight > docHeight - PAGE_MARGIN) {
      if (offset.bottom > docHeight - offset.top) {
        // Go up instead of down. 
        this.down = false;
        if (this.requestedHeight > offset.bottom) {
          this.scrolls = true;
          this.viewHeight = offset.bottom - PAGE_MARGIN;
        } else {
          this.viewHeight = this.requestedHeight - PAGE_MARGIN;
        }
      } else {
        // Go down but scroll
        this.viewHeight = docHeight - offset.top - PAGE_MARGIN;
        this.scrolls = true;
      }
    } else {
      this.viewHeight = this.requestedHeight;
    }
    
    // Compute the width of the dropdown.
    this.width = dropdown._preview.width() + scrollbarWidth();
    
    // TODO: translate the view to the left if the scrollbar goes over the side
    // of the body.
    
    // Compute the coordinates of the dropdown.
    this.left = offset.left;
    if (this.down) {
      this.top = offset.top;
    } else {
      this.top = offset.bottom - this.viewHeight;
    }
  }
  
  Metrics.prototype.resized = function() {
    // Compute the height of the document and the menu content.
    var docHeight = $(document.body).height();
    
    // Compute the position of the dropdown preview.
    var offset = this.dropdown._preview.offset();
    offset.bottom = offset.top + DROPDOWN_HEIGHT;
    
    // Compute the new height.
    if (this.down) {
      this.viewHeight = Math.min(docHeight - offset.top - PAGE_MARGIN,
        this.requestedHeight);
    } else {
      this.viewHeight = Math.min(offset.bottom - PAGE_MARGIN,
        this.requestedHeight);
    }
    this.viewHeight = Math.max(this.viewHeight, ITEM_HEIGHT*2);
    
    // Compute the coordinates of the dropdown.
    this.left = offset.left;
    if (this.down) {
      this.top = offset.top;
    } else {
      this.top = offset.bottom - this.viewHeight;
    }
  };
  
  function colorToHTML(color) {
    return 'rgba(' + Math.floor(color[0]*255) + ', ' +
      Math.floor(color[1]*255) + ', ' + Math.floor(color[2]*255) + ', 1)';
  }
  
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