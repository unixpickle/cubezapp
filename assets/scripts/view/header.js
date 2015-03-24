(function() {
  
  var DROPDOWN_HEIGHT = 200;
  var PUZZLE_WIDTH = 180;
  var SPACING = 18;
  
  function Header() {
    // Setup the UI elements.
    this._element = $('#header');
    this._nameLabel = this._element.find('.name');
    this._puzzles = new Puzzles();
    
    // Dropdown state.
    this._showingDropdown = false;
    
    // Register event handlers.
    this._nameLabel.click(this._toggle.bind(this));
    this._puzzles.onExit = this._toggle.bind(this);
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
  };
  
  Header.prototype.setActivePuzzle = function(puzzle) {
    this._nameLabel.text(puzzle.name);
  };
  
  Header.prototype.setPuzzles = function(puzzles) {
    this._puzzles.setPuzzles(puzzles);
  };
  
  Header.prototype._toggle = function() {  
    if (this._showingDropdown) {
      // Hide the dropdown.
      this._puzzles.hide();
    } else {
      // Show the dropdown.
      this._puzzles.show();
    }
    this._showingDropdown = !this._showingDropdown;
  };
  
  function Puzzles() {
    // Basic UI components.
    this._element = $('#puzzles');
    this._contents = this._element.find('.contents');
    
    // State information.
    this._showing = false;
    
    // Event handler for clicking the backdrop to exit.
    this.onExit = null;
    
    // Setup the shielding.
    this._shielding = $('<div />');
    this._shielding.css({
      position: 'fixed',
      width: '100%',
      height: '100%',
      display: 'none',
      'background-color': 'rgba(0, 0, 0, 0.5)'
    });
    
    // Insert the shielding div underneath the header. We don't use z-index
    // because it kills animation performance on some browsers.
    this._shielding.insertBefore($('#header'));
    
    // If they click on the background shield, the puzzles list closes.
    this._shielding.click(function() {
      if (!this._showing) {
        return;
      }
      if ('function' !== typeof this.onExit) {
        throw new Error('invalid onExit handler');
      }
      this.onExit();
    }.bind(this));
  }
  
  Puzzles.prototype.hide = function() {
    // Hide the scrollbar if there was one.
    this._contents.css({'overflow-x': 'hidden'});
    
    // Slide away the puzzles dropdown and fade out the shield.
    this._element.stop(true, false);
    this._shielding.stop(true, false);
    this._shielding.fadeOut();
    this._element.slideUp();
    
    // Re-enable keyboard events for other things.
    window.app.keyboard.pop();
    
    this._showing = false;
  };
  
  Puzzles.prototype.setPuzzles = function(puzzles) {
    if (puzzles.length === 0) {
      // Show the giant plus button.
      this._contents.empty();
      var button = $('<button class="big-add">Add</button>');
      this._contents.append(button);
      return;
    }
    
    // Generate the div which will contain the puzzles.
    var contents = $('<div />');
    contents.css({
      height: DROPDOWN_HEIGHT,
      width: puzzles.length*(PUZZLE_WIDTH+SPACING) + SPACING
    });
    
    var x = SPACING;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      var puzzle = puzzles[i];
      var element = $('<div class="puzzle" />');
      
      var label = $('<label />');
      label.text(puzzle.name);
      
      var icon = $('<div />', {class: 'icon theme-background'});
      icon.css({
        'background-image': 'url(images/puzzles/' + puzzle.icon + '.png)'
      });
      element.append(icon);
      element.append(label);
      contents.append(element);
      
      // Hookup the switch event.
      element.click(function(id) {
        if (!this._showing) {
          return;
        }
        
        // Switch to the puzzle and close the dropdown.
        window.app.switchToPuzzle(id);
        if ('function' !== typeof this.onExit) {
          throw new Error('invalid onExit handler');
        }
        this.onExit();
      }.bind(this, puzzle.id));
    }
    
    this._contents.empty();
    this._contents.append(contents);
  };
  
  Puzzles.prototype.show = function() {
    this._element.stop(true, false);
    this._shielding.stop(true, false);
    this._element.slideDown({
      complete: function() {
        this._contents.css({'overflow-x': 'scroll'});
        this._resizeForScrollbar();
      }.bind(this)
    });
    this._shielding.fadeIn();
    
    // Disable keyboard events from other things.
    window.app.keyboard.push({});
    
    this._showing = true;
  };
  
  Puzzles.prototype._resizeForScrollbar = function() {
    // Make the height of the contents DROPDOWN_HEIGHT.
    var clientHeight = this._contents[0].clientHeight ||
      this._contents.height();
    var difference = this._contents.height() - clientHeight;
    this._element.height(DROPDOWN_HEIGHT + difference);
  };
  
  window.app.Header = Header;
  
})();
