(function() {
  
  var DROPDOWN_HEIGHT = 200;
  var PUZZLE_WIDTH = 180;
  var SPACING = 18;
  
  function Header() {
    // Setup the UI elements.
    this._element = $('#header');
    this._elementStyler = new window.app.Styler(this._element[0]);
    this._puzzleActions = this._element.find('.puzzle-actions');
    this._nameLabel = this._element.find('.name');
    this._puzzles = new Puzzles();
    
    // Register event handlers.
    this._nameLabel.click(this._toggle.bind(this));
    this._puzzles.onExit = this._toggle.bind(this);
    this._puzzleActions.find('.add').click(this._add.bind(this));
    this._puzzleActions.find('.remove').click(this._toggleDeleting.bind(this));
  }

  Header.prototype.height = function() {
    return 44;
  };
  
  Header.prototype.layout = function(attrs) {
    if (attrs.headerOpacity === 0) {
      this._elementStyler.css({display: 'none'});
    } else {
      this._elementStyler.css({
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
    
    // If the header is showing, we must update the visibility of the add and
    // remove buttons.
    if (this._puzzles.showing()) {
      if (puzzles.length > 0) {
        this._puzzleActions.fadeIn();
      } else {
        this._puzzleActions.fadeOut();
      }
    }
  };
  
  Header.prototype._add = function() {
    if (this._puzzles.showing()) {
      showAddPopup();
    }
  };
  
  Header.prototype._toggle = function() {  
    if (this._puzzles.showing()) {
      // Hide the dropdown.
      this._puzzles.hide();
      this._puzzleActions.fadeOut();
    } else {
      // Show the dropdown.
      this._puzzles.show();
      if (!this._puzzles.empty()) {
        this._puzzleActions.fadeIn();
      }
    }
  };
  
  Header.prototype._toggleDeleting = function() {
    if (!this._puzzles.showing()) {
      return;
    }
    this._puzzles.setDeleting(!this._puzzles.isDeleting());
  };
  
  function Puzzles() {
    // Basic UI components.
    this._element = $('#puzzles');
    this._contents = this._element.find('.contents');
    this._deleteButtons = null;
    
    // State information.
    this._deleting = false;
    this._empty = true;
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
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
  
  Puzzles.prototype.empty = function() {
    return this._empty;
  };
  
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
    this.setDeleting(false);
  };
  
  Puzzles.prototype.isDeleting = function() {
    return this._deleting;
  };
  
  Puzzles.prototype.setDeleting = function(deleting) {
    if (deleting === this.isDeleting() || this._deleteButtons === null) {
      return;
    }
    
    this._deleting = deleting;
    if (deleting) {
      this._deleteButtons.fadeIn();
    } else {
      this._deleteButtons.fadeOut();
    }
  }
  
  Puzzles.prototype.setPuzzles = function(puzzles) {
    this._deleteButtons = null;
    
    if (puzzles.length === 0) {
      // Show the giant plus button.
      this._empty = true;
      this._contents.empty();
      var button = $('<button class="header-button big-add">Add</button>');
      button.click(this._add.bind(this));
      this._contents.append(button);
      return;
    }
    
    this._empty = false;
    
    // Generate the div which will contain the puzzles.
    var contents = $('<div />');
    contents.css({
      height: DROPDOWN_HEIGHT,
      width: puzzles.length*(PUZZLE_WIDTH+SPACING) + SPACING
    });
    
    // Generate all of the elements for the puzzles dropdown.
    var x = SPACING;
    var deleteButtons = [];
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      // Generate the main puzzle element.
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
      
      // Generate the delete button.
      var deleteButton = $('<button class="delete">Delete</button>');
      deleteButton.css({
        left: x + PUZZLE_WIDTH - 15,
        display: (this.isDeleting() ? 'block' : 'none')
      });
      deleteButton.click(function(id) {
        if (this._showing) {
          this.setDeleting(false);
          window.app.home.deletePuzzle(id);
        }
      }.bind(this, puzzle.id));
      contents.append(deleteButton);
      deleteButtons.push(deleteButton[0]);
      
      // Clicking to the puzzle switches to it.
      element.click(function(id) {
        // If the dropdown was fading out when the user clicked the puzzle, do
        // nothing.
        if (this._showing) {
          window.app.home.switchPuzzle(id);
          if ('function' !== typeof this.onExit) {
            throw new Error('invalid onExit handler');
          }
          this.onExit();
        }
      }.bind(this, puzzle.id));
      
      // Update the x coordinate for the next puzzle.
      x += SPACING + PUZZLE_WIDTH;
    }
    
    this._deleteButtons = $(deleteButtons);
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
  
  Puzzles.prototype.showing = function() {
    return this._showing;
  };
  
  Puzzles.prototype._add = function() {
    if (this.showing()) {
      showAddPopup();
    }
  };
  
  Puzzles.prototype._resizeForScrollbar = function() {
    // Make the height of the contents DROPDOWN_HEIGHT.
    var clientHeight = this._contents[0].clientHeight ||
      this._contents.height();
    var difference = this._contents.height() - clientHeight;
    this._element.height(DROPDOWN_HEIGHT + difference);
  };
  
  function showAddPopup() {
    new window.app.AddPopup().show();
  }
  
  window.app.Header = Header;
  
})();
