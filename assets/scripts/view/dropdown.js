// The regular OS dropdown looks really lame on most operating systems.
// To combat this problem, we implement a custom dropdown.
(function() {
  
  var DROPDOWN_HEIGHT = 30;
  var ITEM_HEIGHT = 30;
  var MAX_HEIGHT = ITEM_HEIGHT*6;
  
  // A Dropdown manages a custom dropdown menu.
  function Dropdown(width) {
    this._selected = 0;
    this._optionNames = [];
    
    // Generate label.
    this._label = $('<label />');    
    this._arrow = $('<div />', {class: 'arrow'});
    
    // Generate empty options.
    this._options = $('<div />', {class: 'dropdown-options-container'});
    this._scroller = $('<div />', {class: 'dropdown-options-scroller'});
    this._options.append(this._scroller);
    this._options.css({width: width});
    
    // This is used as the callback to capture window resize events while the
    // dropdown is showing.
    this._resizeCallback = this._resize.bind(this);
    
    // This is used to know where to put the dropdown in this._resize().
    this._showingDown = true;
    
    // Generate shielding element for when menu is showing. This prevents the
    // user from clicking elsewhere on the page while viewing the dropdown.
    this._shielding = $('<div />', {class: 'dropdown-shielding'});
    this._shielding.click(this._hide.bind(this));
    
    // Generate element.
    this._element = $('<div />', {class: 'dropdown'});
    this._contents = $('<div />', {class: 'dropdown-contents'});
    this._contents.append(this._label);
    this._contents.append(this._arrow);
    this._contents.css({width: width});
    this._element.append(this._contents);
    
    this._contents.click(this._show.bind(this));
  }
  
  // element gets the element to display on the page.
  Dropdown.prototype.element = function() {
    return this._element;
  };
  
  // setOptions sets the options to an array of strings.
  Dropdown.prototype.setOptions = function(options, selected) {
    this._optionNames = options;
    
    // Generate a new <ul>
    var ul = $('<ul />');
    for (var i = 0, len = options.length; i < len; ++i) {
      var li = $('<li />');
      li.text(options[i]);
      if (i === len - 1) {
        li.css({
          borderBottom: 'none',
          height: ITEM_HEIGHT,
          lineHeight: ITEM_HEIGHT + 'px'
        });
      }
      li.click(this._choose.bind(this, i));
      ul.append(li);
    }
    
    // Remove the old <ul> and insert the new one.
    this._scroller.empty();
    this._scroller.append(ul);
    
    // Setup the sizing stuff.
    this._optionsHeight = Math.min(MAX_HEIGHT, ITEM_HEIGHT*options.length);
    this._innerHeight = ITEM_HEIGHT * options.length;
    this._options.css({height: this._optionsHeight});
    
    this.setSelected(selected || 0);
  };
  
  Dropdown.prototype.setSelected = function(x) {
    this._selected = x;
    this._label.text(this._optionNames[x]);
  };
  
  // _choose is called when an item is clicked.
  Dropdown.prototype._choose = function(i) {
    this._hide();
    this._selected = i;
    this._label.text(this._optionNames[i]);
  };
  
  // _hide hides the dropdown menu.
  Dropdown.prototype._hide = function(e) {
    window.app.windowSize.removeListener(this._resizeCallback);
    this._shielding.detach();
    this._options.detach();
    return false;
  };
  
  // _resize re-positions the dropdown menu to be under/over the dropdown.
  Dropdown.prototype._resize = function() {
    var offset = this._element.offset();
    if (!this._showingDown) {
      offset.top -= this._optionsHeight - 1;
      this._options.offset(offset);
    } else {
      offset.top += DROPDOWN_HEIGHT + 1;
      this._options.offset(offset);
    }
  };
  
  // _show shows the dropdown menu.
  Dropdown.prototype._show = function() {
    // Figure out the appropriate orientation for the dropdown.
    var offset = this._element.offset();
    var docHeight = $(document).height();
    if (offset.top+DROPDOWN_HEIGHT+this._optionsHeight >= docHeight - 10 &&
        offset.top-this._optionsHeight > 0) {
      this._showingDown = false;
    } else {
      this._showingDown = true;
    }
    
    var body = $(document.body);
    body.append(this._shielding);
    body.append(this._options);
    
    // Make sure the dropdown is properly positioned.
    this._resize();
    
    if (this._showingDown) {
      this._scroller.scrollTop(0);
    } else {
      this._scroller.scrollTop(this._innerHeight);
    }
    
    window.app.windowSize.addListener(this._resizeCallback);
  };
  
  window.app.Dropdown = Dropdown;
  
})();