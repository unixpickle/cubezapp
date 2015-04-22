(function() {
  
  // This is the height of the dropdown contents.
  var DROPDOWN_HEIGHT = 200;
  
  // This is the width of each puzzle in the dropdown.
  var PUZZLE_WIDTH = 180;
  
  // This is the number of pixels between each element in the dropdown.
  var SPACING = 18;
  
  // These values represent different states of the header.
  var STATE_CLOSED = 0;
  var STATE_OPEN = 1;
  var STATE_DELETING = 2;
  
  function Header() {
    // Setup the UI elements.
    this._$element = $('#header');
    this._$puzzleActions = this._$element.find('.puzzle-actions');
    this._$puzzleName = this._$element.find('.name');
    this._styler = new window.app.Styler(this._$element[0]);
    this._puzzles = new Puzzles();
    
    // Setup the shielding for when the dropdown is down.
    this._$shielding = $('<div></div>');
    this._$shielding.css({
      position: 'fixed',
      width: '100%',
      height: '100%',
      display: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      webkitBackfaceVisibility: 'hidden'
    });
    this._$shielding.insertBefore(this._$element);
    this._$shielding.click(this.close.bind(this));
    
    // Initialize the state.
    this._state = STATE_CLOSED;
    this._hasPuzzles = false;
    
    // this._updatedPuzzles is non-null if the puzzle list was changed while the
    // puzzles dropdown was not open.
    this._updatedPuzzles = null;
    
    // Register event handlers.
    this._$puzzleName.click(this._toggle.bind(this));
    this._puzzles.onAdd = this._add.bind(this);
    this._puzzles.onDelete = this._deletePuzzle.bind(this);
    this._puzzles.onSwitch = this._switchPuzzle.bind(this);
    this._$puzzleActions.find('.add').click(this._add.bind(this));
    this._$puzzleActions.find('.remove').click(this._delete.bind(this));
  }

  Header.prototype.close = function() {
    if (this._state === STATE_CLOSED) {
      return;
    } else if (this._state === STATE_DELETING) {
      this._puzzles.stopDeleting();
    }
    
    // Close the puzzles dropdown.
    this._puzzles.close();
    
    // Fade out the shielding.
    this._$shielding.stop(true, false);
    this._$shielding.fadeOut();
    
    // Fade out the action buttons.
    if (this._hasPuzzles) {
      this._$puzzleActions.stop(true, false).fadeOut();
    }
    
    this._state = STATE_CLOSED;
    
    window.app.keyboard.remove(this);
  };

  Header.prototype.height = function() {
    return 44;
  };
  
  Header.prototype.keydown = function(e) {
    if (e.which === 27) {
      this.close();
    }
    return false;
  };
  
  Header.prototype.layout = function(attrs) {
    if (attrs.headerOpacity === 0) {
      this._styler.css({display: 'none'});
    } else {
      this._styler.css({
        display: 'block',
        opacity: attrs.headerOpacity,
        top: attrs.headerOffset
      });
    }
  };
  
  Header.prototype.open = function() {
    if (this._state !== STATE_CLOSED) {
      return;
    }
    
    // If the puzzles were changed while the header was closed, updated them.
    if (this._updatedPuzzles !== null) {
      this._puzzles.setPuzzles(this._updatedPuzzles);
      this._updatedPuzzles = null;
    }
    
    // Open the puzzles dropdown.
    this._puzzles.open();
    
    // Fade in various things.
    this._$shielding.stop(true, false).fadeIn();
    if (this._hasPuzzles) {
      this._$puzzleActions.stop(true, false).fadeIn();
    }
    
    this._state = STATE_OPEN;
    
    window.app.keyboard.push(this);
  };
  
  Header.prototype.removePuzzle = function(puzzle) {
    // Normal cases.
    switch (this._state) {
    case STATE_DELETING:
      this._puzzles.stopDeleting();
      this._state = STATE_OPEN;
    case STATE_OPEN:
      this._puzzles.removePuzzle(puzzle);
      this._hasPuzzles = (this._puzzles.puzzles().length > 0);
      if (!this._hasPuzzles) {
        this._$puzzleActions.fadeOut();
      }
      break;
    case STATE_CLOSED:
      if (this._updatePuzzles === null) {
        this._updatePuzzles = this._puzzles.puzzles().slice();
      }
      var idx = this._updatePuzzles.indexOf(puzzle);
      if (idx >= 0) {
        this._updatePuzzles.splice(idx, 1);
      }
      this._hasPuzzles = (this._updatedPuzzles.length > 0);
      break;
    default:
      throw new Error('unknown state: ' + this._state);
    }
  };
  
  Header.prototype.setActivePuzzle = function(puzzle) {
    this.setPuzzleName(puzzle.name);
  };
  
  Header.prototype.setPuzzleName = function(name) {
    this._$puzzleName.text(name);
  };
  
  Header.prototype.setPuzzles = function(puzzles) {
    if (this._state === STATE_CLOSED) {
      this._updatedPuzzles = puzzles;
      this._hasPuzzles = (puzzles.length > 0);
      return;
    } else if (this._state === STATE_DELETING) {
      this._puzzles.stopDeleting();
      this._state = STATE_OPEN;
    }
    
    this._puzzles.setPuzzles(puzzles);
    
    // If the last puzzle was removed or the first puzzle was added, we need to
    // fade out/in the action buttons.
    var lastHas = this._hasPuzzles;
    this._hasPuzzles = (puzzles.length > 0);
    if (lastHas === this._hasPuzzles) {
      return;
    }
    if (this._hasPuzzles) {
      this._$puzzleActions.fadeIn();
    } else {
      this._$puzzleActions.fadeOut();
    }
  };
  
  Header.prototype._add = function() {
    if (this._state === STATE_CLOSED) {
      return;
    } else if (this._state === STATE_DELETING) {
      this._puzzles.stopDeleting();
      this._state = STATE_OPEN;
    }
    new window.app.AddPopup().show();
  };
  
  Header.prototype._delete = function() {
    if (this._state === STATE_DELETING) {
      this._puzzles.stopDeleting();
      this._state = STATE_OPEN;
      return;
    } else if (this._state !== STATE_OPEN) {
      return;
    }
    this._puzzles.startDeleting();
    this._state = STATE_DELETING;
  };
  
  Header.prototype._deletePuzzle = function(puzzle) {
    if (this._state !== STATE_DELETING) {
      return;
    }
    this._state = STATE_OPEN;
    this._puzzles.stopDeleting();
    window.app.home.deletePuzzle(puzzle);
  };
  
  Header.prototype._switchPuzzle = function(puzzle) {
    if (this._state !== STATE_OPEN) {
      return;
    }
    this.close();
    window.app.home.switchPuzzle(puzzle);
  };
  
  Header.prototype._toggle = function() {
    switch (this._state) {
    case STATE_DELETING:
    case STATE_OPEN:
      this.close();
      break;
    case STATE_CLOSED:
      this.open();
      break;
    default:
      throw new Error('unknown state: ' + this._state);
    }
  };
  
  // Puzzles manages the puzzles dropdown.
  function Puzzles() {
    // Basic UI components.
    this._$element = $('#puzzles');
    this._$contents = this._$element.find('.contents');
    this._$deleteButtons = $();
    this._puzzles = [];
    this._puzzleElements = [];
    
    // This pre-bound handler is used to capture browser resize events for the
    // scrollbar.
    this._scrollHandler = this._resizeForScrollbar.bind(this);
    
    // Event handlers for adding, deleting and switching.
    this.onAdd = null;
    this.onDelete = null;
    this.onSwitch = null;
  }
  
  // close slides up the dropdown.
  Puzzles.prototype.close = function() {
    // Hide the scrollbar if there was one.
    this._$contents.css({'overflow-x': 'hidden'});
    
    // Slide away the puzzles dropdown.
    this._$element.stop(true, false);
    this._$element.slideUp();
    
    window.app.windowSize.removeListener(this._scrollHandler);
  };
  
  // puzzles returns the current list of puzzles in the header.
  Puzzles.prototype.puzzles = function() {
    return this._puzzles;
  };
  
  // open slides down the dropdown.
  Puzzles.prototype.open = function() {
    // Slide in the dropdown.
    this._$element.stop(true, false);
    this._$element.slideDown({complete: this._doneOpen.bind(this)});
  };
  
  // removePuzzle animates a puzzle disappearing from the list.
  Puzzles.prototype.removePuzzle = function(puzzle) {
    // If there was only one puzzle left, fade it out and show the plus button.
    if (this._puzzles.length === 1) {
      this._puzzles = [];
      this._puzzleElements = [];
      this._$deleteButtons = $();
      
      this._$contents.children('div').fadeOut();
      var button = $('<button class="header-button big-add">Add</button>');
      button.css({display: 'none'});
      button.click(this._add.bind(this));
      this._$contents.append(button);
      button.fadeIn();
      return;
    }
    
    // Find the index of the puzzle.
    var index = -1;
    for (var i = 0, len = this._puzzles.length; i < len; ++i) {
      if (this._puzzles[i].id === puzzle.id) {
        index = i;
        break;
      }
    }
    
    // If the puzzle was not in the list, do nothing.
    if (index < 0) {
      return;
    }
    
    // Fade out the puzzle and remove it from every list.
    this._puzzleElements[index].fadeOut();
    this._puzzleElements.splice(index, 1);
    this._puzzles.splice(index, 1);
    this._$deleteButtons = this._$deleteButtons.not(this._$deleteButtons[index]);
    
    // Move the puzzles which were to the right of the deleted puzzle.
    for (var i = index, len = this._puzzleElements.length; i < len; ++i) {
      var x = SPACING*(i+1) + PUZZLE_WIDTH*i;
      this._puzzleElements[i].animate({left: x});
      $(this._$deleteButtons[i]).animate({left: x + PUZZLE_WIDTH - 15});
    }
    
    // Adjust the size of the content div after the animations are done.
    setTimeout(function() {
      var totalLen = this._puzzles.length;
      var content = this._$contents.children('div');
      content.css({width: SPACING*(totalLen+1) + PUZZLE_WIDTH*totalLen});
      
      // The scrollbar may have vanished.
      this._resizeForScrollbar();
    }.bind(this), 400);
  };
  
  // startDeleting shows all the delete buttons.
  Puzzles.prototype.startDeleting = function() {
    this._$deleteButtons.stop(true, false).fadeIn();
  };
  
  // stopDeleting hides all the delete buttons.
  Puzzles.prototype.stopDeleting = function() {
    this._$deleteButtons.stop(true, false).fadeOut();
  };
  
  // setPuzzles updates the puzzles in the dropdown without any animation.
  Puzzles.prototype.setPuzzles = function(puzzles) {
    this._puzzles = puzzles;
    this._puzzleElements = [];
    this._$deleteButtons = $();
    this._$contents.empty();
    
    // If there's no puzzles, we show a giant add button.
    if (puzzles.length === 0) {
      var button = $('<button class="header-button big-add">Add</button>');
      button.click(this._add.bind(this));
      this._$contents.append(button);
      return;
    }
    
    // Generate the div which will contain the puzzles.
    var contents = $('<div></div>');
    contents.css({
      position: 'relative',
      height: DROPDOWN_HEIGHT,
      width: puzzles.length*(PUZZLE_WIDTH+SPACING) + SPACING
    });
    
    // Generate the puzzle elements and their delete buttons.
    var x = SPACING;
    for (var i = 0, len = puzzles.length; i < len; ++i) {
      // Generate the main puzzle element.
      var puzzle = puzzles[i];
      var element = generatePuzzleElement(puzzle);
      element.css({left: x});
      contents.append(element);
      this._puzzleElements.push(element);
      
      // Clicking the element switches puzzles.
      element.click(function(puzzle) {
        if ('function' !== typeof this.onSwitch) {
          throw new Error('invalid onSwitch callback');
        }
        this.onSwitch(puzzle);
      }.bind(this, puzzle));
      
      // Generate the delete button.
      var deleteButton = $('<button class="delete">Delete</button>');
      deleteButton.css({
        left: x + PUZZLE_WIDTH - 15,
        display: 'none'
      });
      contents.append(deleteButton);
      this._$deleteButtons = this._$deleteButtons.add(deleteButton);
      
      // Clicking the delete button requests a deletion.
      deleteButton.click(function(puzzle) {
        if ('function' !== typeof this.onDelete) {
          throw new Error('invalid onDelete callback');
        }
        this.onDelete(puzzle);
      }.bind(this, puzzle));
      
      // Update the x coordinate for the next puzzle.
      x += SPACING + PUZZLE_WIDTH;
    }
    this._$contents.empty();
    this._$contents.append(contents);
  };
  
  Puzzles.prototype._add = function() {
    if ('function' !== typeof this.onAdd) {
      throw new Error('invalid onAdd callback');
    }
    this.onAdd();
  };
  
  Puzzles.prototype._doneOpen = function() {
    this._$contents.css({'overflow-x': 'auto'});
    this._resizeForScrollbar();
    window.app.windowSize.addListener(this._scrollHandler);
  };
  
  Puzzles.prototype._resizeForScrollbar = function() {
    // Figure out how much space the scrollbar is taking.
    var clientHeight = this._$contents[0].clientHeight ||
      this._$contents.height();
    var difference = this._$contents.height() - clientHeight;
    
    // Compute the new height and set it if needed.
    var newHeight = DROPDOWN_HEIGHT + difference;
    if (newHeight != this._$element.height()) {
      this._$element.height(newHeight);
    }
  };
  
  function generatePuzzleElement(puzzle) {
    var element = $('<div class="puzzle"></div>');
    var label = $('<label></label>');
    label.text(puzzle.name);
    var icon = $('<div class="icon flavor-background"></div>');
    icon.css({
      'background-image': 'url(images/puzzles/' + puzzle.icon + '.png)'
    });
    element.append(icon);
    element.append(label);
    return element;
  }
  
  window.app.Header = Header;
  
})();
